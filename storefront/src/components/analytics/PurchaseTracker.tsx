"use client"

import { useEffect, useRef } from "react"
import { trackPurchase } from "@lib/analytics/track"
import { wasEventTracked, markEventTracked } from "@lib/analytics/dedup"

export default function PurchaseTracker({ order }: { order: any }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current || !order) return

    // Meta's event-id dedup covers repeat Purchase fires (pixel-to-pixel and
    // pixel-to-CAPI), but GA4 has no such protection — a `purchase` event
    // with a repeated transaction_id is counted as new revenue every time.
    // The ref above only protects a single mount; refreshing/revisiting this
    // page creates a fresh component instance, so we also check a guard that
    // survives across mounts for the lifetime of the tab.
    if (wasEventTracked("purchases", order.id)) {
      tracked.current = true
      return
    }

    trackPurchase(
      {
        id: order.id,
        total: order.total,
        currency: order.currency_code,
        items: order.items,
      },
      order.id
    )
    tracked.current = true
    markEventTracked("purchases", order.id)
  }, [order])

  return null
}
