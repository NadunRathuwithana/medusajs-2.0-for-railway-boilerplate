export type KokoOptions = {
  apiKey: string
  apiSecret: string
  merchantId: string
  baseUrl: string
  webhookSecret: string
  successUrl: string  // e.g. "https://cardle.lk/checkout/koko/return"
  cancelUrl: string   // e.g. "https://cardle.lk/checkout?error=payment_cancelled"
}

export type KokoOrderResponse = {
  order_id: string       // Koko's internal order ID
  redirect_url: string   // URL to redirect customer to Koko checkout
  status: string
}

export type KokoWebhookPayload = {
  event: "payment.completed" | "payment.failed" | "payment.cancelled"
  order_id: string
  merchant_reference: string
  amount: number
  currency: string
  paid_at?: string
}
