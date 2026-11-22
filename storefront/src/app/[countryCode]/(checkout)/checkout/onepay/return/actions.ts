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

export async function clearCart() {
  const { removeCartId } = await import("@lib/data/cookies")
  await removeCartId()
}

export async function resetPaymentSession() {
  const cartId = await getCartId()
  if (!cartId) return

  try {
    const authHeaders = await getAuthHeaders()
    // Retrieve the latest cart
    const { cart } = await sdk.store.cart.retrieve(cartId, {}, authHeaders)
    // Reset the payment session to manual to override the failed OnePay session
    await sdk.store.payment.initiatePaymentSession(
      cart,
      { provider_id: "pp_system_default" },
      {},
      authHeaders
    )

  } catch (err) {
    console.error("[OnePay Return] Failed to reset payment session:", err)
  }
}


// ── Onepay.js (popup) helpers ──────────────────────────────────────────────
export async function getOnepayJsToken() {
  const cartId = await getCartId()
  if (!cartId) return null
  try {
    return await sdk.client.fetch<any>("/store/onepay/js-token", {
      method: "POST",
      body: { cart_id: cartId },
      headers: await getAuthHeaders(),
    })
  } catch (err) {
    console.error("[OnePay.js] token error:", err)
    return null
  }
}

export async function confirmOnepayJs(transactionId: string) {
  const cartId = await getCartId()
  if (!cartId) return { ok: false }
  try {
    return await sdk.client.fetch<{ ok: boolean; pending?: boolean }>("/store/onepay/js-confirm", {
      method: "POST",
      body: { cart_id: cartId, transaction_id: transactionId },
      headers: await getAuthHeaders(),
    })
  } catch (err) {
    console.error("[OnePay.js] confirm error:", err)
    return { ok: false }
  }
}
