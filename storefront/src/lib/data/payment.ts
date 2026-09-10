import { sdk } from "@lib/config"
import { cache } from "react"
import { isKoko, isMintpay } from "@lib/constants"
import { withRetry, nextFetchOptions } from "@lib/util/with-retry"

// This had neither a timeout nor real caching (`next.tags` alone is a no-op
// on Next 15 — see regions.ts). ProductActionsWrapper awaits this via
// Promise.all alongside getProductsById, which DOES have withRetry's 8s
// timeout — but Promise.all only resolves once every promise does, so this
// one hanging indefinitely dragged the whole thing (and its Suspense
// boundary) down regardless of the other call's protection. That's the
// mechanism behind product pages hanging forever on the price/add-to-cart
// section: a slow/stuck backend response here had nothing to time it out.
export const listCartPaymentMethods = cache(async function (regionId: string) {
  if (!regionId) {
    console.warn("[listCartPaymentMethods] Called with empty regionId — skipping fetch")
    return []
  }
  return withRetry(() =>
    sdk.store.payment
      .listPaymentProviders(
        { region_id: regionId },
        nextFetchOptions(["payment_providers"], 300)
      )
      .then(({ payment_providers }) => payment_providers)
  ).catch((err) => {
    console.error("[listCartPaymentMethods] Failed to fetch payment providers:", err?.message ?? err)
    // Return empty array (not null) so callers can tell the difference between
    // "fetch failed" and "no providers configured". The Payment component handles
    // the empty-array case with a proper loading/retry UI.
    return [] as any[]
  })
})

/** Which BNPL providers (Koko / Mintpay) are available for a region — used to
 *  show the "or 3 X ... with" installment line on product cards/PDP. */
export async function getBnplProviders(
  regionId: string
): Promise<Array<"koko" | "mintpay">> {
  const providers = await listCartPaymentMethods(regionId)
  const result: Array<"koko" | "mintpay"> = []
  if (providers?.some((p) => isKoko(p.id))) result.push("koko")
  if (providers?.some((p) => isMintpay(p.id))) result.push("mintpay")
  return result
}
