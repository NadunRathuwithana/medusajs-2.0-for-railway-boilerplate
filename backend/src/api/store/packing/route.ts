import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ADDONS_MODULE } from "../../../modules/addons"
import { readPackingSettings } from "../../../modules/addons/lib"

/** Packing choices for checkout. `enabled: false` means hide the whole section. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const settings = await readPackingSettings(req.scope)
  if (!settings.enabled) return res.json({ enabled: false, options: [], default_id: null })

  const svc = req.scope.resolve(ADDONS_MODULE) as any
  const options = await svc.listPackingOptions({ is_active: true }, { order: { sort_order: "ASC" } })
  const def = options.find((o: any) => o.is_default) ?? null

  res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60")
  res.json({
    enabled: options.length > 0,
    default_id: def?.id ?? null,
    options: options.map((o: any) => ({
      id: o.id,
      name: o.name,
      description: o.description,
      image: o.image,
      is_default: o.is_default,
      price: o.is_default ? 0 : o.price,
    })),
  })
}
