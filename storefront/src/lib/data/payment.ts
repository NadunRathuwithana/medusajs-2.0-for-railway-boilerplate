import { sdk } from "@lib/config"
import { cache } from "react"
import { isKoko, isMintpay } from "@lib/constants"

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
