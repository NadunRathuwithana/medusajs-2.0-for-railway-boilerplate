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
import {
  buildOrderCreateDataString,
  buildOrderViewDataString,
  signDataString,
  verifySignature,
} from "./signature"
import type {
  KokoOptions,
  KokoOrderCreateFields,
  KokoOrderViewResponse,
  KokoResponseWebhookFields,
} from "./types"

type InjectedDependencies = {
  logger: Logger
}

class KokoPaymentService extends AbstractPaymentProvider<KokoOptions> {
  static identifier = "koko"

  // In-memory cache to bridge the race condition between webhook and authorizePayment.
  // Stores verified statuses so we don't need to re-poll orderView immediately.
  private static webhookCache = new Map<string, { status: string, timestamp: number }>()

  protected logger_: Logger
  protected options_: KokoOptions

  constructor(container: InjectedDependencies, options: KokoOptions) {
    super(container, options)
    this.logger_ = container.logger
    this.options_ = options

    const required: (keyof KokoOptions)[] = [
      "baseUrl", "merchantId", "apiKey", "privateKey", "kokoPublicKey",
      "pluginName", "pluginVersion", "returnUrl", "cancelUrl", "responseUrl",
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
  // OPTIONAL: Account holder (not supported by Koko)
  // ─────────────────────────────────────────────

  /**
   * Koko is a form-POST provider with no server-side customer accounts.
   * Implementing a no-op silences Medusa's "does not support creating account
   * holders" warning without affecting the payment flow.
   */
  async createAccountHolder(): Promise<void> {
    // no-op
  }

  // ─────────────────────────────────────────────
  // REQUIRED ABSTRACT METHODS
  // ─────────────────────────────────────────────


  /**
   * initiatePayment — builds the signed form fields for Koko's orderCreate.
   *
   * IMPORTANT: Koko's flow is a browser FORM POST, not a server-to-server call.
   * We build and sign the fields here (private key never leaves the server),
   * then return them so the storefront can render + auto-submit the hidden form.
   */
  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code, context } = input

    // Medusa stores amounts in smallest unit (cents) — Koko wants "300.00" format
    const kokoAmount = Number(amount).toFixed(2)
    const currency = currency_code.toUpperCase()

    // In Medusa v2, the PaymentSession ID is passed in input.data.session_id
    const sessionId = (input.data as any)?.session_id ?? (context as any).session_id ?? "sess"

    // _orderId MUST be unique per request per Koko's docs.
    // The Medusa PaymentSession ID is already unique, so we can use it directly.
    const orderId = sessionId
    const reference = orderId

    const firstName = (context as any).customer?.first_name ?? "Customer"
    const lastName = (context as any).customer?.last_name ?? ""
    const email = (context as any).customer?.email ?? ""
    const mobile = (context as any).customer?.phone ?? ""
    const description = "Cardle order"

    const dataString = buildOrderCreateDataString({
      mId: this.options_.merchantId,
      amount: kokoAmount,
      currency,
      pluginName: this.options_.pluginName,
      pluginVersion: this.options_.pluginVersion,
      returnUrl: this.options_.returnUrl,
      cancelUrl: this.options_.cancelUrl,
      orderId,
      reference,
      firstName,
      lastName,
      email,
      description,
      apiKey: this.options_.apiKey,
      responseUrl: this.options_.responseUrl,
    })

    const signature = signDataString(dataString, this.options_.privateKey)

    const formFields: KokoOrderCreateFields = {
      _mId: this.options_.merchantId,
      api_key: this.options_.apiKey,
      _returnUrl: this.options_.returnUrl,
      _cancelUrl: this.options_.cancelUrl,
      _responseUrl: this.options_.responseUrl,
      _amount: kokoAmount,
      _currency: currency,
      _reference: reference,
      _orderId: orderId,
      _pluginName: this.options_.pluginName,
      _pluginVersion: this.options_.pluginVersion,
      _description: description,
      _firstName: firstName,
      _lastName: lastName,
      _email: email,
      _mobileNo: mobile || undefined,
      dataString,
      signature,
    }

    this.logger_.info(`Koko: built signed order form for orderId=${orderId}`)

    return {
      id: orderId,
      data: {
        koko_order_id: orderId,
        koko_form_action: `${this.options_.baseUrl}/api/merchants/orderCreate`,
        koko_form_fields: formFields,
        koko_status: "pending",
      },
    }
  }

  /**
   * authorizePayment — called when customer returns from Koko via _returnUrl.
   * We don't fully trust the redirect params alone — confirm with orderView.
   */
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const orderId = input.data?.koko_order_id as string | undefined

    if (!orderId) {
      return { data: input.data ?? {}, status: "pending" }
    }

