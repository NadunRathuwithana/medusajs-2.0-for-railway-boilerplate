import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, PaymentWebhookEvents } from "@medusajs/framework/utils"
import { Sentry } from "../../../lib/sentry"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const eventBus = req.scope.resolve(Modules.EVENT_BUS)

    await eventBus.emit({
      name: PaymentWebhookEvents.WebhookReceived,
      data: {
        provider: "onepay_onepay",
        payload: {
          data: req.body as Record<string, unknown>,
          rawData: req.rawBody || JSON.stringify(req.body),
          headers: req.headers as Record<string, unknown>,
        },
      },
    }, {
      delay: 5000,
      attempts: 3,
    })
  } catch (e: any) {
    console.error(JSON.stringify({
      event: "onepay_webhook_error",
      message: e?.message,
      body: req.body,
      timestamp: new Date().toISOString(),
    }))
    Sentry.captureException(e, {
      tags: { payment_provider: "onepay", webhook: "true" },
      extra: { body: req.body },
    })
    // Always 200 — prevent Onepay from retrying
  }

  res.status(200).json({ received: true })
}
