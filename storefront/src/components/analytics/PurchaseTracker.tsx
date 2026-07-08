"use client"

import { useEffect, useRef } from "react"
import { trackPurchase } from "@lib/analytics/track"

export default function PurchaseTracker({ order }: { order: any }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (!tracked.current && order) {
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
    }
  }, [order])

  return null
}
