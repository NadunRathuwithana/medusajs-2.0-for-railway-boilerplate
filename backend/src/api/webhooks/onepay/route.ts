import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getAttempt } from "../../../modules/onepay-payment/attempts"
import { reconcileAttempt } from "../../../jobs/onepay-reconcile"
import { Sentry } from "../../../lib/sentry"

/**
 * Onepay webhook. The payload is NOT trusted: it only tells us which
 * transaction to look at. We settle it the same way as the callback and the
 * reconcile job: the txn must be one we issued (attempts ledger) and Onepay's
 * own status API must say it is paid. A forged webhook can no longer mark any
 * payment session (e.g. COD) as captured.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const b = (req.body ?? {}) as any
  const txn = typeof b.transaction_id === "string" ? b.transaction_id.slice(0, 64) : ""
  try {
    const attempt = txn ? await getAttempt(txn) : null
    if (!attempt) {
      console.warn(`[onepay-webhook] ignored unknown txn=${txn || "(none)"}`)
    } else {
      const outcome = await reconcileAttempt(req.scope, attempt)
      console.log(`[onepay-webhook] txn=${txn}: ${outcome}`)
    }
  } catch (e: any) {
    console.error(`[onepay-webhook] txn=${txn} error: ${e?.message}`)
    Sentry.captureException(e, { tags: { payment_provider: "onepay", webhook: "true" } })
  }
  // Always 200 so Onepay doesn't retry forever; the reconcile job is the backstop.
  res.status(200).json({ received: true })
}
