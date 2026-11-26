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
import { getRedisClient } from "../lib/redis"

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

// Runs every minute. Customers close the tab right after paying, so the
// server must create the order itself within seconds of the payment, not
// wait for the browser. Fresh links (< 30 min) are checked every minute;
// older ones every 5 minutes to keep Onepay API calls low.
const MIN_AGE_MS = 3_000
const HOT_MS = 30 * 60_000
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const WATCH_MS = 15 * 60_000 // a payment link stays "hot" for 15 minutes
const WATCH_EVERY_MS = 5_000

/**
 * Runs every minute and, inside that minute, keeps watching every recently
 * opened payment link every 5 seconds. So when a customer pays and closes the
 * tab straight away, the server itself creates the order within ~5 seconds.
 * The browser is never required. Older links get a slower full sweep.
 */
export default async function onepayReconcileJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  if (!ONEPAY_APP_ID || !ONEPAY_TOKEN) return

  // One runner at a time (a slow minute must not overlap the next one).
  const redis = getRedisClient()
  if (redis) {
    const got = await redis.set("onepay:reconcile:lock", String(Date.now()), "EX", 58, "NX").catch(() => "OK")
    if (got !== "OK") return
  }

  let recovered = 0
  let review = 0
  const settle = async (list: OnepayAttempt[]) => {
    for (const a of list) {
      try {
        const out = await reconcileAttempt(container, a)
        if (out === "recovered") {
          recovered++
          logger.info(`[onepay-reconcile] order finished server-side for txn ${a.txn_id} (cart ${a.cart_id})`)
        }
        if (out === "review") review++
      } catch (e: any) {
        logger.error(`[onepay-reconcile] ${a.txn_id}: ${e.message}`)
      }
    }
  }
  const retryable = (a: OnepayAttempt) =>
    // needs_review is retried too: the cart can become matchable later.
    // "recovered" too: if the replayed webhook failed to finish the order,
    // keep retrying (a completed cart just marks it done).
    a.status === "pending" || a.status === "needs_review" || a.status === "recovered"

  // Full sweep every 5 minutes (links up to 48h old), otherwise the last 30 min.
  const everyFive = new Date().getMinutes() % 5 === 0
  await settle((await listAttempts(MIN_AGE_MS, everyFive ? MAX_AGE_MS : HOT_MS)).filter(retryable))

  // Then watch fresh links every 5s for the rest of this minute.
  const until = Date.now() + Number(process.env.ONEPAY_WATCH_WINDOW_MS ?? 50_000)
  while (Date.now() + WATCH_EVERY_MS < until) {
    await sleep(WATCH_EVERY_MS)
    const hot = (await listAttempts(3_000, WATCH_MS)).filter(
      (a) => a.status === "pending" || a.status === "recovered"
    )
    if (hot.length) await settle(hot)
  }

  if (recovered || review) {
    logger.info(`[onepay-reconcile] recovered ${recovered}, needs review ${review}`)
  }
}

export const config = {
  name: "onepay-reconcile",
  schedule: "* * * * *",
}
