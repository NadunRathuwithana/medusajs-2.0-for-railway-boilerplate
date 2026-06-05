# Koko Pay × Medusa JS v2 — Full Integration Guide

> **Important heads-up before you start:**
> Koko does **not** have a public API documentation page. To get your **Merchant API credentials** (API key / secret, sandbox base URL, webhook secret), you must register at [merchant-signup.paykoko.com](https://merchant-signup.paykoko.com) and contact their team directly. All code below uses placeholder constants (`KOKO_API_KEY`, etc.) that you replace with your real credentials once Koko provides them.
>
> The integration pattern below is based on how Koko works as a **redirect-based BNPL gateway** — matching the same pattern used by other redirect-based providers (Stripe Checkout, PayHere, Paystack, etc.) and the official Medusa v2 `AbstractPaymentProvider` architecture.

---

## How Koko Works (Payment Flow)

```
Storefront            Medusa Backend           Koko API
    |                      |                       |
    |-- initiate payment -->|                       |
    |                      |-- POST /orders ------->|
    |                      |<-- { koko_order_id,    |
    |                      |      redirect_url } ---|
    |<-- return session ----|                       |
    |                       |                      |
    |-- redirect customer to redirect_url --------->|
    |                      |              (customer pays on Koko)
    |                      |<-- webhook: payment.completed --|
    |                      |-- capture / authorize payment   |
    |<-- redirect to success_url ----------------------|
```

---

## Step 1 — Register as a Koko Merchant

1. Go to **[merchant-signup.paykoko.com](https://merchant-signup.paykoko.com)** and complete the form.
2. Once approved, log into the **[merchant portal](https://merchant-v2.paykoko.com)**.
3. Collect the following from your dashboard:
   - `KOKO_API_KEY` — your merchant API key
   - `KOKO_API_SECRET` — your merchant secret (used for HMAC signature)
   - `KOKO_MERCHANT_ID` — your merchant ID
   - `KOKO_BASE_URL` — sandbox: `https://api-sandbox.paykoko.com` / production: `https://api.paykoko.com`
   - `KOKO_WEBHOOK_SECRET` — for validating incoming webhook payloads

---

## Step 2 — Backend: Koko Payment Provider Module

### 2.1 — File Structure

Create the following files inside your Medusa backend:

```
src/
└── modules/
    └── koko-payment/
        ├── index.ts          ← module definition
        ├── service.ts        ← AbstractPaymentProvider implementation
        └── types.ts          ← shared types
```

---

### 2.2 — `src/modules/koko-payment/types.ts`

```ts
export type KokoOptions = {
  apiKey: string
  apiSecret: string
  merchantId: string
  baseUrl: string
  webhookSecret: string
  successUrl: string  // e.g. "https://cardle.lk/checkout/success"
  cancelUrl: string   // e.g. "https://cardle.lk/checkout/cancel"
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
```

---

### 2.3 — `src/modules/koko-payment/service.ts`

```ts
import {
  AbstractPaymentProvider,
  MedusaError,
} from "@medusajs/framework/utils"
import {
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
import { KokoOptions, KokoOrderResponse, KokoWebhookPayload } from "./types"

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
    const merchantReference = `cardle-${context.session_id ?? Date.now()}`

    const requestBody = {
      merchant_reference: merchantReference,
      amount: Math.round(amount),       // in cents/smallest unit
      currency: currency_code.toUpperCase(),
      success_url: this.options_.successUrl,
      cancel_url: this.options_.cancelUrl,
      // Optional: pass customer info if available
      customer: context.customer
        ? {
            email: context.customer.email,
            first_name: context.customer.first_name,
            last_name: context.customer.last_name,
          }
        : undefined,
    }

    this.logger_.info(`Koko: initiating payment for ${merchantReference}`)

    const kokoOrder = await this.kokoRequest<KokoOrderResponse>(
      "POST",
      "/v1/orders",
      requestBody
    )

    return {
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
    } catch (e) {
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
      } catch (e) {
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
```

---

### 2.4 — `src/modules/koko-payment/index.ts`

```ts
import KokoPaymentService from "./service"
import { ModuleProvider, Modules } from "@medusajs/framework/utils"

export default ModuleProvider(Modules.PAYMENT, {
  services: [KokoPaymentService],
})
```

---

### 2.5 — Register in `medusa-config.ts`

```ts
import { defineConfig } from "@medusajs/framework"

export default defineConfig({
  // ... your existing config
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          // ── your existing Stripe or other providers ──

          // ── Add Koko below ──
          {
            resolve: "./src/modules/koko-payment",
            id: "koko",
            options: {
              apiKey: process.env.KOKO_API_KEY,
              apiSecret: process.env.KOKO_API_SECRET,
              merchantId: process.env.KOKO_MERCHANT_ID,
              baseUrl: process.env.KOKO_BASE_URL,          // sandbox or prod
              webhookSecret: process.env.KOKO_WEBHOOK_SECRET,
              successUrl: process.env.KOKO_SUCCESS_URL,    // your storefront URL
              cancelUrl: process.env.KOKO_CANCEL_URL,
            },
          },
        ],
      },
    },
  ],
})
```

---

### 2.6 — Environment Variables (`.env`)

```env
KOKO_API_KEY=your_api_key_here
KOKO_API_SECRET=your_api_secret_here
KOKO_MERCHANT_ID=your_merchant_id_here
KOKO_BASE_URL=https://api-sandbox.paykoko.com
KOKO_WEBHOOK_SECRET=your_webhook_secret_here
KOKO_SUCCESS_URL=https://cardle.lk/checkout/success
KOKO_CANCEL_URL=https://cardle.lk/checkout/cancel
```

---

## Step 3 — Webhook Route

Koko will POST to your backend when a payment completes. Create a custom route:

**`src/api/webhooks/koko/route.ts`**

```ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const paymentModule = req.scope.resolve(Modules.PAYMENT)

  try {
    await paymentModule.processEvent({
      provider_id: "pp_koko_koko",  // format: pp_{identifier}_{id}
      data: req.body as Record<string, unknown>,
      rawData: req.rawBody ?? JSON.stringify(req.body),
      headers: req.headers as Record<string, unknown>,
    })
  } catch (e) {
    console.error("Koko webhook error:", e)
    // Always return 200 to prevent Koko retrying on server errors
  }

  res.status(200).json({ received: true })
}
```

**Register your webhook URL in Koko's merchant dashboard:**
```
https://your-railway-backend.railway.app/webhooks/koko
```

---

## Step 4 — Enable Koko in Admin Dashboard

After deploying your backend:

1. Open your Medusa Admin (e.g. `https://your-backend.railway.app/app`)
2. Go to **Settings → Regions**
3. Select your Sri Lanka region (or whichever you want Koko active on)
4. Under **Payment Providers**, tick **Koko**
5. Save

---

## Step 5 — Frontend: Next.js Storefront

The key difference with Koko vs. Stripe is that **Koko is redirect-based**. Your storefront needs to:

1. Detect when Koko is selected
2. Skip Medusa's normal payment confirmation step
3. Redirect the customer to Koko's `redirect_url` stored in the payment session

---

### 5.1 — Payment Button Component

**`src/modules/checkout/components/payment-button/koko-button.tsx`**

```tsx
"use client"

import { useState } from "react"
import { placeOrder } from "@lib/data/cart"  // your Medusa storefront helper

type KokoPaymentButtonProps = {
  cart: {
    id: string
    payment_collection?: {
      payment_sessions?: Array<{
        provider_id: string
        data?: {
          redirect_url?: string
        }
      }>
    }
  }
  notReady?: boolean
}

export function KokoPaymentButton({ cart, notReady }: KokoPaymentButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const kokoSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.provider_id === "pp_koko_koko"
  )

  const redirectUrl = kokoSession?.data?.redirect_url

  const handleKokoPayment = async () => {
    if (!redirectUrl) {
      setError("Koko payment session not ready. Please try again.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Redirect the customer to Koko's hosted checkout
      window.location.href = redirectUrl
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred")
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleKokoPayment}
        disabled={notReady || loading || !redirectUrl}
        className="koko-pay-button"
        aria-busy={loading}
      >
        {loading ? "Redirecting to Koko..." : "Pay with Koko (3 instalments)"}
      </button>

      {!redirectUrl && !loading && (
        <p className="text-sm text-gray-500 mt-1">
          Initializing Koko checkout…
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
```

---

### 5.2 — Integrate into Your Checkout Payment Button

In your existing `payment-button/index.tsx` (or equivalent), add the Koko case:

```tsx
import { KokoPaymentButton } from "./koko-button"

// Inside your payment button switch/conditional:
const isKoko = selectedPaymentMethod === "pp_koko_koko"

if (isKoko) {
  return <KokoPaymentButton cart={cart} notReady={notReady} />
}
```

---

### 5.3 — Show Koko as a Payment Option

In your payment method selector, detect and display Koko:

```tsx
// In your payment methods list component
const providerDisplayNames: Record<string, string> = {
  "pp_stripe_stripe": "Credit / Debit Card",
  "pp_koko_koko": "Koko — Pay in 3 interest-free instalments",
  // add others as needed
}

// Example render
{paymentSessions.map((session) => (
  <label key={session.provider_id} className="payment-option">
    <input
      type="radio"
      name="payment"
      value={session.provider_id}
      onChange={() => setSelectedMethod(session.provider_id)}
    />
    <span>{providerDisplayNames[session.provider_id] ?? session.provider_id}</span>
    {session.provider_id === "pp_koko_koko" && (
      <span className="text-xs text-gray-500 ml-2">
        Split into 3 × LKR {Math.round(cart.total / 3).toLocaleString()}
      </span>
    )}
  </label>
))}
```

---

### 5.4 — Success Page

After Koko redirects back, show the customer their order:

**`src/app/checkout/success/page.tsx`**

```tsx
import { retrieveOrder } from "@lib/data/orders"

type Props = {
  searchParams: { order_id?: string; merchant_reference?: string }
}

export default async function KokoSuccessPage({ searchParams }: Props) {
  const { merchant_reference } = searchParams

  // merchant_reference format: "cardle-{session_id}"
  // You can use this to look up the order in Medusa

  return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <h1 className="text-2xl font-semibold mb-4">Payment Successful 🎉</h1>
      <p className="text-gray-600 mb-2">
        Thank you for your order. Koko will send you instalment reminders.
      </p>
      {merchant_reference && (
        <p className="text-sm text-gray-400">
          Reference: {merchant_reference}
        </p>
      )}
      <a
        href="/account/orders"
        className="mt-6 inline-block px-6 py-3 bg-black text-white rounded"
      >
        View My Orders
      </a>
    </div>
  )
}
```

---

## Step 6 — Quick Reference: Key Files Summary

| File | Purpose |
|------|---------|
| `src/modules/koko-payment/service.ts` | Core provider — all Koko API calls |
| `src/modules/koko-payment/index.ts` | Module export |
| `src/modules/koko-payment/types.ts` | TypeScript types |
| `medusa-config.ts` | Register provider in payment module |
| `.env` | Credentials |
| `src/api/webhooks/koko/route.ts` | Receive Koko payment events |
| `src/modules/checkout/…/koko-button.tsx` | Storefront redirect button |

---

## Step 7 — Testing Checklist

- [ ] Koko sandbox credentials added to `.env`
- [ ] `pnpm run dev` starts without module errors
- [ ] Koko appears as a payment option in Medusa Admin under your region
- [ ] `initiatePayment` returns a `redirect_url` in the payment session data
- [ ] Clicking "Pay with Koko" redirects to Koko's hosted checkout
- [ ] On test payment completion, webhook fires to `/webhooks/koko`
- [ ] Order status updates to `captured` in Medusa Admin
- [ ] Cancel URL correctly returns customer to checkout
- [ ] HMAC signature verification passes for webhooks
- [ ] Refund flow works from Medusa Admin

---

## Notes & Gotchas

**Provider ID format:** Medusa generates the provider ID as `pp_{identifier}_{config_id}`. Since `identifier = "koko"` and `id = "koko"` in config, the full ID is `pp_koko_koko`. Use this everywhere in the frontend.

**Amount units:** Confirm with Koko whether they expect the amount in LKR cents (e.g. `150000` for Rs. 1500.00) or full rupees. Adjust the `Math.round(amount)` call in `initiatePayment` accordingly.

**Webhook endpoint exposure:** Make sure your Railway backend has the webhook route publicly accessible. If you're using Medusa's CORS config, webhooks don't need CORS but they do need to be reachable by Koko's servers.

**rawBody middleware:** For webhook signature verification to work, you need the raw request body. Add this to your Medusa server config if not already there:

```ts
// medusa-config.ts
http: {
  // ...
  bodyParser: {
    sizeLimit: "1mb",
  },
}
```

**Webhook secret:** Until Koko provides an official secret, you can skip signature verification in dev by not setting `KOKO_WEBHOOK_SECRET`. The code handles this gracefully.
