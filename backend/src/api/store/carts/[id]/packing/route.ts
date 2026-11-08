import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  addToCartWorkflow,
  deleteLineItemsWorkflow,
  updateCartWorkflow,
} from "@medusajs/medusa/core-flows"
import { ADDONS_MODULE } from "../../../../../modules/addons"
import { readPackingSettings } from "../../../../../modules/addons/lib"

/**
 * POST /store/carts/:id/packing  { packing_ids: string[] }
 * Standard packing is always included and free. Each ticked extra (box, bag...)
 * becomes one "packing" line at its catalog price. [] = standard only.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.params.id
  const raw = ((req.body ?? {}) as any).packing_ids
  const ids: string[] = Array.isArray(raw) ? [...new Set(raw.map(String))].slice(0, 10) : []

  const settings = await readPackingSettings(req.scope)
  if (!settings.enabled) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Packing is switched off")

  const svc = req.scope.resolve(ADDONS_MODULE) as any
  const options = ids.length
    ? (await svc.listPackingOptions({ id: ids, is_active: true })).filter((o: any) => !o.is_default)
    : []
  if (options.length !== ids.length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "A packing option is not available")
  }

  const query = req.scope.resolve("query")
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "metadata", "items.id", "items.metadata"],
    filters: { id: cartId },
  })
  const cart = carts[0] as any
  if (!cart) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")

  const old = (cart.items ?? []).filter((i: any) => i.metadata?.packing === true).map((i: any) => i.id)
  if (old.length) await deleteLineItemsWorkflow(req.scope).run({ input: { cart_id: cartId, ids: old } })

  const paid = options.filter((o: any) => Number(o.price || 0) > 0)
  if (paid.length) {
    if (!settings.variant_id) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Packing is not set up")
    // Different metadata per option keeps them as separate lines.
    await addToCartWorkflow(req.scope).run({
      input: {
        cart_id: cartId,
        items: paid.map((o: any) => ({
          variant_id: settings.variant_id!,
          quantity: 1,
          unit_price: Number(o.price),
          metadata: { packing: true, packing_id: o.id, packing_name: o.name, image: o.image },
        })) as any,
      },
    })
  }

  await updateCartWorkflow(req.scope).run({
    input: {
      id: cartId,
      metadata: {
        ...(cart.metadata ?? {}),
        packing_ids: options.map((o: any) => o.id),
        packing_names: options.map((o: any) => o.name),
      },
    },
  })
  res.json({ ok: true, packing_ids: options.map((o: any) => o.id) })
}
