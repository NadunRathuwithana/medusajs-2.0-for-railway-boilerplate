import { sdk } from "@lib/config"
import { cache } from "react"

// Shipping actions
export const listCartShippingMethods = cache(async function (cartId: string) {
  console.log("Fetching shipping options for cart:", cartId)
  return sdk.store.fulfillment
    .listCartOptions({ cart_id: cartId }, { next: { tags: ["shipping"] } })
    .then(({ shipping_options }) => {
      console.log("Shipping options found:", JSON.stringify(shipping_options, null, 2))
      return shipping_options
    })
    .catch((err) => {
      console.error("Error fetching shipping options:", err.message)
      return null
    })
})
