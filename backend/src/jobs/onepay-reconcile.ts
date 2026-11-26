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

type Outcome = "recovered" | "review" | "done" | "failed" | "pending" | "expired"

/**
 * Settle one Onepay attempt: ask Onepay for the truth and, when paid with no
 * order yet, finish the order through the normal payment-webhook path.
 * Used by the cron job below and by the /api/collect callback (immediately).
 */
export async function reconcileAttempt(
  container: MedusaContainer,
  a: OnepayAttempt,
  knownStatus?: any
): Promise<Outcome> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const eventBus = container.resolve(Modules.EVENT_BUS)

  const emit = (sessionId: string) =>
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

  const flag = async (note: string): Promise<Outcome> => {
    const already = a.status === "needs_review"
    await updateAttempt(a.txn_id, { status: "needs_review", note })
    if (!already) {
      const msg = `[onepay-reconcile] PAID BUT NOT MATCHED: txn=${a.txn_id} amount=${a.amount} ${a.currency} email=${a.email} phone=${a.phone} cart=${a.cart_id} — ${note}`
      logger.error(msg)
      Sentry.captureMessage(msg, { level: "error", tags: { payment_provider: "onepay" } })
    }
    return "review"
  }

  const { paid, failed, amount } = interpret(knownStatus ?? (await fetchStatus(a.txn_id)))

  if (failed) {
    await updateAttempt(a.txn_id, { status: "failed" })
    return "failed"
  }
  if (!paid) {
    if (Date.now() - a.created_at > 24 * 3600_000) {
      await updateAttempt(a.txn_id, { status: "expired" })
      return "expired"
    }
    return "pending"
  }

  // PAID. Does its cart already have an order?
  let cart: any = null
  if (a.cart_id) {
    const { data } = await query.graph({
      entity: "cart",
      filters: { id: a.cart_id },
      fields: ["id", "completed_at", "total", "payment_collection.id", "payment_collection.payments.data", "payment_collection.payment_sessions.id", "payment_collection.payment_sessions.provider_id", "payment_collection.payment_sessions.status"],
    })
    cart = data[0] ?? null
  }
  if (cart?.completed_at) {
    // Is THIS transaction the one the order was paid with? If not, the
    // customer was charged twice for one order: flag it for a refund.
    const usedTxns = (cart.payment_collection?.payments ?? [])
      .map((p: any) => p?.data?.ipg_transaction_id)
      .filter(Boolean)
    if (usedTxns.length && !usedTxns.includes(a.txn_id)) {
      return flag(`DUPLICATE PAYMENT: order already paid with ${usedTxns.join(",")}. Refund this one.`)
    }
    await updateAttempt(a.txn_id, { status: "done" })
    return "done"
  }

  // Original session still exists -> normal path (authorize re-verifies).
  const { data: own } = await query.graph({
    entity: "payment_session",
    filters: { id: a.session_id },
    fields: ["id", "status"],
  })
  if (own[0]) {
    await emit(a.session_id)
    await updateAttempt(a.txn_id, { status: "recovered", note: `replayed on original session (${own[0].status})` })
    return "recovered"
  }

  // Orphan: session was replaced. Attach the paid txn to the cart's
  // current Onepay session, but only if the money matches the cart.
  if (!cart) return flag("orphaned payment and no cart link (older attempt)")
  const paidAmount = amount ?? a.amount
  if (Math.abs(Number(cart.total) - paidAmount) > 0.01) {
    return flag(`cart total ${cart.total} differs from paid ${paidAmount} (cart changed after payment)`)
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
  if (!current) return flag("orphaned payment and cart has no live Onepay session")
  await setSessionOverride(current.id, a.txn_id)
  await emit(current.id)
  await updateAttempt(a.txn_id, { status: "recovered", note: `attached to session ${current.id}` })
  return "recovered"
}

export default async function onepayReconcileJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  if (!ONEPAY_APP_ID || !ONEPAY_TOKEN) return

  const attempts = (await listAttempts(MIN_AGE_MS, MAX_AGE_MS)).filter(
    // needs_review is retried too: the cart can become matchable later
    // (e.g. the customer comes back to checkout and a new session exists).
    // "recovered" too: if the replayed webhook failed to finish the order,
    // keep retrying (a completed cart just marks it done).
    (a) => a.status === "pending" || a.status === "needs_review" || a.status === "recovered"
  )
  if (!attempts.length) return

  let recovered = 0
  let review = 0
  for (const a of attempts) {
    try {
      const out = await reconcileAttempt(container, a)
      if (out === "recovered") recovered++
      if (out === "review") review++
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
