"use client"

import { useEffect, useRef } from "react"
import { trackInitiateCheckout, whenTrackersReady } from "@lib/analytics/track"
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

    tracked.current = true
    whenTrackersReady().then((ready) => {
      if (!ready) {
        tracked.current = false
        return
      }
      trackInitiateCheckout({
        items: cart.items,
        total: cart.total,
        currency: cart.currency_code,
      })
      markEventTracked("checkouts", cart.id)
    })
  }, [cart])

  return null
}
