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
 * POST /store/carts/:id/packing  { packing_id: string | null }
 * null or the default option = included, nothing charged.
 * Any other option adds one "packing" line at that option's price.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.params.id
  const packingId = ((req.body ?? {}) as any).packing_id as string | null | undefined

  const settings = await readPackingSettings(req.scope)
  if (!settings.enabled) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Packing is switched off")

  const svc = req.scope.resolve(ADDONS_MODULE) as any
  let option: any = null
  if (packingId) {
    option = await svc.retrievePackingOption(packingId).catch(() => null)
    if (!option || !option.is_active) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Packing option not available")
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

  const charge = option && !option.is_default ? Number(option.price || 0) : 0
  if (option && charge > 0) {
    if (!settings.variant_id) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Packing is not set up")
    await addToCartWorkflow(req.scope).run({
      input: {
        cart_id: cartId,
        items: [
          {
            variant_id: settings.variant_id,
            quantity: 1,
            unit_price: charge,
            metadata: { packing: true, packing_id: option.id, packing_name: option.name, image: option.image },
          } as any,
        ],
      },
    })
  }

  await updateCartWorkflow(req.scope).run({
    input: {
      id: cartId,
      metadata: {
        ...(cart.metadata ?? {}),
        packing_id: option?.id ?? null,
        packing_name: option?.name ?? null,
      },
    },
  })
  res.json({ ok: true, packing_id: option?.id ?? null, charge })
}
