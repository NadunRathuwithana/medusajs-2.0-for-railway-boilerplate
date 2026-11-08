import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ADDONS_MODULE } from "../../../modules/addons"

/** GET /store/addons?product_id=prod_x  ->  active add-ons offered for that product */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productId = String((req.query as any).product_id ?? "")
  if (!productId) return res.json({ addons: [] })

  const svc = req.scope.resolve(ADDONS_MODULE) as any
  const links = await svc.listAddonProducts({ product_id: productId })
  if (!links.length) return res.json({ addons: [] })

  const addons = await svc.listAddons(
    { id: links.map((l: any) => l.addon_id), is_active: true },
    { order: { sort_order: "ASC" } }
  )
  res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60")
  res.json({
    addons: addons.map((a: any) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      price: a.price,
      image: a.image,
    })),
  })
}
