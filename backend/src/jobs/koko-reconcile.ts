import {
  ContainerRegistrationKeys,
  Modules,
  PaymentWebhookEvents,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  buildOrderViewDataString,
  signDataString,
} from "../modules/koko-payment/signature"
import {
  KOKO_API_KEY,
  KOKO_MERCHANT_ID,
  KOKO_BASE_URL,
  KOKO_PRIVATE_KEY,
  KOKO_PLUGIN_NAME,
  KOKO_PLUGIN_VERSION,
} from "../lib/constants"

const KOKO_PROVIDER_ID = "pp_koko_koko"

/**
 * Safety net for missed Koko webhooks. Polls Koko's orderView for payment
 * sessions still pending (2 min to 24 h old). For SUCCESS ones, replays
 * Koko's own signed confirmation (orderId + trnId + status + signature from
 * orderView) through the normal webhook event, so signature verification and
 * order completion behave exactly like a real webhook.
 */
export default async function kokoReconcileJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  if (!KOKO_API_KEY || !KOKO_MERCHANT_ID || !KOKO_PRIVATE_KEY) return

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const eventBus = container.resolve(Modules.EVENT_BUS)

  const now = Date.now()
  const { data: sessions } = await query.graph({
    entity: "payment_session",
    filters: { provider_id: KOKO_PROVIDER_ID, status: "pending" } as any,
    fields: ["id", "created_at"],
  })

  let resolved = 0
  for (const session of sessions as any[]) {
    const age = now - new Date(session.created_at).getTime()
    if (age < 2 * 60_000 || age > 24 * 3600_000) continue

    try {
      const dataString = buildOrderViewDataString({
        mId: KOKO_MERCHANT_ID,
        pluginName: KOKO_PLUGIN_NAME,
        pluginVersion: KOKO_PLUGIN_VERSION,
        orderId: session.id,
        apiKey: KOKO_API_KEY,
      })
      const body = new URLSearchParams({
        _mId: KOKO_MERCHANT_ID,
        _pluginName: KOKO_PLUGIN_NAME,
        _pluginVersion: KOKO_PLUGIN_VERSION,
        api_key: KOKO_API_KEY,
        _orderId: session.id,
        signature: signDataString(dataString, KOKO_PRIVATE_KEY),
      })
      const res = await fetch(`${KOKO_BASE_URL}/api/merchants/orderView`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      })
      if (!res.ok) continue // e.g. customer never reached Koko

      const json = (await res.json()) as any
      const c = json?.content
      if (!c || c.status !== "SUCCESS") continue

      await eventBus.emit(
        {
          name: PaymentWebhookEvents.WebhookReceived,
          data: {
            provider: "koko_koko",
            payload: {
              data: {
                orderId: c.orderId,
                trnId: c.trnId,
                status: c.status,
                desc: c.desc ?? "",
                signature: c.signature,
              },
              rawData: JSON.stringify(c),
              headers: {},
            },
          },
        },
        { delay: 0, attempts: 3 }
      )
      resolved++
    } catch (e: any) {
      logger.error(`[koko-reconcile] check failed for ${session.id}: ${e.message}`)
    }
  }

  if (resolved > 0) {
    logger.info(`[koko-reconcile] replayed ${resolved} paid Koko session(s)`)
  }
}

export const config = {
  name: "koko-reconcile",
  schedule: "*/5 * * * *",
}
