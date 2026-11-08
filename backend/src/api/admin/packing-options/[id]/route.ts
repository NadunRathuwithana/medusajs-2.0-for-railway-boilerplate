import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ADDONS_MODULE } from "../../../../modules/addons"
import { enforceSingleDefault, pickPacking } from "../../../../modules/addons/lib"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(ADDONS_MODULE) as any
  const data = pickPacking(req.body as any) as any
  if (data.is_default) data.price = 0
  const option = await svc.updatePackingOptions({ id: req.params.id, ...data })
  if (option.is_default) await enforceSingleDefault(req.scope, option.id)
  res.json({ option })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(ADDONS_MODULE) as any
  await svc.deletePackingOptions(req.params.id)
  res.json({ id: req.params.id, deleted: true })
}
