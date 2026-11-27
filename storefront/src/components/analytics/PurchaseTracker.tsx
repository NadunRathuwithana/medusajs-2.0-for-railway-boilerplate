"use client"

import { useEffect, useRef } from "react"
import { trackPurchase, whenTrackersReady } from "@lib/analytics/track"
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

    tracked.current = true
    // After the Onepay full-page redirect the Pixel/gtag scripts may still be
    // loading: wait for them, and only mark as sent once something fired.
    whenTrackersReady().then((ready) => {
      if (!ready) {
        tracked.current = false
        return
      }
      trackPurchase(
        {
          id: order.id,
          total: order.total,
          currency: order.currency_code,
          items: order.items,
          shipping_total: order.shipping_total,
        } as any,
        order.id
      )
      markEventTracked("purchases", order.id)
    })
  }, [order])

  return null
}
