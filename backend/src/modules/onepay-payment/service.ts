import {
  AbstractPaymentProvider,
  MedusaError,
} from "@medusajs/framework/utils"
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
    const preview = rawText.substring(0, 500) + (rawText.length > 500 ? "...[truncated]" : "")
    console.log(`[Onepay] <-- Status: ${res.status}`)
    console.log("[Onepay] <-- Raw Response:", preview)

    // v3 API always returns 200, even on errors — check body for status
    let parsed: any
    try {
      parsed = JSON.parse(rawText)
    } catch {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Onepay returned non-JSON response: ${preview}`
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

    // OnePay requires `amount` as a STRING with exactly 2 decimal places, e.g. "1692.00".
    // Sending a number (1692) causes "Invalid request body" — OnePay validates the JSON type.
    // The hash formula also uses this exact string, so we use `onepayAmountStr` for both.
    const onepayAmountStr = Number(amount).toFixed(2)  // "1692.00" — string, 2 dp

    const currency = currency_code.toUpperCase()
    const hash = this.generateHash(currency, onepayAmountStr)

    // The session_id is the payment session ID — we pass it as additionalData
    // so the webhook callback can identify which session to capture.
    const sessionId = (context as any).session_id ?? `fallback-${Date.now()}`
    const reference = `order-${sessionId}`

    const requestBody = {
      app_id: this.options_.appId,
      amount: onepayAmountStr,  // MUST be a string "1692.00" — OnePay validates JSON type
      currency,
      hash,
      reference,
      customer_first_name: (context.customer as any)?.first_name || "Customer",
      customer_last_name: (context.customer as any)?.last_name || "Customer",
      customer_phone_number: (context.customer as any)?.phone || "+94770000000",
      customer_email: (context.customer as any)?.email || (context as any).email || "customer@example.com",
      transaction_redirect_url: this.options_.redirectUrl,
      additionalData: sessionId,
    }

    this.logger_.info(`Onepay: creating transaction for ${reference}`)
    console.log("---- ONEPAY PAYMENT API INITIATE ----")
    console.log("Request Body:", JSON.stringify(requestBody, null, 2))

    const response = await this.onepayRequest<OnepayCreateResponse>(
      "/v3/checkout/link/",   // v3 correct endpoint
      requestBody
    )

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

      if (statusResponse.status) {
        return {
          data: {
            ...input.data,
            paid_on: statusResponse.paid_on,
            verified_amount: statusResponse.amount,
            onepay_status: "success",
          },
          status: "authorized",
        }
      }

      return { data: input.data ?? {}, status: "pending" }
    } catch (e: any) {
      this.logger_.error(`Onepay authorizePayment error: ${e.message}`)
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

      if (statusResponse.status) {
        return { status: "captured" }
      }

      return { status: "pending" }
    } catch (e: any) {
      this.logger_.error(`Onepay getPaymentStatus error: ${e.message}`)
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
          session_id: payload.additional_data, // we echoed the reference here
          amount: undefined,                   // Onepay callback doesn't include amount
        },
      }
    }

    return {
      action: "failed",
      data: {
        session_id: payload.additional_data,
        amount: undefined,
      },
    }
  }
}

export default OnepayPaymentService
