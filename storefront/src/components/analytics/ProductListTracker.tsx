"use client"

import { useEffect, useRef } from "react"
import { trackViewItemList, trackSearch } from "@lib/analytics/track"

type ListItem = { id: string; name: string; price: number }

export default function ProductListTracker({
  listId,
  listName,
  currency,
  items,
  searchQuery,
}: {
  listId: string
  listName: string
  currency: string
  items: ListItem[]
  searchQuery?: string
}) {
  // Guard against re-firing for the same list on re-renders (e.g. Suspense
  // boundary re-resolving with an identical result) — only track when the
  // actual list of product ids changes.
  const trackedKey = useRef<string | null>(null)

  useEffect(() => {
    if (items.length === 0) return

    const key = `${listId}:${items.map((item) => item.id).join(",")}`
    if (trackedKey.current === key) return
    trackedKey.current = key

    trackViewItemList({ listId, listName, currency, items })

    if (searchQuery) {
      trackSearch({ query: searchQuery, resultCount: items.length })
    }
  }, [listId, listName, currency, items, searchQuery])

  return null
}
