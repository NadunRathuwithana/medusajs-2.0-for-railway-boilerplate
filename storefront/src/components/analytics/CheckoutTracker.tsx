"use client"

import { useEffect, useRef } from "react"
import { trackInitiateCheckout } from "@lib/analytics/track"
import { wasEventTracked, markEventTracked } from "@lib/analytics/dedup"

export default function CheckoutTracker({ cart }: { cart: any }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current || !cart) return

    // Same cart.id persists across refreshes of the checkout page until the
    // order is placed — guard against re-firing InitiateCheckout on revisits.
    if (wasEventTracked("checkouts", cart.id)) {
      tracked.current = true
      return
    }

    trackInitiateCheckout({
      items: cart.items,
      total: cart.total,
      currency: cart.currency_code,
    })
    tracked.current = true
    markEventTracked("checkouts", cart.id)
  }, [cart])

  return null
}
