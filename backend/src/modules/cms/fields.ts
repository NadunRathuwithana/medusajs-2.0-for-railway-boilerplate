// Fields an admin may set on a banner. Anything else in the request body is ignored.
export const BANNER_FIELDS = [
  "placement",
  "page_key",
  "slot_key",
  "eyebrow",
  "title",
  "body",
  "cta_label",
  "cta_href",
  "text_color",
  "alt",
  "image_desktop",
  "image_tablet",
  "image_mobile",
  "sort_order",
  "is_active",
  "starts_at",
  "ends_at",
] as const

const PLACEMENTS = ["hero", "page", "creative"]

const MAX_LEN: Record<string, number> = {
  page_key: 80, slot_key: 80, eyebrow: 80, title: 160, body: 600, cta_label: 40, alt: 200,
  cta_href: 500, image_desktop: 1000, image_tablet: 1000, image_mobile: 1000,
}

/** Images must be https (or a site path); links may be site paths, https, mailto: or tel:. */
export function safeUrl(v: string | null, kind: "image" | "link"): string | null {
  if (!v) return null
  if (v.startsWith("/") && !v.startsWith("//")) return v
  if (/^https:\/\//i.test(v)) return v
  if (kind === "image" && /^http:\/\/localhost/i.test(v)) return v
  if (kind === "link" && /^(mailto:|tel:)/i.test(v)) return v
  return null
}

export function pickBannerInput(body: Record<string, any> = {}) {
  const out: Record<string, any> = {}
  for (const key of BANNER_FIELDS) {
    if (!(key in body)) continue
    let v = body[key]
    if (typeof v === "string") v = v.trim()
    if (v === "") v = null
    if (typeof v === "string" && MAX_LEN[key]) v = v.slice(0, MAX_LEN[key])
    if (key === "cta_href") {
      v = safeUrl(v, "link")
    } else if (key === "image_desktop" || key === "image_tablet" || key === "image_mobile") {
      v = safeUrl(v, "image")
    } else if (key === "placement") {
      if (!PLACEMENTS.includes(v)) continue
    } else if (key === "text_color") {
      if (v !== null && !/^#[0-9a-fA-F]{6}$/.test(String(v))) v = null
    } else if (key === "sort_order") {
      v = Number.isFinite(Number(v)) ? Number(v) : 0
    } else if (key === "is_active") {
      v = Boolean(v)
    } else if (key === "starts_at" || key === "ends_at") {
      v = v ? new Date(v) : null
      if (v && isNaN(v.getTime())) v = null
    }
    out[key] = v
  }
  return out
}

export const PROMO_KEY = "promo_bar"
