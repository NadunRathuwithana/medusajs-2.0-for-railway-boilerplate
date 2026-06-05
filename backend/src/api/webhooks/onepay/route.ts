import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const paymentModule = req.scope.resolve(Modules.PAYMENT)

  try {
    await paymentModule.processEvent({
      provider_id: "pp_onepay_onepay",
      payload: {
        data: req.body as Record<string, unknown>,
        rawData: JSON.stringify(req.body),
        headers: req.headers as Record<string, unknown>,
      },
    })
  } catch (e) {
    console.error("Onepay webhook error:", e)
    // Always 200 — prevent Onepay from retrying
  }

  res.status(200).json({ received: true })
}
