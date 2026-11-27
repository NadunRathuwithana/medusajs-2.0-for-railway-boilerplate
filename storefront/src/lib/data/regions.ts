import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { cache } from "react"
import { HttpTypes } from "@medusajs/types"
import { withRetry, nextFetchOptions } from "@lib/util/with-retry"

// Regions change essentially never — a 1-hour revalidate window means most
// requests are served from Next's Data Cache instead of hitting the backend
// live. Next.js 15 changed fetch to be UNCACHED by default, so `next.tags`
// alone (no `revalidate`) was a no-op here: every single page load, for
// every visitor, was a fresh round-trip to Medusa with zero caching cushion —
// the core reason a traffic spike from ads could overwhelm the backend.
export const listRegions = cache(async function () {
  return withRetry(() =>
    sdk.store.region
      .list(
        { fields: "+payment_providers" },
        nextFetchOptions(["regions"], 3600)
      )
      .then(({ regions }) => regions)
  ).catch(medusaError)
})

export const retrieveRegion = cache(async function (id: string) {
  return withRetry(() =>
    sdk.store.region
      .retrieve(id, {}, nextFetchOptions(["regions"], 3600))
      .then(({ region }) => region)
  ).catch(medusaError)
})

const regionMap = new Map<string, HttpTypes.StoreRegion>()
let regionMapAt = 0
const REGION_TTL_MS = 10 * 60 * 1000

/**
 * Returns the region for a country code, or null when the code is unknown.
 * A backend failure THROWS (so the page shows the error page / 5xx instead of
 * a 404 that search engines would de-index).
 */
export const getRegion = cache(async function (countryCode: string) {
  if (Date.now() - regionMapAt > REGION_TTL_MS) regionMap.clear()
  const key = countryCode || process.env.NEXT_PUBLIC_DEFAULT_REGION || "lk"
  if (regionMap.has(key)) {
    return regionMap.get(key)
  }

  const regions = await listRegions()
  if (!regions) {
    throw new Error("Regions could not be loaded")
  }

  regionMap.clear()
  regions.forEach((region) => {
    region.countries?.forEach((c) => {
      regionMap.set(c?.iso_2 ?? "", region)
    })
  })
  regionMapAt = Date.now()

  return regionMap.get(key) ?? null
})
