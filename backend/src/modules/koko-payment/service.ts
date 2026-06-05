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
import type { KokoOptions, KokoOrderResponse, KokoWebhookPayload } from "./types"

type InjectedDependencies = {
  logger: Logger
}

class KokoPaymentService extends AbstractPaymentProvider<KokoOptions> {
  static identifier = "koko"

  protected logger_: Logger
  protected options_: KokoOptions

  constructor(container: InjectedDependencies, options: KokoOptions) {
    super(container, options)
    this.logger_ = container.logger
    this.options_ = options

    // Validate required options on startup
    const required: (keyof KokoOptions)[] = [
      "apiKey", "apiSecret", "merchantId", "baseUrl",
      "webhookSecret", "successUrl", "cancelUrl",
    ]
    for (const key of required) {
      if (!options[key]) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Koko payment provider: missing required option "${key}"`
        )
      }
    }
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  /** Build HMAC-SHA256 signature for Koko API requests */
  private buildSignature(body: object): string {
    const payload = JSON.stringify(body)
    return crypto
      .createHmac("sha256", this.options_.apiSecret)
      .update(payload)
      .digest("hex")
  }

  /** Make an authenticated request to Koko API */
  private async kokoRequest<T>(
    method: "POST" | "GET",
    path: string,
    body?: object
  ): Promise<T> {
    const url = `${this.options_.baseUrl}${path}`
    const signature = body ? this.buildSignature(body) : ""

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Merchant-ID": this.options_.merchantId,
        "X-API-Key": this.options_.apiKey,
        "X-Signature": signature,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const error = await res.text()
      this.logger_.error(`Koko API error [${res.status}]: ${error}`)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Koko API error: ${error}`
      )
    }

