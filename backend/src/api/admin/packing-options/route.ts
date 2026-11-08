import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ADDONS_MODULE } from "../../../modules/addons"
import { enforceSingleDefault, pickPacking } from "../../../modules/addons/lib"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(ADDONS_MODULE) as any
  const options = await svc.listPackingOptions({}, { order: { sort_order: "ASC" } })
  res.json({ options })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(ADDONS_MODULE) as any
  const data = { name: "Untitled", ...pickPacking(req.body as any) } as any
  if (data.is_default) data.price = 0 // the default is always included
  const option = await svc.createPackingOptions(data)
  if (option.is_default) await enforceSingleDefault(req.scope, option.id)
  res.status(201).json({ option })
}
