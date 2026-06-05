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
        provider: "pp_koko_koko",  // format: pp_{identifier}_{id}
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
    console.error("Koko webhook error:", e)
    // Always return 200 to prevent Koko retrying on server errors
  }

  res.status(200).json({ received: true })
}
