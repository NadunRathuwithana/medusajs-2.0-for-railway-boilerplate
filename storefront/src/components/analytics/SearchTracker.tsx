"use client"

import { useEffect } from "react"
import { trackSearch } from "@lib/analytics/track"

export default function SearchTracker({
  term,
  resultsCount,
}: {
  term: string
  resultsCount: number
}) {
  useEffect(() => {
    trackSearch({ term, resultsCount })
    // Re-fires when the search term or result count changes, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, resultsCount])

  return null
}
