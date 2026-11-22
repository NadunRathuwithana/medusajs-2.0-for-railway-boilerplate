import crypto from "crypto"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ONEPAY_APP_ID, ONEPAY_TOKEN, ONEPAY_HASH_SALT, ONEPAY_BASE_URL } from "./constants"

export async function loadCartForOnepay(scope: MedusaContainer, cartId: string) {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    filters: { id: cartId },
    fields: [
      "id", "total", "currency_code", "email", "completed_at",
      "shipping_address.first_name", "shipping_address.last_name", "shipping_address.phone",
      "payment_collection.payment_sessions.id",
      "payment_collection.payment_sessions.provider_id",
      "payment_collection.payment_sessions.status",
    ],
  })
  const cart: any = data[0]
  if (!cart || cart.completed_at) return null
  const session = (cart.payment_collection?.payment_sessions ?? []).find(
    (s: any) => s.provider_id === "pp_onepay_onepay" && s.status === "pending"
  )
  return { cart, session }
}

/** Same SHA-256 recipe as the link API: appId + currency + amount(2dp) + salt. */
export function onepayHash(currency: string, amount: number) {
  return crypto
    .createHash("sha256")
    .update(`${ONEPAY_APP_ID}${currency}${amount.toFixed(2)}${ONEPAY_HASH_SALT}`)
    .digest("hex")
}

export async function onepayStatus(txnId: string): Promise<any> {
  const res = await fetch(`${ONEPAY_BASE_URL}/v3/transaction/status/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: ONEPAY_TOKEN! },
    body: JSON.stringify({ app_id: ONEPAY_APP_ID, onepay_transaction_id: txnId }),
  })
  return JSON.parse(await res.text())
}
