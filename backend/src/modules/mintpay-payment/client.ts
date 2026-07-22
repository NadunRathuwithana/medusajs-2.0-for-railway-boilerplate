import { MedusaError } from "@medusajs/framework/utils"
import type {
  MintpayOrderCreateBody,
  MintpayOrderCreateResponse,
  MintpayStatusResponse,
} from "./types"

export function mintpayBaseUrl(env: "sandbox" | "live"): string {
  return env === "live" ? "https://app.mintpay.lk" : "https://dev.mintpay.lk"
}

async function parseJsonResponse<T>(res: Response, context: string): Promise<T> {
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Mintpay ${context} returned non-JSON response [${res.status}]: ${text}`
    )
  }
}

/** Step 1 — POST order/customer data, returns a purchase_id on success */
export async function mintpayCreateOrder(
  baseUrl: string,
  merchantSecret: string,
  body: MintpayOrderCreateBody
): Promise<MintpayOrderCreateResponse> {
  const res = await fetch(`${baseUrl}/user-order/api/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${merchantSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  return parseJsonResponse<MintpayOrderCreateResponse>(res, "order create")
}

/** Inquire payment status — used both by authorizePayment/getPaymentStatus and the reconciliation job */
export async function mintpayGetStatus(
  baseUrl: string,
  merchantSecret: string,
  merchantId: string,
  purchaseId: string
): Promise<MintpayStatusResponse> {
  const res = await fetch(
    `${baseUrl}/user-order/api/status/merchantId/${encodeURIComponent(
      merchantId
    )}/purchaseId/${encodeURIComponent(purchaseId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Token ${merchantSecret}`,
        "Content-Type": "application/json",
      },
    }
  )

  return parseJsonResponse<MintpayStatusResponse>(res, "status check")
}
