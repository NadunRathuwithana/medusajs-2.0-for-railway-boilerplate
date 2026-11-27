import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, QueryContext } from "@medusajs/framework/utils"
import { deleteLineItemsWorkflow, updateLineItemInCartWorkflow } from "@medusajs/medusa/core-flows"
import { ADDONS_MODULE } from "../../../../../modules/addons"
import { readPackingSettings } from "../../../../../modules/addons/lib"

/**
 * POST /store/carts/:id/reprice-extras
 *
 * Add-on bags and packing lines carry a custom unit price, which Medusa never
 * refreshes. This recomputes them from the live catalog:
 *  - add-on bag = current bag price (incl. sales) + current add-on prices
 *  - packing line = current packing option price
 * and removes packing lines when the cart has no bags left or packing is off.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.params.id
  const query = req.scope.resolve("query")
  const svc = req.scope.resolve(ADDONS_MODULE) as any

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "region_id", "currency_code", "completed_at", "items.id", "items.variant_id", "items.quantity", "items.unit_price", "items.metadata"],
    filters: { id: cartId },
  })
  const cart = carts[0] as any
  if (!cart) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
  if (cart.completed_at) return res.json({ ok: true, changed: 0 })

  const items: any[] = cart.items || []
  const bags = items.filter((i) => i?.metadata?.packing !== true)
  const addonLines = bags.filter((i) => Array.isArray(i?.metadata?.addons) && i.metadata.addons.length)
  const packingLines = items.filter((i) => i?.metadata?.packing === true)
  let changed = 0

  // Packing lines with no bags, or with packing switched off: remove.
  const settings = await readPackingSettings(req.scope).catch(() => ({ enabled: false } as any))
  if (packingLines.length && (!bags.length || !settings.enabled)) {
    await deleteLineItemsWorkflow(req.scope).run({ input: { cart_id: cartId, ids: packingLines.map((i) => i.id) } })
    changed += packingLines.length
  } else if (packingLines.length) {
    const ids = packingLines.map((i) => i.metadata?.packing_id).filter(Boolean)
    const opts = ids.length ? await svc.listPackingOptions({ id: ids }) : []
    const byId = new Map(opts.map((o: any) => [o.id, o]))
    for (const line of packingLines) {
      const o: any = byId.get(line.metadata?.packing_id)
      if (!o || !o.is_active) {
        await deleteLineItemsWorkflow(req.scope).run({ input: { cart_id: cartId, ids: [line.id] } })
        changed++
        continue
      }
      const price = Number(o.price || 0)
      if (price !== Number(line.unit_price)) {
        await updateLineItemInCartWorkflow(req.scope).run({
          input: { cart_id: cartId, item_id: line.id, update: { unit_price: price, quantity: line.quantity } as any },
        })
        changed++
      }
    }
  }

  if (addonLines.length) {
    const variantIds = [...new Set(addonLines.map((i) => i.variant_id))]
    const { data: variants } = await query.graph({
      entity: "variant",
      fields: ["id", "calculated_price.*"],
      filters: { id: variantIds },
      context: { calculated_price: QueryContext({ region_id: cart.region_id, currency_code: cart.currency_code }) },
    })
    const base = new Map((variants as any[]).map((v) => [v.id, v?.calculated_price?.calculated_amount]))
    const addonIds = [...new Set(addonLines.flatMap((i) => i.metadata.addons.map((a: any) => a.id)))]
    const live = addonIds.length ? await svc.listAddons({ id: addonIds }) : []
    const liveById = new Map(live.map((a: any) => [a.id, a]))

    for (const line of addonLines) {
      const b = base.get(line.variant_id)
      if (typeof b !== "number") continue
      // An add-on removed from the catalog keeps the price it was added at.
      const addons = line.metadata.addons.map((a: any) => {
        const l: any = liveById.get(a.id)
        return l && l.is_active ? { ...a, name: l.name, price: Number(l.price || 0), image: l.image } : a
      })
      const price = b + addons.reduce((s: number, a: any) => s + Number(a.price || 0), 0)
      if (price !== Number(line.unit_price)) {
        await updateLineItemInCartWorkflow(req.scope).run({
          input: {
            cart_id: cartId,
            item_id: line.id,
            update: { unit_price: price, quantity: line.quantity, metadata: { ...line.metadata, addons, base_price: b } } as any,
          },
        })
        changed++
      }
    }
  }

  res.json({ ok: true, changed })
}
