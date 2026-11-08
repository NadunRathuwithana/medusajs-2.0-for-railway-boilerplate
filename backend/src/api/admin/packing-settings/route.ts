import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { readPackingSettings, writePackingSettings } from "../../../modules/addons/lib"
import { ensurePackingVariant } from "../../../modules/addons/packing-product"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const s = await readPackingSettings(req.scope)
  res.json({ enabled: s.enabled })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const enabled = Boolean((req.body as any)?.enabled)
  if (enabled) await ensurePackingVariant(req.scope) // creates the hidden charge product once
  const s = await readPackingSettings(req.scope)
  await writePackingSettings(req.scope, { ...s, enabled })
  res.json({ enabled })
}
