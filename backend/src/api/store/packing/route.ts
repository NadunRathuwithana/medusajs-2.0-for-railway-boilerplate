import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ADDONS_MODULE } from "../../../modules/addons"
import { readPackingSettings } from "../../../modules/addons/lib"

/** Packing choices for checkout. `enabled: false` means hide the whole section. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const settings = await readPackingSettings(req.scope)
  if (!settings.enabled) return res.json({ enabled: false, options: [], default_id: null })

  const svc = req.scope.resolve(ADDONS_MODULE) as any
  const all = await svc.listPackingOptions({ is_active: true }, { order: { sort_order: "ASC" } })
  const def = all.find((o: any) => o.is_default) ?? null
  // Standard packing is always included; only the optional extras are listed.
  const options = all.filter((o: any) => !o.is_default)

  res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60")
  res.json({
    enabled: options.length > 0,
    default_id: def?.id ?? null,
    default_name: def?.name ?? "Standard packing",
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
