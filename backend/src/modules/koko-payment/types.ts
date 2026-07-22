export type KokoOptions = {
  baseUrl: string           // qaapi.paykoko.com or prodapi.paykoko.com
  merchantId: string        // _mId
  apiKey: string
  privateKey: string        // PEM — used to SIGN our requests
  kokoPublicKey: string     // PEM — used to VERIFY Koko's _responseUrl webhook
  pluginName: string
  pluginVersion: string
  returnUrl: string
  cancelUrl: string
  responseUrl: string
}

/** Fields submitted via the signed HTML form to Koko's orderCreate endpoint */
export type KokoOrderCreateFields = {
  _mId: string
  api_key: string
  _returnUrl: string
  _cancelUrl: string
  _responseUrl: string
  _amount: string           // "300.00" format — string, 2 decimals
  _currency: string         // ISO 4217, e.g. "LKR"
  _reference: string
  _orderId: string          // MUST be unique per request
  _pluginName: string
  _pluginVersion: string
  _description: string
  _firstName: string
  _lastName: string
  _email: string
  _mobileNo?: string
  dataString: string
  signature: string
}

/** Query params Koko appends when redirecting to _returnUrl / _cancelUrl */
export type KokoReturnParams = {
  orderId: string
  trnId: string
  status: "SUCCESS" | "FAILURE" | "CANCELED"
}

/** Form fields Koko POSTs to _responseUrl (your webhook) */
export type KokoResponseWebhookFields = {
  orderId: string
  trnId: string
  status: "SUCCESS"
  desc: string
  signature: string         // RSA-encrypted by Koko's private key — verify with Koko's PUBLIC key
}

/** orderView API response */
export type KokoOrderViewResponse = {
  orderId: string
  trnId: string
  status: "PENDING" | "SUCCESS" | "FAILED"
  desc: string
  signature: string
}
