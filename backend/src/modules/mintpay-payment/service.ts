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
import { mintpayBaseUrl, mintpayCreateOrder, mintpayGetStatus } from "./client"
import type {
  MintpayOptions,
  MintpayOrderCreateBody,
  MintpayProductField,
} from "./types"

type InjectedDependencies = {
  logger: Logger
}

class MintpayPaymentService extends AbstractPaymentProvider<MintpayOptions> {
  static identifier = "mintpay"

  protected logger_: Logger
  protected options_: MintpayOptions

  constructor(container: InjectedDependencies, options: MintpayOptions) {
    super(container, options)
    this.logger_ = container.logger
    this.options_ = options

    const required: (keyof MintpayOptions)[] = [
      "merchantId",
      "merchantSecret",
      "env",
      "successUrl",
      "failUrl",
    ]
    for (const key of required) {
      if (!options[key]) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Mintpay payment provider: missing required option "${key}"`
        )
      }
    }
  }

  private get baseUrl(): string {
    return mintpayBaseUrl(this.options_.env)
  }

  // ─────────────────────────────────────────────
  // OPTIONAL: Account holder (not supported by Mintpay)
  // ─────────────────────────────────────────────

  /**
   * Mintpay is a redirect-based BNPL provider with no server-side customer
   * accounts. A no-op silences Medusa's "does not support creating account
   * holders" warning without affecting the payment flow.
   */
  async createAccountHolder(): Promise<void> {
    // no-op
  }

  // ─────────────────────────────────────────────
  // REQUIRED ABSTRACT METHODS
  // ─────────────────────────────────────────────

  /**
   * initiatePayment — Mintpay's Step 1: a server-to-server POST of order and
   * customer data, which returns a purchase_id. The storefront then
   * auto-submits a hidden form (Step 2, see mintpay_form_action/fields below)
   * with that purchase_id to redirect the customer to Mintpay's hosted
   * payment page.
   */
  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, context } = input
    const inputData = (input.data as any) || {}

    // In Medusa v2, the PaymentSession ID is injected into input.data.session_id
    // by the payment module before initiatePayment is called — already unique,
    // so it doubles as Mintpay's required-unique order_id.
    const sessionId = inputData.session_id ?? (context as any)?.session_id ?? "sess"
    const orderId = sessionId

    const customer = inputData.customer || (context as any)?.customer || {}
    const billingAddress = inputData.billing_address || {}
    const shippingAddress = inputData.shipping_address || billingAddress || {}

    const email = customer.email || inputData.email || billingAddress.email || ""
    // Mintpay's docs describe customer_id as only applicable to "registered
    // customers" — Medusa only populates context.customer when the cart has a
    // customer_id (i.e. the shopper is logged in), so an empty string for
    // guest checkouts matches that same semantics.
    const customerId = customer.id ? String(customer.id) : ""
    const phone =
      customer.phone || shippingAddress.phone || billingAddress.phone || ""

    const totalPrice = Number(amount).toFixed(2)

    const items = Array.isArray(inputData.items) ? inputData.items : []
    const products: MintpayProductField[] = items.map((item: any) => ({
      name: item.product_title || item.title || "Item",
      product_id: String(item.product_id ?? item.id ?? ""),
      sku: item.variant_sku || item.variant_title || "",
      quantity: String(item.quantity ?? 1),
      unit_price: Number(item.unit_price ?? 0).toFixed(2),
      discount: "0.00",
      created_date: item.created_at ?? new Date().toISOString(),
      updated_date: item.updated_at ?? new Date().toISOString(),
    }))

    const cartCreatedDate = inputData.cart_created_at ?? new Date().toISOString()
    const cartUpdatedDate = inputData.cart_updated_at ?? cartCreatedDate

    const body: MintpayOrderCreateBody = {
      merchant_id: this.options_.merchantId,
      order_id: orderId,
      total_price: totalPrice,
      discount: "0.00",
      customer_email: email,
      customer_id: customerId,
      customer_telephone: phone,
      // Best-effort — Medusa's payment-provider context doesn't carry the
      // originating HTTP request, so we only have whatever the storefront
      // chose to forward via the payment session's `data`.
      ip: inputData.ip ?? "",
      x_forwarded_for: inputData.x_forwarded_for ?? "",
      delivery_street: shippingAddress.address_1 ?? "",
      delivery_region: shippingAddress.city ?? shippingAddress.province ?? "",
      delivery_postcode: shippingAddress.postal_code ?? "",
      cart_created_date: cartCreatedDate,
      cart_updated_date: cartUpdatedDate,
      products,
      success_url: this.options_.successUrl,
      fail_url: this.options_.failUrl,
    }

    const response = await mintpayCreateOrder(
      this.baseUrl,
      this.options_.merchantSecret,
      body
    )

    if (response.message !== "Success" || !response.data) {
      this.logger_.error(
        `Mintpay: order create failed for order ${orderId} — ${response.data}`
      )
      Sentry.captureMessage("Mintpay order create failed", {
        level: "error",
        tags: { payment_provider: "mintpay", operation: "initiatePayment" },
        extra: { orderId, reason: response.data },
      })
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Mintpay: failed to create order — ${response.data ?? "unknown error"}`
      )
    }

