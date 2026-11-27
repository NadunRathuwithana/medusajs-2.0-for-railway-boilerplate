import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { MedusaError, ContainerRegistrationKeys } from "@medusajs/framework/utils"

const COD_PROVIDER = "pp_system_default"
const COD_MAX_LKR = 8000
const CARD_PROMO = "CARD_5"

/**
 * Server-side guards that used to live only in the storefront:
 *  - COD is capped at LKR 8,000
 *  - the card-only CARD_5 promo cannot ride on a non-card order
 * A direct /store/carts/:id/complete call can no longer bypass them.
 */
completeCartWorkflow.hooks.validate(async ({ cart }, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "total",
      "promotions.code",
      "payment_collection.payment_sessions.provider_id",
      "payment_collection.payment_sessions.status",
    ],
    filters: { id: (cart as any).id },
  })
  const c: any = data?.[0]
  if (!c) return

  const sessions: any[] = c.payment_collection?.payment_sessions ?? []
  const live = sessions.filter((s) => s.status !== "canceled" && s.status !== "error")
  const providers = live.map((s) => String(s.provider_id))
  const onlyCod = providers.length > 0 && providers.every((p) => p === COD_PROVIDER)

  if (onlyCod && Number(c.total) > COD_MAX_LKR) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cash on delivery is available for orders up to LKR 8,000. Please choose another payment method."
    )
  }

  const hasCardPromo = (c.promotions ?? []).some((p: any) => p?.code === CARD_PROMO)
  const hasCardSession = providers.some((p) => p.includes("onepay"))
  if (hasCardPromo && !hasCardSession) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "The 5% card discount only applies to card payments."
    )
  }
})
