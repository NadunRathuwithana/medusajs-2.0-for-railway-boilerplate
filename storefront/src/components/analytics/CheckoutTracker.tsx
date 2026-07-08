"use client"

import { useEffect, useRef } from "react"
import { trackInitiateCheckout } from "@lib/analytics/track"

export default function CheckoutTracker({ cart }: { cart: any }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (!tracked.current && cart) {
      trackInitiateCheckout({
        items: cart.items,
        total: cart.total,
        currency: cart.currency_code,
      })
      tracked.current = true
    }
  }, [cart])

  return null
}
