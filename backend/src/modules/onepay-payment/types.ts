export type OnepayOptions = {
  appId: string
  token: string             // kept for backwards compat but not sent in headers
  hashSalt: string          // NEVER expose this client-side
  baseUrl: string           // https://api.onepay.lk
  redirectUrl: string       // e.g. https://your-store.com/checkout/onepay/return
}

// v3 API /v3/checkout/link/ response
export type OnepayCreateResponse = {
  status: number            // 200 = success
  message: string
  data?: {
    ipg_transaction_id: string
    gateway: {
      redirect_url: string
    }
  }
}

// v3 API /v3/transaction/status/ response.
// NOTE: the exact shape hasn't been confirmed against a real FAILED/CANCELLED
// transaction — this is deliberately loose (all optional) so
// OnepayPaymentService.interpretStatusResponse() can defensively read either
// a flat shape or one nested under `data` (matching /v3/checkout/link/'s
// convention, where the top-level `status` is an API-call-result code, not
// the payment outcome) without fighting the type checker. Never assume a
// bare truthy top-level `status` means the payment succeeded.
export type OnepayStatusResponse = {
  status?: boolean | number
  status_message?: string  // "SUCCESS" | "FAILED" | "CANCELLED", if present
  ipg_transaction_id?: string
  amount?: number
  currency?: string
  paid_on?: string          // "YYYY-MM-DD HH:mm:ss"
  data?: {
    status?: boolean | number
    status_message?: string
    ipg_transaction_id?: string
    amount?: number
    currency?: string
    paid_on?: string
  }
}

// Webhook callback payload
export type OnepayCallbackPayload = {
  transaction_id: string
  status: number            // 1 = SUCCESS
  status_message: string    // "SUCCESS" | "FAILED" | "CANCELLED"
  additional_data: string   // echoed back additionalData field
  amount: number            // transaction amount
}
