import {
  AbstractPaymentProvider,
  MedusaError,
} from "@medusajs/framework/utils"
import { Sentry } from "../../lib/sentry"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
  Logger,
} from "@medusajs/framework/types"
import crypto from "crypto"
import type {
  OnepayOptions,
  OnepayCreateResponse,
  OnepayStatusResponse,
  OnepayCallbackPayload,
} from "./types"

type InjectedDependencies = {
  logger: Logger
}

class OnepayPaymentService extends AbstractPaymentProvider<OnepayOptions> {
  static identifier = "onepay"

  protected logger_: Logger
  protected options_: OnepayOptions

  constructor(container: InjectedDependencies, options: OnepayOptions) {
    super(container, options)
    this.logger_ = container.logger
    this.options_ = options

    const required: (keyof OnepayOptions)[] = [
      "appId",
      "token",
      "hashSalt",
      "baseUrl",
      "redirectUrl",
    ]
    for (const key of required) {
      if (!options[key]) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Onepay payment provider: missing required option "${key}"`
        )
      }
    }
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  /**
   * Generate SHA-256 hash as required by Onepay.
   * Formula: SHA256(app_id + currency + amount + HASH_SALT)
   * IMPORTANT: amount must be formatted to 2 decimal places as a string.
   */
  // amount must already be the formatted string "1692.00" — same value sent in the request body.
  private generateHash(currency: string, amount: string): string {
    const raw = `${this.options_.appId}${currency}${amount}${this.options_.hashSalt}`
    return crypto.createHash("sha256").update(raw).digest("hex")
  }


  /**
   * Interpret a /v3/transaction/status/ response.
   *
   * IMPORTANT: Onepay's v3 API uses the SAME "outer status is just an
   * API-call-result code" convention we already proved out for
   * /v3/checkout/link/ (see initiatePayment: `response.status !== 200`
   * check, with the real payload nested under `data`). The previous
   * implementation did `if (statusResponse.status)` as a bare truthy
   * check on that outer field — since it's truthy whenever the HTTP
   * call itself succeeded (e.g. a numeric 200, or any non-empty value),
   * it reported EVERY transaction as authorized regardless of whether
   * the payment actually succeeded, failed, or was cancelled. That's
   * why failed Onepay transactions were showing as "order success".
   *
   * This defensively checks both a flat and a `data`-nested shape, and
   * only trusts an EXPLICIT success or failure marker (mirroring the
   * webhook payload's `status`/`status_message` convention). Anything
   * ambiguous falls through to "pending" — never to success — and logs
   * the raw payload so the exact field names can be confirmed from logs.
   */
  private interpretStatusResponse(raw: any): {
    isSuccess: boolean
    isFailure: boolean
    statusMessage: string
    paidOn?: string
    amount?: number
  } {
    const node = raw && typeof raw === "object" && raw.data ? raw.data : raw
    const rawMessage = node?.status_message ?? raw?.status_message
    const statusMessage = typeof rawMessage === "string" ? rawMessage.toUpperCase() : ""
    const numericStatus =
      typeof node?.status === "number"
        ? node.status
        : typeof raw?.status === "number"
        ? raw.status
        : undefined
    const boolStatus = typeof node?.status === "boolean" ? node.status : undefined

    const isSuccess =
      statusMessage === "SUCCESS" || numericStatus === 1 || boolStatus === true
    const isFailure =
      statusMessage === "FAILED" ||
      statusMessage === "CANCELLED" ||
      numericStatus === 0 ||
      numericStatus === 2 ||
      boolStatus === false

    return {
      isSuccess,
      isFailure,
      statusMessage,
      paidOn: node?.paid_on ?? raw?.paid_on,
      amount: node?.amount ?? raw?.amount,
    }
  }

  /** Make a request to Onepay API */
  private async onepayRequest<T>(
    path: string,
    body: object
  ): Promise<T> {
    const url = `${this.options_.baseUrl}${path}`

    console.log("[Onepay] --> POST", url)
    console.log("[Onepay] --> Body:", JSON.stringify(body, null, 2))

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": this.options_.token,  // v3 API also requires the token header
      },
      body: JSON.stringify(body),
    })

    const rawText = await res.text()
    // Log the FULL response — no truncation
    console.log(`[Onepay] <-- HTTP Status: ${res.status}`)
    console.log("[Onepay] <-- Full Response:", rawText)

    // v3 API always returns 200, even on errors — check body for status
    let parsed: any
    try {
      parsed = JSON.parse(rawText)
    } catch {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Onepay returned non-JSON response: ${rawText}`
      )
    }

