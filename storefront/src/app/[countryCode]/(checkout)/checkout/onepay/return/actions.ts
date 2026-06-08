"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCartId } from "@lib/data/cookies"

export async function checkOrderForCart() {
  const cartId = await getCartId()
  if (!cartId) return null

  try {
    const response = await sdk.store.order.list(
      { cart_id: cartId } as any,
      await getAuthHeaders()
    )
    if (response.orders && response.orders.length > 0) {
      return response.orders[0].id
    }
  } catch (err) {
    console.error("[OnePay checkOrder] Error fetching order for cart:", err)
  }
  return null
}
