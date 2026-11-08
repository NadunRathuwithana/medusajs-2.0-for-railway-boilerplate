import { sdk } from "@lib/config"
import { withRetry, nextFetchOptions } from "@lib/util/with-retry"

export type CmsBanner = {
  id: string
  placement: "hero" | "page" | "creative"
  page_key: string | null
  slot_key: string | null
  eyebrow: string | null
  title: string | null
  body: string | null
  cta_label: string | null
  cta_href: string | null
  alt: string | null
  image_desktop: string | null
  image_tablet: string | null
  image_mobile: string | null
  sort_order: number
}

export type CmsData = {
  banners: CmsBanner[]
  // undefined = the CMS could not be reached (show built-in default),
  // null      = reachable and switched off (show nothing).
  promo_bar: { text: string; href: string | null } | null | undefined
}

const CMS_REVALIDATE_SECONDS = 60

/**
 * Never throws: if the backend has no CMS route yet (e.g. live backend) or is
 * slow, the storefront renders its built-in content exactly as before.
 */
export async function getCms(): Promise<CmsData> {
  try {
    const data = await withRetry(
      () =>
        sdk.client.fetch<{ banners: CmsBanner[]; promo_bar: CmsData["promo_bar"] }>(
          "/store/cms",
          { method: "GET", headers: nextFetchOptions(["cms"], CMS_REVALIDATE_SECONDS) as any }
        ),
      { retries: 1, timeoutMs: 4000 }
    )
    return { banners: data.banners ?? [], promo_bar: data.promo_bar ?? null }
  } catch {
    return { banners: [], promo_bar: undefined }
  }
}
