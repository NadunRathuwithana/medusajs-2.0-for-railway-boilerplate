/** The one public, indexable host. Canonicals, sitemap and JSON-LD always point here. */
export const SITE_URL = "https://cardle.lk"

/** False on dev/staging hosts: they must never be indexed. */
export const IS_INDEXABLE = !/\/\/(dev|staging)\./.test(process.env.NEXT_PUBLIC_BASE_URL || "")

/** Canonical URL for a region-prefixed path, e.g. canonical("/store") -> https://cardle.lk/lk/store */
export const canonical = (path = "") => `${SITE_URL}/lk${path}`

/** For pages that must never appear in search (checkout, account, search). */
export const NOINDEX = { index: false, follow: false } as const
