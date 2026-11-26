import {
  ContainerRegistrationKeys,
  Modules,
  PaymentWebhookEvents,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { Sentry } from "../lib/sentry"
import {
  ONEPAY_APP_ID,
  ONEPAY_TOKEN,
  ONEPAY_BASE_URL,
} from "../lib/constants"
import {
  listAttempts,
  updateAttempt,
  setSessionOverride,
  type OnepayAttempt,
} from "../modules/onepay-payment/attempts"

/**
 * Onepay order recovery.
 *
 * Covers: customer paid but closed the tab / lost connection, webhook never
 * matched, or paid on a payment link that checkout had since replaced.
 * Every issued link is in the attempts ledger (see attempts.ts). For each
 * recent attempt we ask Onepay for the real status and, when it is paid and
 * the cart still has no order, finish the order through the normal
 * payment-webhook path (same as koko/mintpay reconcile).
 */

const MIN_AGE_MS = 90_000 // give the normal return/webhook flow a head start
const MAX_AGE_MS = 48 * 3600_000
const PROVIDER_EVENT = "onepay_onepay"

function interpret(raw: any): { paid: boolean; failed: boolean; amount?: number } {
  const node = raw && typeof raw === "object" && raw.data ? raw.data : raw
  const msg = String(node?.status_message ?? raw?.status_message ?? "").toUpperCase()
  const num =
    typeof node?.status === "number"
      ? node.status
      : typeof raw?.status === "number"
      ? raw.status
      : undefined
  const bool = typeof node?.status === "boolean" ? node.status : undefined
  return {
    paid: msg === "SUCCESS" || num === 1 || bool === true,
    failed:
      msg === "FAILED" || msg === "CANCELLED" || num === 0 || num === 2 || bool === false,
    amount: node?.amount != null ? Number(node.amount) : undefined,
  }
}

async function fetchStatus(txnId: string) {
  const res = await fetch(`${ONEPAY_BASE_URL}/v3/transaction/status/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: ONEPAY_TOKEN! },
    body: JSON.stringify({ app_id: ONEPAY_APP_ID, onepay_transaction_id: txnId }),
  })
  return JSON.parse(await res.text())
}

export default async function onepayReconcileJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  if (!ONEPAY_APP_ID || !ONEPAY_TOKEN) return

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const eventBus = container.resolve(Modules.EVENT_BUS)

  const attempts = (await listAttempts(MIN_AGE_MS, MAX_AGE_MS)).filter(
    // needs_review is retried too: the cart can become matchable later
    // (e.g. the customer comes back to checkout and a new session exists).
    (a) => a.status === "pending" || a.status === "needs_review"
  )
  if (!attempts.length) return

  let recovered = 0
  let review = 0

  const emit = (sessionId: string, a: OnepayAttempt) =>
    eventBus.emit(
      {
        name: PaymentWebhookEvents.WebhookReceived,
        data: {
          provider: PROVIDER_EVENT,
          payload: {
            data: {
              transaction_id: a.txn_id,
              status: 1,
              status_message: "SUCCESS",
              additional_data: sessionId,
              amount: a.amount,
            },
            rawData: "",
            headers: {},
          },
        },
      },
      { delay: 0, attempts: 3 }
    )

  const flag = async (a: OnepayAttempt, note: string) => {
    review++
    const already = a.status === "needs_review"
    await updateAttempt(a.txn_id, { status: "needs_review", note })
    if (already) return // alerted on the first pass; keep retrying quietly
    const msg = `[onepay-reconcile] PAID BUT NOT MATCHED: txn=${a.txn_id} amount=${a.amount} ${a.currency} email=${a.email} phone=${a.phone} cart=${a.cart_id} — ${note}`
    logger.error(msg)
    Sentry.captureMessage(msg, { level: "error", tags: { payment_provider: "onepay" } })
  }

  for (const a of attempts) {
    try {
      const { paid, failed, amount } = interpret(await fetchStatus(a.txn_id))

      if (failed) {
        await updateAttempt(a.txn_id, { status: "failed" })
        continue
      }
      if (!paid) {
        if (Date.now() - a.created_at > 24 * 3600_000) {
          await updateAttempt(a.txn_id, { status: "expired" })
        }
        continue
      }

      // PAID. Does its cart already have an order?
      let cart: any = null
      if (a.cart_id) {
        const { data } = await query.graph({
          entity: "cart",
          filters: { id: a.cart_id },
          fields: ["id", "completed_at", "total", "payment_collection.id", "payment_collection.payment_sessions.id", "payment_collection.payment_sessions.provider_id", "payment_collection.payment_sessions.status"],
        })
        cart = data[0] ?? null
      }
      if (cart?.completed_at) {
        await updateAttempt(a.txn_id, { status: "done" })
        continue
      }

      // Original session still alive and pending -> normal path.
      const { data: own } = await query.graph({
        entity: "payment_session",
        filters: { id: a.session_id },
        fields: ["id", "status"],
      })
      if (own[0]) {
        if (own[0].status === "pending" || own[0].status === "requires_more") {
          await emit(a.session_id, a)
          await updateAttempt(a.txn_id, { status: "recovered", note: "replayed webhook on original session" })
          recovered++
        } else {
          // authorized/captured but cart not completed: let the webhook retry finish it
          await emit(a.session_id, a)
          await updateAttempt(a.txn_id, { status: "recovered", note: `replayed, session was ${own[0].status}` })
          recovered++
        }
        continue
      }

      // Orphan: session was replaced. Attach the paid txn to the cart's
      // current Onepay session, but only if the money matches the cart.
      if (!cart) {
        await flag(a, "orphaned payment and no cart link (older attempt)")
        continue
      }
      const paidAmount = amount ?? a.amount
      if (Math.abs(Number(cart.total) - paidAmount) > 0.01) {
        await flag(a, `cart total ${cart.total} differs from paid ${paidAmount} (cart changed after payment)`)
        continue
      }
      // Newest Onepay session on the cart. A session marked "error" (the
      // return page checked a replaced, unpaid link) is fine to re-use: the
      // override makes authorization check the paid transaction instead.
      const current = (cart.payment_collection?.payment_sessions ?? [])
        .filter(
          (s: any) =>
            s?.provider_id === "pp_onepay_onepay" &&
            ["pending", "requires_more", "error"].includes(s.status)
        )
        .pop()
      if (!current) {
        await flag(a, "orphaned payment and cart has no live Onepay session")
        continue
      }
      await setSessionOverride(current.id, a.txn_id)
      await emit(current.id, a)
      await updateAttempt(a.txn_id, { status: "recovered", note: `attached to session ${current.id}` })
      recovered++
    } catch (e: any) {
      logger.error(`[onepay-reconcile] ${a.txn_id}: ${e.message}`)
    }
  }

  logger.info(`[onepay-reconcile] checked ${attempts.length}, recovered ${recovered}, needs review ${review}`)
}

export const config = {
  name: "onepay-reconcile",
  schedule: "*/5 * * * *",
}
