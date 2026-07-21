"use client"

import { useEffect } from "react"
import { trackViewItemList } from "@lib/analytics/track"

type TrackedItem = { id: string; name: string; price?: number; currency?: string }

export default function ViewItemListTracker({
  listId,
  listName,
  items,
}: {
  listId: string
  listName: string
  items: TrackedItem[]
}) {
  const itemIds = items.map((item) => item.id).join(",")

  useEffect(() => {
    if (!itemIds) return
    trackViewItemList({ listId, listName, items })
    // Re-fires when the actual set of listed items changes (e.g. pagination,
    // sort, or filter), not on every unrelated re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId, listName, itemIds])

  return null
}
