import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Koko _responseUrl webhook handler.
 *
 * Koko POSTs application/x-www-form-urlencoded when a payment succeeds.
 * The body contains: orderId, trnId, status, desc, signature
 * The signature is RSA-signed by Koko with their private key — we verify
 * it against Koko's public key inside getWebhookActionAndData.
 *
 * Note: the urlencoded middleware is registered in middlewares.ts for this route.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const paymentModule = req.scope.resolve(Modules.PAYMENT)

  try {
    await paymentModule.processEvent({
      provider_id: "pp_koko_koko",
      data: req.body as Record<string, unknown>,   // { orderId, trnId, status, desc, signature }
      rawData: (req as any).rawBody ?? JSON.stringify(req.body),
      headers: req.headers as Record<string, unknown>,
    })
  } catch (e) {
    console.error("Koko webhook error:", e)
  }

  // Koko expects a 200 response to consider the webhook delivered
  res.status(200).json({ received: true })
}
