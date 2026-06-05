import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, PaymentWebhookEvents } from "@medusajs/framework/utils"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const eventBus = req.scope.resolve(Modules.EVENT_BUS)

    await eventBus.emit({
      name: PaymentWebhookEvents.WebhookReceived,
      data: {
        provider: "pp_onepay_onepay",
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
  } catch (e) {
    console.error("Onepay webhook error:", e)
    // Always 200 — prevent Onepay from retrying
  }

  res.status(200).json({ received: true })
}
