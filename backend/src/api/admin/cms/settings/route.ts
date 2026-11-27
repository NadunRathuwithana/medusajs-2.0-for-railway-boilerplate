import { revalidateStorefront } from "../../../../lib/revalidate-storefront"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import { safeUrl, PROMO_KEY } from "../../../../modules/cms/fields"

async function readPromo(cms: any) {
  const [row] = await cms.listSiteSettings({ key: PROMO_KEY })
  return row ?? null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve(CMS_MODULE) as any
  const row = await readPromo(cms)
  res.json({ promo_bar: row?.value ?? { text: "", href: "", is_active: false } })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve(CMS_MODULE) as any
  const body = ((req.body as any)?.promo_bar ?? {}) as Record<string, any>
  const value = {
    text: String(body.text ?? "").trim().slice(0, 140),
    href: safeUrl(String(body.href ?? "").trim().slice(0, 300) || null, "link") ?? "",
    is_active: Boolean(body.is_active),
  }
  const row = await readPromo(cms)
  if (row) await cms.updateSiteSettings({ id: row.id, value })
  else await cms.createSiteSettings({ key: PROMO_KEY, value })
  revalidateStorefront(["cms"])
  res.json({ promo_bar: value })
}
