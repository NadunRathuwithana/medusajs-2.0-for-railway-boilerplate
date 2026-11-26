import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { loadCartForOnepay, onepayStatus } from "../../../../lib/onepay-js"
import { getAttempt, setSessionOverride } from "../../../../modules/onepay-payment/attempts"

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
  // Live Onepay returns { data: { status: true, paid_on, amount } }; older
  // shapes use status 1 / status_message "SUCCESS". Accept all three.
  const paid = msg === "SUCCESS" || node?.status === 1 || node?.status === true
  const failed = msg === "FAILED" || msg === "CANCELLED" || node?.status === 0 || node?.status === 2 || node?.status === false
  if (!paid) return res.json({ ok: false, pending: !failed, failed })

  const paidAmount = Number(node?.amount)
  if (Number.isFinite(paidAmount) && Math.abs(paidAmount - Number(cart.total)) > 0.01) {
    return res.status(409).json({ ok: false, message: "Amount mismatch" })
  }
  // The txn must be one WE issued for this cart (every link is recorded at
  // creation). Onepay's status response carries no session tag, so without
  // this anyone could attach another paid transaction of the same amount.
  const known = await getAttempt(transaction_id!)
  const ours = !!known && (known.cart_id ? known.cart_id === cart.id : known.session_id === session.id)
  if (!ours) {
    return res.status(409).json({ ok: false, message: "Transaction does not belong to this cart" })
  }

  await setSessionOverride(session.id, transaction_id!)
  res.json({ ok: true })
}