    const purchaseId = response.data

    this.logger_.info(
      `Mintpay: created purchase ${purchaseId} for order ${orderId}`
    )

    return {
      id: purchaseId,
      data: {
        mintpay_purchase_id: purchaseId,
        mintpay_order_id: orderId,
        mintpay_form_action: `${this.baseUrl}/user-order/login/`,
        mintpay_form_fields: { purchase_id: purchaseId },
        mintpay_status: "pending",
      },
    }
  }

  /**
   * authorizePayment — called when the customer returns from Mintpay via
   * success_url/fail_url. Mintpay has no signed webhook, so — unlike Koko —
   * we always live-poll the status endpoint rather than trusting a cache or
   * the redirect params alone.
   */
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const purchaseId = input.data?.mintpay_purchase_id as string | undefined

    if (!purchaseId) {
      return { data: input.data ?? {}, status: "pending" }
    }

    try {
      const statusResponse = await mintpayGetStatus(
        this.baseUrl,
        this.options_.merchantSecret,
        this.options_.merchantId,
        purchaseId
      )
      const status = statusResponse.data?.status

      const statusMap: Record<string, "authorized" | "pending" | "error"> = {
        Approved: "authorized",
        Rejected: "error",
      }

      return {
        data: { ...input.data, mintpay_status: status ?? "pending" },
        status: status ? statusMap[status] ?? "pending" : "pending",
      }
    } catch (e: any) {
      this.logger_.error(`Mintpay authorizePayment error: ${e.message}`)
      Sentry.captureException(e, {
        tags: { payment_provider: "mintpay", operation: "authorizePayment" },
        extra: { purchaseId },
      })
      return { data: input.data ?? {}, status: "error" }
    }
  }

  /**
   * capturePayment — Mintpay auto-captures on approval; no-op here.
   */
  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    return {
      data: { ...input.data, captured_at: new Date().toISOString() },
    }
  }

  /**
   * refundPayment — Mintpay's docs do not expose a refund endpoint.
   * Flag for manual processing via Mintpay merchant support.
   */
  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    this.logger_.warn(
      `Mintpay: refund requested for purchase ${input.data?.mintpay_purchase_id} — ` +
      `amount ${input.amount}. No refund API in current docs — contact Mintpay support.`
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
   * cancelPayment — no cancel API exposed; mark locally. The customer's own
   * fail_url flow handles cancellation on Mintpay's side.
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
   * getPaymentStatus — poll Mintpay's status endpoint.
   */
  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const purchaseId = input.data?.mintpay_purchase_id as string | undefined
    if (!purchaseId) return { status: "pending" }

    try {
      const statusResponse = await mintpayGetStatus(
        this.baseUrl,
        this.options_.merchantSecret,
        this.options_.merchantId,
        purchaseId
      )
      const status = statusResponse.data?.status
      const statusMap: Record<string, GetPaymentStatusOutput["status"]> = {
        Approved: "captured",
        Rejected: "error",
      }
      return { status: status ? statusMap[status] ?? "pending" : "pending" }
    } catch (e: any) {
      this.logger_.error(`Mintpay getPaymentStatus error: ${e.message}`)
      Sentry.captureException(e, {
        tags: { payment_provider: "mintpay", operation: "getPaymentStatus" },
        extra: { purchaseId },
      })
      return { status: "error" }
    }
  }

  /**
   * updatePayment — cart amount changed; Mintpay's order_id is meant to
   * identify a single purchase attempt, so re-initiate with a fresh order,
   * same as Koko.
   */
  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    return this.initiatePayment(input)
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const purchaseId = input.data?.mintpay_purchase_id as string | undefined
    if (!purchaseId) return { data: input.data ?? {} }

    try {
      const statusResponse = await mintpayGetStatus(
        this.baseUrl,
        this.options_.merchantSecret,
        this.options_.merchantId,
        purchaseId
      )
      return { data: { ...input.data, mintpay_status_details: statusResponse.data } }
    } catch (_) {
      return { data: input.data ?? {} }
    }
  }

  /**
   * getWebhookActionAndData — Mintpay has no push webhook of its own (no
   * responseUrl-style field in their API). This method exists because Medusa
   * requires it, and it's driven by the mintpay-reconcile scheduled job
   * (src/jobs/mintpay-reconcile.ts), which polls the status endpoint for
   * pending purchases and emits a PaymentWebhookEvents.WebhookReceived event
   * shaped to match — so the reconciliation path and a hypothetical future
   * real webhook both flow through this single place.
   */
  async getWebhookActionAndData(data: {
    data: Record<string, unknown>
    rawData: string | Buffer
    headers: Record<string, unknown>
  }): Promise<WebhookActionResult> {
    const payload = data.data as { session_id?: string; status?: string }

    if (!payload.session_id) {
      return { action: "not_supported" }
    }

    this.logger_.info(
      `Mintpay reconcile: ${payload.status} for session ${payload.session_id}`
    )

    if (payload.status === "Approved") {
      return {
        action: "captured",
        data: { session_id: payload.session_id, amount: 0 },
      }
    }

    return {
      action: "failed",
      data: { session_id: payload.session_id, amount: 0 },
    }
  }
}

export default MintpayPaymentService
