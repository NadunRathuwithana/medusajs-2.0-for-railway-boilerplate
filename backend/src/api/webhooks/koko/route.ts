import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, PaymentWebhookEvents } from "@medusajs/framework/utils"

/**
 * Koko _responseUrl webhook handler.
 *
 * Koko POSTs application/x-www-form-urlencoded when a payment succeeds.
 * The body contains: orderId, trnId, status, desc, signature
 * The signature is RSA-signed by Koko with their private key — we verify
 * it against Koko's public key inside getWebhookActionAndData.
 *
 * Note: the urlencoded body is parsed by parseKokoWebhookBody in middlewares.ts.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const eventBus = req.scope.resolve(Modules.EVENT_BUS)

    await eventBus.emit({
      name: PaymentWebhookEvents.WebhookReceived,
      data: {
        provider: "koko_koko",   // Medusa prepends pp_ → pp_koko_koko
        payload: {
          data: req.body as Record<string, unknown>,   // { orderId, trnId, status, desc, signature }
          rawData: (req as any).rawBody || JSON.stringify(req.body),
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
