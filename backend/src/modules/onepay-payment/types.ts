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

// v3 API /v3/transaction/status/ response
export type OnepayStatusResponse = {
  status: boolean
  ipg_transaction_id: string
  amount: number
  currency: string
  paid_on: string           // "YYYY-MM-DD HH:mm:ss"
}

// Webhook callback payload
export type OnepayCallbackPayload = {
  transaction_id: string
  status: number            // 1 = SUCCESS
  status_message: string    // "SUCCESS" | "FAILED" | "CANCELLED"
  additional_data: string   // echoed back additionalData field
  amount: number            // transaction amount
}
