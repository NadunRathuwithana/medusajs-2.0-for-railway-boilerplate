import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ONEPAY_APP_ID, ONEPAY_TOKEN, ONEPAY_HASH_SALT } from "../../../../lib/constants"
import { loadCartForOnepay, onepayHash } from "../../../../lib/onepay-js"

// Server-side hashToken for Onepay.js. The hash salt never leaves the server.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!ONEPAY_APP_ID || !ONEPAY_TOKEN || !ONEPAY_HASH_SALT) {
    return res.status(503).json({ message: "Onepay not configured" })
  }
  const { cart_id } = (req.body ?? {}) as { cart_id?: string }
  const loaded = cart_id ? await loadCartForOnepay(req.scope, cart_id) : null
  if (!loaded?.session) {
    return res.status(404).json({ message: "No active Onepay session for this cart" })
  }
  const { cart, session } = loaded
  const amount = Number(Number(cart.total).toFixed(2))
  const currency = String(cart.currency_code).toUpperCase()
  res.json({
    appid: ONEPAY_APP_ID,
    apptoken: ONEPAY_TOKEN,
    hashToken: onepayHash(currency, amount),
    amount,
    currency,
    orderReference: session.id.slice(-21),
    additionalData: session.id,
    customerEmail: cart.email,
    customerFirstName: cart.shipping_address?.first_name || "Customer",
    customerLastName: cart.shipping_address?.last_name || "Customer",
    customerPhoneNumber: cart.shipping_address?.phone,
  })
}