    return res.json() as Promise<T>
  }

  // ─────────────────────────────────────────────
  // REQUIRED ABSTRACT METHODS
  // ─────────────────────────────────────────────

  /**
   * initiatePayment — called when a customer selects Koko at checkout.
   * We create an order on Koko's side and store the redirect URL in session data.
   */
  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code, context } = input

    // Build a unique merchant reference from the cart/session
    const merchantReference = `order-${(context as any).session_id ?? Date.now()}`

    const requestBody = {
      merchant_reference: merchantReference,
      amount: Math.round(Number(amount)),       // in cents/smallest unit
      currency: currency_code.toUpperCase(),
      success_url: this.options_.successUrl,
      cancel_url: this.options_.cancelUrl,
      // Optional: pass customer info if available
      customer: (context as any).customer
        ? {
            email: ((context as any).customer as any).email,
            first_name: ((context as any).customer as any).first_name,
            last_name: ((context as any).customer as any).last_name,
          }
        : undefined,
    }

    this.logger_.info(`Koko: initiating payment for ${merchantReference}`)
    console.log("---- KOKO PAYMENT API INITIATE ----")
    console.log("Request Body:", JSON.stringify(requestBody, null, 2))

    const kokoOrder = await this.kokoRequest<KokoOrderResponse>(
      "POST",
      "/v1/orders",
      requestBody
    )

    return {
      id: kokoOrder.order_id,
      data: {
        koko_order_id: kokoOrder.order_id,
        redirect_url: kokoOrder.redirect_url,
        merchant_reference: merchantReference,
        status: "pending",
      },
    }
  }

  /**
   * authorizePayment — called when the customer returns from Koko checkout.
   * At this point Koko should have already sent a webhook (handled below),
   * but we also verify the payment status directly.
   */
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const kokoOrderId = input.data?.koko_order_id as string | undefined

    if (!kokoOrderId) {
      return { data: input.data ?? {}, status: "error" }
    }

    try {
      const order = await this.kokoRequest<{
        status: string
        order_id: string
      }>("GET", `/v1/orders/${kokoOrderId}`)

      // Map Koko status → Medusa payment status
      const statusMap: Record<string, "authorized" | "pending" | "error"> = {
        completed: "authorized",
        approved: "authorized",
        pending: "pending",
        failed: "error",
        cancelled: "error",
      }

      const status = statusMap[order.status] ?? "pending"

      return {
        data: { ...input.data, koko_status: order.status },
        status,
      }
    } catch (e: any) {
      this.logger_.error(`Koko authorizePayment error: ${e.message}`)
      return { data: input.data ?? {}, status: "error" }
    }
  }

  /**
   * capturePayment — Koko BNPL captures automatically on payment.completed webhook.
   * If you need manual capture, call Koko's capture endpoint here.
   */
  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    const kokoOrderId = input.data?.koko_order_id as string | undefined

    // If Koko auto-captures on approval, this is a no-op.
    // If Koko supports manual capture, call: POST /v1/orders/:id/capture
    this.logger_.info(`Koko: capturing payment for order ${kokoOrderId}`)

    return {
      data: {
        ...input.data,
        captured_at: new Date().toISOString(),
      },
    }
  }

  /**
   * refundPayment — initiate a refund via Koko API.
   */
  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    const kokoOrderId = input.data?.koko_order_id as string | undefined

    if (!kokoOrderId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Koko: missing koko_order_id for refund"
      )
    }

    await this.kokoRequest("POST", `/v1/orders/${kokoOrderId}/refund`, {
      amount: input.amount,
      reason: "Customer requested refund",
    })

    return {
      data: {
        ...input.data,
        refunded_at: new Date().toISOString(),
        refund_amount: input.amount,
      },
    }
  }

  /**
   * cancelPayment — cancel an order before capture.
   */
  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    const kokoOrderId = input.data?.koko_order_id as string | undefined

    if (kokoOrderId) {
      try {
        await this.kokoRequest("POST", `/v1/orders/${kokoOrderId}/cancel`, {})
      } catch (e: any) {
        // Log but don't throw — Medusa still needs to cancel locally
        this.logger_.warn(`Koko: cancel failed for ${kokoOrderId}: ${e.message}`)
      }
    }

    return { data: { ...input.data, cancelled_at: new Date().toISOString() } }
  }

  /**
   * deletePayment — called when customer switches payment methods.
   */
  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return this.cancelPayment(input)
  }

  /**
   * getPaymentStatus — poll current status from Koko.
   */
  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const kokoOrderId = input.data?.koko_order_id as string | undefined

    if (!kokoOrderId) {
      return { status: "pending" }
    }

    const order = await this.kokoRequest<{ status: string }>(
      "GET",
      `/v1/orders/${kokoOrderId}`
    )

    const statusMap: Record<string, GetPaymentStatusOutput["status"]> = {
      completed: "captured",
      approved: "authorized",
      pending: "pending",
      failed: "error",
      cancelled: "canceled",
    }

    return { status: statusMap[order.status] ?? "pending" }
  }

  /**
   * updatePayment — if the cart amount changes, re-create the Koko order.
   */
  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    // Cancel old Koko order and initiate a new one with updated amount
    const oldKokoId = input.data?.koko_order_id as string | undefined
    if (oldKokoId) {
      try {
        await this.kokoRequest("POST", `/v1/orders/${oldKokoId}/cancel`, {})
      } catch (_) {
        // Ignore if already cancelled
      }
    }

    return this.initiatePayment(input)
  }

  /**
   * retrievePayment — fetch order details from Koko.
   */
  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const kokoOrderId = input.data?.koko_order_id as string | undefined

    if (!kokoOrderId) {
      return { data: input.data ?? {} }
    }

    const order = await this.kokoRequest<object>(
      "GET",
      `/v1/orders/${kokoOrderId}`
    )

    return { data: { ...input.data, koko_order: order } }
  }

  /**
   * getWebhookActionAndData — parse incoming Koko webhook events.
   * This is called by your custom webhook route (see Step 3).
   */
  async getWebhookActionAndData(data: {
    data: Record<string, unknown>
    rawData: string | Buffer
    headers: Record<string, unknown>
  }): Promise<WebhookActionResult> {
    const { rawData, headers, data: payload } = data

    // ── Verify webhook signature ──
    const receivedSig = headers["x-koko-signature"] as string | undefined
    if (receivedSig && this.options_.webhookSecret) {
      const expectedSig = crypto
        .createHmac("sha256", this.options_.webhookSecret)
        .update(typeof rawData === "string" ? rawData : rawData.toString("utf-8"))
        .digest("hex")

      if (receivedSig !== expectedSig) {
        this.logger_.warn("Koko: webhook signature mismatch — ignoring")
        return { action: "not_supported" }
      }
    }

    const event = payload as unknown as KokoWebhookPayload

    this.logger_.info(`Koko webhook: ${event.event} for order ${event.order_id}`)

    switch (event.event) {
      case "payment.completed":
        return {
          action: "captured",
          data: {
            session_id: event.merchant_reference,
            amount: event.amount,
          },
        }
      case "payment.failed":
      case "payment.cancelled":
        return {
          action: "failed",
          data: {
            session_id: event.merchant_reference,
            amount: event.amount,
          },
        }
      default:
        return { action: "not_supported" }
    }
  }
}

export default KokoPaymentService
