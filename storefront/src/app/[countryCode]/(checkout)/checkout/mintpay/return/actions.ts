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
    console.error("[Mintpay checkOrder] Error fetching order for cart:", err)
  }
  return null
}

export async function clearCart() {
  const { removeCartId } = await import("@lib/data/cookies")
  await removeCartId()
}

export async function resetPaymentSession() {
  const cartId = await getCartId()
  if (!cartId) return

  try {
    const authHeaders = await getAuthHeaders()
    const { cart } = await sdk.store.cart.retrieve(cartId, {}, authHeaders)
    // Reset the payment session to manual to override the stuck Mintpay session
    await sdk.store.payment.initiatePaymentSession(
      cart,
      { provider_id: "pp_system_default" },
      {},
      authHeaders
    )
  } catch (err) {
    console.error("[Mintpay Return] Failed to reset payment session:", err)
  }
}
