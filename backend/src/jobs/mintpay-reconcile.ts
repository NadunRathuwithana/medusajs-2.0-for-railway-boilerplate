import {
  ContainerRegistrationKeys,
  Modules,
  PaymentWebhookEvents,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { mintpayBaseUrl, mintpayGetStatus } from "../modules/mintpay-payment/client"
import {
  MINTPAY_MERCHANT_ID,
  MINTPAY_MERCHANT_SECRET,
  MINTPAY_ENV,
} from "../lib/constants"

const MINTPAY_PROVIDER_ID = "pp_mintpay_mintpay"

/**
 * Mintpay has no push webhook — the storefront's return page verifies status
 * synchronously when the customer comes back from checkout, but if they close
 * the browser mid-flow that verification never runs and the payment session
 * is stuck "pending" forever. This job polls Mintpay's status endpoint for
 * any payment sessions still pending and, for ones that have resolved,
 * emits the same PaymentWebhookEvents.WebhookReceived event a real webhook
 * would — routing through MintpayPaymentService.getWebhookActionAndData
 * exactly like Koko's webhook does, instead of duplicating that logic here.
 */
export default async function mintpayReconcileJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (!MINTPAY_MERCHANT_ID || !MINTPAY_MERCHANT_SECRET) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const eventBus = container.resolve(Modules.EVENT_BUS)

  const { data: sessions } = await query.graph({
    entity: "payment_session",
    filters: {
      provider_id: MINTPAY_PROVIDER_ID,
      status: "pending",
    } as any,
    fields: ["id", "data"],
  })

  let resolved = 0

  for (const session of sessions) {
    const purchaseId = (session.data as Record<string, unknown> | undefined)
      ?.mintpay_purchase_id as string | undefined
    if (!purchaseId) continue

    try {
      const statusResponse = await mintpayGetStatus(
        mintpayBaseUrl(MINTPAY_ENV),
        MINTPAY_MERCHANT_SECRET,
        MINTPAY_MERCHANT_ID,
        purchaseId
      )

      const status = statusResponse.data?.status
      if (status !== "Approved" && status !== "Rejected") {
        continue // still pending on Mintpay's side (or purchase not found yet)
      }

      await eventBus.emit(
        {
          name: PaymentWebhookEvents.WebhookReceived,
          data: {
            provider: "mintpay_mintpay",
            payload: {
              data: { session_id: session.id, status },
              rawData: JSON.stringify({ session_id: session.id, status }),
              headers: {},
            },
          },
        },
        { delay: 0, attempts: 3 }
      )

      resolved++
    } catch (e: any) {
      logger.error(
        `[mintpay-reconcile] status check failed for purchase ${purchaseId}: ${e.message}`
      )
    }
  }

  if (sessions.length > 0) {
    logger.info(
      `[mintpay-reconcile] checked ${sessions.length} pending Mintpay session(s), resolved ${resolved}`
    )
  }
}

export const config = {
  name: "mintpay-reconcile",
  schedule: "*/5 * * * *", // every 5 minutes
}
