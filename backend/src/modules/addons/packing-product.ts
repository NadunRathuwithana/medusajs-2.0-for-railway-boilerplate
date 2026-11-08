import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { PackingSettings, readPackingSettings, writePackingSettings } from "./lib"

/**
 * Packing upgrades are charged as a normal cart line so tax, promotions and
 * the order total all work. That needs one hidden product. It is created once,
 * the first time packing is switched on, and filtered out of the storefront.
 */
export async function ensurePackingVariant(scope: any): Promise<PackingSettings> {
  const settings = await readPackingSettings(scope)
  if (settings.variant_id) return settings

  const query = scope.resolve("query")
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id", "variants.id"],
    filters: { handle: "internal-packing" },
  })
  let variantId: string | undefined = existing?.[0]?.variants?.[0]?.id

  if (!variantId) {
    const salesChannelService = scope.resolve(Modules.SALES_CHANNEL) as any
    const fulfillment = scope.resolve(Modules.FULFILLMENT) as any
    const [channel] = await salesChannelService.listSalesChannels({}, { take: 1 })
    const [profile] = await fulfillment.listShippingProfiles({}, { take: 1 })

    const { result } = await createProductsWorkflow(scope).run({
      input: {
        products: [
          {
            title: "Packing",
            handle: "internal-packing",
            status: "published",
            metadata: { internal: true },
            shipping_profile_id: profile?.id,
            options: [{ title: "Type", values: ["Packing"] }],
            variants: [
              {
                title: "Packing",
                options: { Type: "Packing" },
                manage_inventory: false,
                prices: [{ amount: 0, currency_code: "lkr" }],
              },
            ],
            sales_channels: channel ? [{ id: channel.id }] : [],
          },
        ],
      },
    })
    variantId = result[0]?.variants?.[0]?.id
  }

  const next = { ...settings, variant_id: variantId ?? null }
  await writePackingSettings(scope, next)
  return next
}
