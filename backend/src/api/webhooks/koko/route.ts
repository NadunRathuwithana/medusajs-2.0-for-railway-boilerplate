import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const paymentModule = req.scope.resolve(Modules.PAYMENT)

  try {
    await paymentModule.processEvent({
      provider_id: "pp_koko_koko",  // format: pp_{identifier}_{id}
      payload: {
        data: req.body as Record<string, unknown>,
        rawData: JSON.stringify(req.body),
        headers: req.headers as Record<string, unknown>,
      },
    })
  } catch (e) {
    console.error("Koko webhook error:", e)
    // Always return 200 to prevent Koko retrying on server errors
  }

  res.status(200).json({ received: true })
}
