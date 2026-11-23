import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Public: which storefront offers are switched on right now.
// buy2get1 = the BUY2GET1 promotion exists, is active, and its campaign
// (if any) is within its dates. Turn it off in admin and the popup goes away.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  let buy2get1 = false
  try {
    const promo = req.scope.resolve(Modules.PROMOTION) as any
    const [p] = await promo.listPromotions(
      { code: "BUY2GET1" },
      { relations: ["campaign"], take: 1 }
    )
    if (p && p.status === "active") {
      const now = Date.now()
      const start = p.campaign?.starts_at ? new Date(p.campaign.starts_at).getTime() : null
      const end = p.campaign?.ends_at ? new Date(p.campaign.ends_at).getTime() : null
      buy2get1 = (!start || start <= now) && (!end || end >= now)
    }
  } catch {
    buy2get1 = false
  }
  res.setHeader("Cache-Control", "public, max-age=60")
  res.json({ buy2get1 })
}
