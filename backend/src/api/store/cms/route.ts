import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../modules/cms"
import { PROMO_KEY } from "../../../modules/cms/fields"

/**
 * Public, read-only. Returns only active banners inside their schedule window,
 * plus the promo bar. The storefront falls back to built-in defaults for any
 * placement that comes back empty.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve(CMS_MODULE) as any
  const now = Date.now()

  const all = await cms.listBanners({ is_active: true }, { order: { sort_order: "ASC" } })
  const banners = all.filter((b: any) => {
    if (b.starts_at && new Date(b.starts_at).getTime() > now) return false
    if (b.ends_at && new Date(b.ends_at).getTime() < now) return false
    return true
  })

  const [row] = await cms.listSiteSettings({ key: PROMO_KEY })
  const promo = row?.value as any
  const promo_bar = promo?.is_active && promo?.text ? { text: promo.text, href: promo.href || null } : null

  res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60")
  res.json({ banners, promo_bar })
}
