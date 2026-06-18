import { sdk } from "@lib/config"
import { cache } from "react"

export const listCartPaymentMethods = cache(async function (regionId: string) {
  if (!regionId) {
    console.warn("[listCartPaymentMethods] Called with empty regionId — skipping fetch")
    return []
  }
  return sdk.store.payment
    .listPaymentProviders(
      { region_id: regionId },
      { next: { tags: ["payment_providers"] } }
    )
    .then(({ payment_providers }) => payment_providers)
    .catch((err) => {
      console.error("[listCartPaymentMethods] Failed to fetch payment providers:", err?.message ?? err)
      // Return empty array (not null) so callers can tell the difference between
      // "fetch failed" and "no providers configured". The Payment component handles
      // the empty-array case with a proper loading/retry UI.
      return [] as any[]
    })
})
