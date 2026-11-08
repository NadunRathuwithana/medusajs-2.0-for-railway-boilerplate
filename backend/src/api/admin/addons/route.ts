import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ADDONS_MODULE } from "../../../modules/addons"
import { pickAddon } from "../../../modules/addons/lib"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(ADDONS_MODULE) as any
  const [addons, links] = await Promise.all([
    svc.listAddons({}, { order: { sort_order: "ASC" } }),
    svc.listAddonProducts({}),
  ])
  res.json({
    addons: addons.map((a: any) => ({
      ...a,
      product_ids: links.filter((l: any) => l.addon_id === a.id).map((l: any) => l.product_id),
    })),
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(ADDONS_MODULE) as any
  const body = (req.body ?? {}) as any
  const addon = await svc.createAddons({ name: "Untitled", ...pickAddon(body) })
  const ids: string[] = Array.isArray(body.product_ids) ? body.product_ids : []
  if (ids.length) {
    await svc.createAddonProducts(ids.map((product_id) => ({ addon_id: addon.id, product_id })))
  }
  res.status(201).json({ addon: { ...addon, product_ids: ids } })
}