    return parsed as T
  }

  // ─────────────────────────────────────────────
  // REQUIRED ABSTRACT METHODS
  // ─────────────────────────────────────────────

  /**
   * initiatePayment — called when customer selects Onepay.
   * Creates a checkout session and returns redirect_url.
   */
  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code, context } = input

    // OnePay expects `amount` as a number (e.g. 1692), not a string.
    // The hash formula uses the 2dp string "1692.00" — these are separate concerns.
    const onepayAmountStr = Number(amount).toFixed(2)  // "1692.00" — used ONLY for hash
    const onepayAmount = parseFloat(onepayAmountStr)    // 1692     — sent in request body

    const currency = currency_code.toUpperCase()
    const hash = this.generateHash(currency, onepayAmountStr)

    // The session_id is the payment session ID — we pass it as additionalData
    // so the webhook callback can identify which session to capture.
    // In Medusa v2, the PaymentSession ID is passed in input.data.session_id
    const sessionId = (input.data as any)?.session_id ?? (context as any).session_id ?? `${Date.now()}`

    // OnePay enforces a 21-character max on the `reference` field.
    // Medusa session IDs ("payses_01KTJ3ZEM...") are ~33 chars — take the last 21
    // which contains the unique ULID suffix. Timestamps are 13 chars (always fine).
    const reference = sessionId.length > 21 ? sessionId.slice(-21) : sessionId

    const inputData = (input.data as any) || {}
    const cust = inputData.customer || ((context as any).customer as any) || {}
    const billing = inputData.billing_address || ((context as any).billing_address as any) || {}
    const shipping = inputData.shipping_address || ((context as any).shipping_address as any) || {}
    
    const firstName = cust.first_name || billing.first_name || shipping.first_name || "Customer"
    const lastName = cust.last_name || billing.last_name || shipping.last_name || "Customer"
    const phone = cust.phone || billing.phone || shipping.phone || "+94770000000"
    const email = cust.email || billing.email || shipping.email || inputData.email || (context as any).email || "customer@example.com"

    const requestBody = {
      app_id: this.options_.appId,
      amount: onepayAmount,  // number: 1692 (matches OnePay example payload format)
      currency,
      hash,
      reference, 
      customer_first_name: firstName,
      customer_last_name: lastName,
      customer_phone_number: phone,
      customer_email: email,
      transaction_redirect_url: this.options_.redirectUrl,
      additionalData: sessionId,
    }

    const hashInput = `${this.options_.appId}${currency}${onepayAmountStr}${this.options_.hashSalt}`

    console.log("\n========== ONEPAY initiatePayment ===========")
    console.log("[1] Medusa amount (raw)  :", amount)
    console.log("[2] Amount for hash (str):", onepayAmountStr)
    console.log("[3] Amount in payload    :", onepayAmount)
    console.log("[4] Hash input string    :", hashInput)
    console.log("[5] Computed hash        :", hash)
    console.log("[6] Session ID           :", sessionId)
    console.log("[7] Reference            :", reference)
    console.log("[8] Redirect URL         :", this.options_.redirectUrl)
    console.log("[9] Full request payload :")
    console.log(JSON.stringify(requestBody, null, 2))
    console.log("============================================\n")

    const response = await this.onepayRequest<OnepayCreateResponse>(
      "/v3/checkout/link/",
      requestBody
    )

    console.log("\n========== ONEPAY RESPONSE ===========")
    console.log(JSON.stringify(response, null, 2))
    console.log("======================================\n")

    // v3 API actually returns status as a number (e.g. 200) and nests data
    if (response.status !== 200 || !response.data?.gateway?.redirect_url) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Onepay: failed to create transaction — ${response.message ?? "unknown error"}`
      )
    }

    return {
      id: response.data.ipg_transaction_id,
      data: {
        ipg_transaction_id: response.data.ipg_transaction_id,
        redirect_url: response.data.gateway.redirect_url,
        reference,
        session_id: sessionId,
        onepay_status: "pending",
      },
    }
  }

  /**
   * authorizePayment — verify payment status with Onepay directly.
   * Called when customer returns from Onepay redirect.
   */
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const ipgTransactionId = input.data?.ipg_transaction_id as string | undefined

    if (!ipgTransactionId) {
      this.logger_.warn("Onepay: authorizePayment called without ipg_transaction_id")
      return { data: input.data ?? {}, status: "pending" }
    }

    try {
      const statusResponse = await this.onepayRequest<OnepayStatusResponse>(
        "/v3/transaction/status/",
        {
          app_id: this.options_.appId,
          onepay_transaction_id: ipgTransactionId,
        }
      )

      const { isSuccess, isFailure, statusMessage, paidOn, amount } =
        this.interpretStatusResponse(statusResponse)

      if (isSuccess) {
        return {
          data: {
            ...input.data,
            paid_on: paidOn,
            verified_amount: amount,
            onepay_status: "success",
          },
          status: "authorized",
        }
      }

      if (isFailure) {
        this.logger_.warn(
          `Onepay: transaction ${ipgTransactionId} reported as ${statusMessage || "failed"} — not authorizing`
        )
        return {
          data: { ...input.data, onepay_status: statusMessage || "failed" },
          status: "error",
        }
      }

      // Ambiguous response shape — log the raw payload so the exact field
      // names can be confirmed, but never default to authorized.
      this.logger_.warn(
        `Onepay: unrecognized status response for ${ipgTransactionId}: ${JSON.stringify(statusResponse)}`
      )
      return { data: input.data ?? {}, status: "pending" }
    } catch (e: any) {
      this.logger_.error(`Onepay authorizePayment error: ${e.message}`)
      Sentry.captureException(e, {
        tags: { payment_provider: "onepay", operation: "authorizePayment" },
      })
      return { data: input.data ?? {}, status: "error" }
    }
  }

  /**
   * capturePayment — Onepay captures automatically.
   * This is a no-op; just record the capture timestamp.
   */
  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    this.logger_.info(
      `Onepay: capture for ${input.data?.ipg_transaction_id ?? "unknown"}`
    )
    return {
      data: {
        ...input.data,
        captured_at: new Date().toISOString(),
      },
    }
  }

  /**
   * refundPayment — Onepay v3 does not expose a public refund API endpoint.
   * Refunds must be initiated manually via the merchant portal.
   * Log the request and throw a clear error so admin knows to handle manually.
   */
  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    const ipgId = input.data?.ipg_transaction_id
    this.logger_.warn(
      `Onepay: refund requested for ${ipgId} — amount: ${input.amount}. ` +
      `Process manually via Onepay merchant portal.`
    )

    // Return data unchanged — admin must handle manually
    return {
      data: {
        ...input.data,
        refund_pending_manual: true,
        refund_requested_at: new Date().toISOString(),
        refund_amount: input.amount,
      },
    }
  }

  /**
   * cancelPayment — Onepay doesn't expose a cancel endpoint.
   * Mark cancelled locally.
   */
  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    this.logger_.info(
      `Onepay: cancelling payment ${input.data?.ipg_transaction_id ?? "unknown"}`
    )
    return {
      data: {
        ...input.data,
        cancelled_at: new Date().toISOString(),
        onepay_status: "cancelled",
      },
    }
  }

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return this.cancelPayment(input)
  }

  /**
   * getPaymentStatus — poll Onepay for current status.
   */
  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const ipgTransactionId = input.data?.ipg_transaction_id as string | undefined

    if (!ipgTransactionId) {
      return { status: "pending" }
    }

    try {
      const statusResponse = await this.onepayRequest<OnepayStatusResponse>(
        "/v3/transaction/status/",
        {
          app_id: this.options_.appId,
          onepay_transaction_id: ipgTransactionId,
        }
      )

      const { isSuccess, isFailure, statusMessage } =
        this.interpretStatusResponse(statusResponse)

      if (isSuccess) {
        return { status: "captured" }
      }

      if (isFailure) {
        this.logger_.warn(
          `Onepay: transaction ${ipgTransactionId} reported as ${statusMessage || "failed"} — not captured`
        )
        return { status: "error" }
      }

      return { status: "pending" }
    } catch (e: any) {
      this.logger_.error(`Onepay getPaymentStatus error: ${e.message}`)
      Sentry.captureException(e, {
        tags: { payment_provider: "onepay", operation: "getPaymentStatus" },
      })
      return { status: "error" }
    }
  }

  /**
   * updatePayment — cart amount changed, re-initiate with new amount.
   */
  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    // Onepay has no "update" endpoint — just create a fresh transaction
    this.logger_.info("Onepay: amount changed, re-initiating payment session")
    return this.initiatePayment(input)
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const ipgTransactionId = input.data?.ipg_transaction_id as string | undefined

    if (!ipgTransactionId) {
      return { data: input.data ?? {} }
    }

    try {
      const statusResponse = await this.onepayRequest<OnepayStatusResponse>(
        "/v3/transaction/status/",
        {
          app_id: this.options_.appId,
          onepay_transaction_id: ipgTransactionId,
        }
      )
      return { data: { ...input.data, onepay_details: statusResponse } }
    } catch (_) {
      return { data: input.data ?? {} }
    }
  }

  /**
   * getWebhookActionAndData — parse Onepay callback POSTs.
   * Onepay posts a result_data object with transaction details.
   */
  async getWebhookActionAndData(data: {
    data: Record<string, unknown>
    rawData: string | Buffer
    headers: Record<string, unknown>
  }): Promise<WebhookActionResult> {
    const payload = data.data as unknown as OnepayCallbackPayload

    this.logger_.info(
      `Onepay webhook: ${payload.status_message} for ${payload.transaction_id}`
    )

    // Status 1 = SUCCESS per Onepay docs
    if (payload.status === 1 && payload.status_message === "SUCCESS") {
      return {
        action: "captured",
        data: {
          session_id: payload.additional_data, // the internal Medusa session ID (payses_...)
          amount: payload.amount,             // sometimes needed for capture
        },
      }
    }

    return {
      action: "failed",
      data: {
        session_id: payload.additional_data,
        amount: payload.amount,
      },
    }
  }
}

export default OnepayPaymentService
