"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"

// Captures/normalizes the Meta `_fbc` and `_fbp` cookies as early as possible
// in the customer journey (per Meta's parameter-builder best practices),
// rather than only reading them from cookies down-funnel at checkout. This
// also builds a correctly-formatted `_fbc` from a `fbclid` query param on the
// very first landing page, ahead of fbevents.js setting the cookie itself.
// Dynamically imported client-only: the package's UMD bundle references
// `self`, which doesn't exist during server-side module evaluation.
export default function MetaParamSync() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    import("meta-capi-param-builder-clientjs")
      .then(({ processAndCollectAllParams }) =>
        processAndCollectAllParams(window.location.href)
      )
      .catch((err) => {
        console.warn("[Meta CAPI] Param builder sync failed:", err)
      })
  }, [pathname, searchParams])

  return null
}
