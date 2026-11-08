import { ADDONS_MODULE } from "./index"
import { CMS_MODULE } from "../cms"

export const PACKING_SETTING_KEY = "packing"
export type PackingSettings = { enabled: boolean; variant_id: string | null }

const str = (v: any, max = 500) => (v == null ? null : String(v).trim().slice(0, max) || null)
const num = (v: any) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.round(Number(v) * 100) / 100 : 0)

export function pickAddon(b: Record<string, any> = {}) {
  const o: Record<string, any> = {}
  if ("name" in b) o.name = str(b.name, 120) ?? "Untitled"
  if ("description" in b) o.description = str(b.description, 600)
  if ("price" in b) o.price = num(b.price)
  if ("image" in b) o.image = str(b.image, 500)
  if ("is_active" in b) o.is_active = Boolean(b.is_active)
  if ("sort_order" in b) o.sort_order = Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 0
  return o
}
export const pickPacking = (b: Record<string, any> = {}) => ({
  ...pickAddon(b),
  ...("is_default" in b ? { is_default: Boolean(b.is_default) } : {}),
})

export async function readPackingSettings(scope: any): Promise<PackingSettings> {
  const cms = scope.resolve(CMS_MODULE) as any
  const [row] = await cms.listSiteSettings({ key: PACKING_SETTING_KEY })
  const v = (row?.value ?? {}) as Partial<PackingSettings>
  return { enabled: Boolean(v.enabled), variant_id: v.variant_id ?? null }
}

export async function writePackingSettings(scope: any, value: PackingSettings) {
  const cms = scope.resolve(CMS_MODULE) as any
  const [row] = await cms.listSiteSettings({ key: PACKING_SETTING_KEY })
  if (row) await cms.updateSiteSettings({ id: row.id, value })
  else await cms.createSiteSettings({ key: PACKING_SETTING_KEY, value })
}

/** Only one default at a time. */
export async function enforceSingleDefault(scope: any, keepId: string) {
  const svc = scope.resolve(ADDONS_MODULE) as any
  const defaults = await svc.listPackingOptions({ is_default: true })
  for (const d of defaults) {
    if (d.id !== keepId) await svc.updatePackingOptions({ id: d.id, is_default: false })
  }
}
