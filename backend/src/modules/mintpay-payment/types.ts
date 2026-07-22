export type MintpayOptions = {
  merchantId: string
  merchantSecret: string          // sent as "Authorization: Token <secret>"
  env: "sandbox" | "live"
  successUrl: string
  failUrl: string
}

/** A single line item within the `products` array of the order-create body */
export type MintpayProductField = {
  name: string
  product_id: string
  sku: string
  quantity: string
  unit_price: string
  discount: string
  created_date: string            // format "Y-M-D H:M:S"
  updated_date: string            // format "Y-M-D H:M:S"
}

/** Body POSTed to Mintpay's user-order/api/ (Step 1) */
export type MintpayOrderCreateBody = {
  merchant_id: string
  order_id: string
  total_price: string
  discount: string
  customer_email: string
  customer_id: string
  customer_telephone: string
  ip: string
  x_forwarded_for: string
  delivery_street: string
  delivery_region: string
  delivery_postcode: string
  cart_created_date: string       // format "Y-M-D H:M:S"
  cart_updated_date: string       // format "Y-M-D H:M:S"
  products: MintpayProductField[]
  success_url: string
  fail_url: string
}

/** Response from user-order/api/ — `data` is the purchase_id on success, an error reason on failure */
export type MintpayOrderCreateResponse = {
  message: "Success" | "Failed"
  data: string
}

export type MintpayStatusData = {
  order_id?: number
  total_price?: number
  status?: "Approved" | "Rejected"
  channel?: string
  created_at?: string
}

/** Response from user-order/api/status/... — `data` is `{}` when the purchase doesn't exist */
export type MintpayStatusResponse = {
  message: string                 // "Success" | "Failed" | "Order doesn't exists"
  data: MintpayStatusData
}
