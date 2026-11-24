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

export function pickBannerInput(body: Record<string, any> = {}) {
  const out: Record<string, any> = {}
  for (const key of BANNER_FIELDS) {
    if (!(key in body)) continue
    let v = body[key]
    if (typeof v === "string") v = v.trim()
    if (v === "") v = null
    if (key === "placement") {
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
