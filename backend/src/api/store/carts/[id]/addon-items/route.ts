import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, QueryContext } from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { ADDONS_MODULE } from "../../../../../modules/addons"

/**
 * POST /store/carts/:id/addon-items  { variant_id, quantity, addon_ids: [] }
 *
 * Adds a bag with its add-ons as ONE line. The unit price is bag price + add-on
 * prices, worked out here from the catalog, so the browser cannot set a price.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.params.id
  const { variant_id, quantity = 1, addon_ids = [] } = (req.body ?? {}) as any
  if (!variant_id) throw new MedusaError(MedusaError.Types.INVALID_DATA, "variant_id is required")
  const qty = Math.max(1, Math.min(50, Math.floor(Number(quantity) || 1)))

  const query = req.scope.resolve("query")
  const svc = req.scope.resolve(ADDONS_MODULE) as any

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "region_id", "currency_code"],
    filters: { id: cartId },
  })
  const cart = carts[0]
  if (!cart) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "product_id", "calculated_price.*"],
    filters: { id: variant_id },
    context: {
      calculated_price: QueryContext({ region_id: cart.region_id, currency_code: cart.currency_code }),
    },
  })
  const variant = variants[0] as any
  const base = variant?.calculated_price?.calculated_amount
  if (!variant || typeof base !== "number") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Variant has no price in this region")
  }

  // Only add-ons that are active AND offered for this product count.
  const wanted: string[] = Array.isArray(addon_ids) ? [...new Set(addon_ids.map(String))] : []
  let chosen: any[] = []
  if (wanted.length) {
    const links = await svc.listAddonProducts({ product_id: variant.product_id, addon_id: wanted })
    const allowed = links.map((l: any) => l.addon_id)
    chosen = allowed.length ? await svc.listAddons({ id: allowed, is_active: true }) : []
    if (chosen.length !== wanted.length) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "One of the add-ons is not available for this product")
    }
  }

  const extra = chosen.reduce((sum, a) => sum + Number(a.price || 0), 0)
  const item: Record<string, any> = { variant_id, quantity: qty }
  if (chosen.length) {
    item.unit_price = base + extra
    item.metadata = {
      addons: chosen
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((a) => ({ id: a.id, name: a.name, price: Number(a.price || 0), image: a.image })),
      base_price: base,
    }
  }

  await addToCartWorkflow(req.scope).run({ input: { cart_id: cartId, items: [item as any] } })
  res.json({ ok: true })
}
