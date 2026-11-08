import { sdk } from "@lib/config"
import { withRetry, nextFetchOptions } from "@lib/util/with-retry"

export type Addon = {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
}

export type PackingOption = Addon & { is_default: boolean }
export type Packing = {
  enabled: boolean
  default_id: string | null
  default_name?: string
  options: PackingOption[]
}

/** Add-ons offered for one product. Empty on any failure, so the page still works. */
export async function getProductAddons(productId: string): Promise<Addon[]> {
  try {
    const { addons } = await withRetry(
      () =>
        sdk.client.fetch<{ addons: Addon[] }>(`/store/addons?product_id=${encodeURIComponent(productId)}`, {
          method: "GET",
          headers: nextFetchOptions(["addons"], 60) as any,
        }),
      { retries: 1, timeoutMs: 4000 }
    )
    return addons ?? []
  } catch {
    return []
  }
}

export async function getPacking(): Promise<Packing> {
  try {
    return await withRetry(
      () =>
        sdk.client.fetch<Packing>("/store/packing", {
          method: "GET",
          headers: nextFetchOptions(["packing"], 60) as any,
        }),
      { retries: 1, timeoutMs: 4000 }
    )
  } catch {
    return { enabled: false, default_id: null, options: [] }
  }
}
