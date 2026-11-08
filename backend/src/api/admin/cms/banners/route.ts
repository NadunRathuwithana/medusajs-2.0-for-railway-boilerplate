import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import { pickBannerInput } from "../../../../modules/cms/fields"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve(CMS_MODULE) as any
  const banners = await cms.listBanners({}, { order: { placement: "ASC", sort_order: "ASC" } })
  res.json({ banners })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve(CMS_MODULE) as any
  const data = pickBannerInput(req.body as any)
  const banner = await cms.createBanners(data)
  res.status(201).json({ banner })
}
