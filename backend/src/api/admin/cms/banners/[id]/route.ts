import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../../modules/cms"
import { pickBannerInput } from "../../../../../modules/cms/fields"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve(CMS_MODULE) as any
  const data = pickBannerInput(req.body as any)
  const banner = await cms.updateBanners({ id: req.params.id, ...data })
  res.json({ banner })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve(CMS_MODULE) as any
  await cms.deleteBanners(req.params.id)
  res.json({ id: req.params.id, deleted: true })
}
