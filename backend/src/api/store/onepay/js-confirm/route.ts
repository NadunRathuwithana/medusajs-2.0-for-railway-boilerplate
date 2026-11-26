import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { loadCartForOnepay, onepayStatus } from "../../../../lib/onepay-js"
import { getAttempt, recordAttempt, setSessionOverride } from "../../../../modules/onepay-payment/attempts"

// Called after the Onepay.js overlay reports success. Verifies with Onepay
// (never trusts the browser), then points the cart's session at that txn so
// placeOrder() can authorize it.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { cart_id, transaction_id } = (req.body ?? {}) as { cart_id?: string; transaction_id?: string }
  const loaded = cart_id && transaction_id ? await loadCartForOnepay(req.scope, cart_id) : null
  if (!loaded?.session) return res.status(404).json({ ok: false, message: "No active Onepay session" })
  const { cart, session } = loaded

  const raw = await onepayStatus(transaction_id!)
  const node = raw?.data ?? raw
  const msg = String(node?.status_message ?? "").toUpperCase()
  const paid = msg === "SUCCESS" || node?.status === 1
  if (!paid) return res.json({ ok: false, pending: true })

  const paidAmount = Number(node?.amount)
  if (Number.isFinite(paidAmount) && Math.abs(paidAmount - Number(cart.total)) > 0.01) {
    return res.status(409).json({ ok: false, message: "Amount mismatch" })
  }
  // The txn must belong to this cart: either issued for the current session,
  // or an earlier link for the same cart (checkout replaced it after payment).
  const tag = node?.additional_data ?? node?.additionalData
  const known = await getAttempt(transaction_id!)
  if (tag && tag !== session.id && known?.cart_id !== cart.id) {
    return res.status(409).json({ ok: false, message: "Transaction belongs to another cart" })
  }

  await setSessionOverride(session.id, transaction_id!)
  if (!known) await recordAttempt({
    txn_id: transaction_id!, session_id: session.id, cart_id: cart.id,
    reference: session.id.slice(-21), amount: Number(cart.total),
    currency: String(cart.currency_code).toUpperCase(), email: cart.email,
    created_at: Date.now(), status: "pending",
  })
  res.json({ ok: true })
}
