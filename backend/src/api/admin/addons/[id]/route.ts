import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ADDONS_MODULE } from "../../../../modules/addons"
import { pickAddon } from "../../../../modules/addons/lib"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(ADDONS_MODULE) as any
  const id = req.params.id
  const body = (req.body ?? {}) as any
  const addon = await svc.updateAddons({ id, ...pickAddon(body) })

  if (Array.isArray(body.product_ids)) {
    const want = new Set<string>(body.product_ids)
    const current = await svc.listAddonProducts({ addon_id: id })
    const remove = current.filter((l: any) => !want.has(l.product_id)).map((l: any) => l.id)
    const have = new Set(current.map((l: any) => l.product_id))
    const add = [...want].filter((p) => !have.has(p))
    if (remove.length) await svc.deleteAddonProducts(remove)
    if (add.length) await svc.createAddonProducts(add.map((product_id) => ({ addon_id: id, product_id })))
  }
  res.json({ addon })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(ADDONS_MODULE) as any
  const id = req.params.id
  const links = await svc.listAddonProducts({ addon_id: id })
  if (links.length) await svc.deleteAddonProducts(links.map((l: any) => l.id))
  await svc.deleteAddons(id)
  res.json({ id, deleted: true })
}