    try {
      // 1. Check if the webhook already verified this payment
      const cached = KokoPaymentService.webhookCache.get(orderId)
      if (cached && cached.status === "SUCCESS") {
        this.logger_.info(`Koko authorizePayment: trusted webhook-verified SUCCESS for order ${orderId}`)
        return {
          data: { ...input.data, koko_status: "SUCCESS" },
          status: "authorized",
        }
      }

      // 2. Fallback to polling the orderView API
      const orderView = await this.callOrderView(orderId)

      const statusMap: Record<string, "authorized" | "pending" | "error"> = {
        SUCCESS: "authorized",
        PENDING: "pending",
        FAILED: "error",
      }

      return {
        data: { ...input.data, koko_trn_id: orderView.trnId, koko_status: orderView.status },
        status: statusMap[orderView.status] ?? "pending",
      }
    } catch (e: any) {
      this.logger_.error(`Koko authorizePayment error: ${e.message}`)
      return { data: input.data ?? {}, status: "error" }
    }
  }

  /**
   * capturePayment — Koko auto-captures on successful payment; no-op here.
   */
  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    return {
      data: { ...input.data, captured_at: new Date().toISOString() },
    }
  }

  /**
   * refundPayment — Koko's developer preview docs do not expose a refund
   * endpoint. Flag for manual processing via Koko merchant support.
   */
  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    this.logger_.warn(
      `Koko: refund requested for order ${input.data?.koko_order_id} — ` +
      `amount ${input.amount}. No refund API in current docs — contact Koko support.`
    )
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
   * cancelPayment — no cancel API exposed; mark locally.
   * The customer's own _cancelUrl flow handles cancellation on Koko's side.
   */
  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    return {
      data: { ...input.data, cancelled_at: new Date().toISOString() },
    }
  }

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return this.cancelPayment(input)
  }

  /**
   * getPaymentStatus — poll Koko's orderView API.
   */
  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const orderId = input.data?.koko_order_id as string | undefined
    if (!orderId) return { status: "pending" }

    try {
      const orderView = await this.callOrderView(orderId)
      const statusMap: Record<string, GetPaymentStatusOutput["status"]> = {
        SUCCESS: "captured",
        PENDING: "pending",
        FAILED: "error",
      }
      return { status: statusMap[orderView.status] ?? "pending" }
    } catch (e: any) {
      this.logger_.error(`Koko getPaymentStatus error: ${e.message}`)
      return { status: "error" }
    }
  }

  /**
   * updatePayment — cart amount changed; build a fresh signed form
   * (Koko requires a unique _orderId per request anyway).
   */
  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    return this.initiatePayment(input)
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const orderId = input.data?.koko_order_id as string | undefined
    if (!orderId) return { data: input.data ?? {} }

    try {
      const orderView = await this.callOrderView(orderId)
      return { data: { ...input.data, koko_order_view: orderView } }
    } catch (_) {
      return { data: input.data ?? {} }
    }
  }

  /**
   * getWebhookActionAndData — handle Koko's _responseUrl server callback.
   *
   * IMPORTANT per Koko docs: the `signature` field here is Koko's own
   * RSA-encrypted confirmation, built from:
   *   orderId + trnId + status
   * and signed with KOKO's private key. We verify it using KOKO's PUBLIC
   * key (the one they emailed you) — NOT our own private key.
   */
  async getWebhookActionAndData(data: {
    data: Record<string, unknown>
    rawData: string | Buffer
    headers: Record<string, unknown>
  }): Promise<WebhookActionResult> {
    const payload = data.data as unknown as KokoResponseWebhookFields

    const expectedDataString = `${payload.orderId}${payload.trnId}${payload.status}`

    const isValid = verifySignature(
      expectedDataString,
      payload.signature,
      this.options_.kokoPublicKey
    )

    if (!isValid) {
      this.logger_.warn(
        `Koko webhook: signature verification FAILED for order ${payload.orderId} — ignoring`
      )
      return { action: "not_supported" }
    }

    this.logger_.info(`Koko webhook verified: ${payload.status} for order ${payload.orderId}`)

    // The orderId is exactly the Medusa PaymentSession ID
    const medusaSessionId = payload.orderId

    if (payload.status === "SUCCESS") {
      // Store the verified status in our cache so authorizePayment can use it
      KokoPaymentService.webhookCache.set(medusaSessionId, { status: "SUCCESS", timestamp: Date.now() })

      // Cleanup old entries to prevent memory leaks (keep last 1 hour)
      const oneHourAgo = Date.now() - 3600000
      for (const [key, value] of KokoPaymentService.webhookCache.entries()) {
        if (value.timestamp < oneHourAgo) KokoPaymentService.webhookCache.delete(key)
      }

      return {
        action: "captured",
        data: {
          session_id: medusaSessionId,
          amount: 0,
        },
      }
    }

    return {
      action: "failed",
      data: {
        session_id: medusaSessionId,
        amount: 0,
      },
    }
  }

  // ─────────────────────────────────────────────
  // PRIVATE: Order View API call
  // ─────────────────────────────────────────────

  private async callOrderView(orderId: string): Promise<KokoOrderViewResponse> {
    const dataString = buildOrderViewDataString({
      mId: this.options_.merchantId,
      pluginName: this.options_.pluginName,
      pluginVersion: this.options_.pluginVersion,
      orderId,
      apiKey: this.options_.apiKey,
    })

    const signature = signDataString(dataString, this.options_.privateKey)

    const body = new URLSearchParams({
      _mId: this.options_.merchantId,
      _pluginName: this.options_.pluginName,
      _pluginVersion: this.options_.pluginVersion,
      api_key: this.options_.apiKey,
      _orderId: orderId,
      signature,
    })

    const res = await fetch(`${this.options_.baseUrl}/api/merchants/orderView`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Koko orderView failed [${res.status}]: ${errText}`
      )
    }

    return res.json() as Promise<KokoOrderViewResponse>
  }
}

export default KokoPaymentService
