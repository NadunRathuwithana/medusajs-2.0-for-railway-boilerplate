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
regionMap.clear() // Force clear on hot reload

export const getRegion = cache(async function (countryCode: string) {
  try {
    if (regionMap.has(countryCode)) {
      return regionMap.get(countryCode)
    }

    const regions = await listRegions()

    if (!regions) {
      return null
    }

    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionMap.set(c?.iso_2 ?? "", region)
      })
    })

    const region = countryCode
      ? regionMap.get(countryCode)
      : regionMap.get("us")

    return region
  } catch (e: any) {
    return null
  }
})
