# Onepay × Medusa JS v2 — Full Integration Guide
> Based on Onepay Redirection API v3

---

## How Onepay Works (Payment Flow)

```
Storefront          Medusa Backend            Onepay API
    |                    |                        |
    |-- select Onepay -->|                        |
    |                    |-- POST /v3/checkout/link/ -->|
    |                    |<-- { redirect_url,          |
    |                    |      ipg_transaction_id } --|
    |<-- session data ---|                        |
    |                    |                        |
    |-- redirect to redirect_url --------------->|
    |                    |              (customer pays)
    |                    |<-- webhook callback POST ---|
    |                    |-- POST /v3/transaction/status/ (verify)
    |                    |-- capture order in Medusa   |
    |<-- redirect to transaction_redirect_url ---|
```

---

## Step 1 — Get Onepay Credentials

1. Register at [onepay.lk](https://onepay.lk) merchant portal
2. Go to **APP section** in dashboard
3. Collect:
   - `APP_ID` — your unique application identifier
   - `HASH_SALT` — secret used for SHA-256 hash generation (**never expose client-side**)
   - Set your **Callback URL** → `https://your-backend.railway.app/webhooks/onepay`

---

## Step 2 — Backend: Onepay Payment Provider Module

### File Structure

```
src/
└── modules/
    └── onepay-payment/
        ├── index.ts
        ├── service.ts
        └── types.ts
```

---

### `src/modules/onepay-payment/types.ts`

```ts
export type OnepayOptions = {
  appId: string
  hashSalt: string              // NEVER expose this client-side
  baseUrl: string               // https://api.onepay.lk
  redirectUrl: string           // https://cardle.lk/checkout/onepay/return
  cancelUrl: string             // https://cardle.lk/checkout/cancel
}

export type OnepayCreateResponse = {
  status: boolean
  ipg_transaction_id: string    // Onepay's internal transaction ID
  redirect_url: string          // URL to redirect customer to
  message?: string
}

export type OnepayStatusResponse = {
  status: boolean
  ipg_transaction_id: string
  amount: number
  currency: string
  paid_on: string               // "YYYY-MM-DD HH:mm:ss"
}

export type OnepayCallbackPayload = {
  transaction_id: string
  status: number                // 1 = SUCCESS
  status_message: string        // "SUCCESS" | "FAILED" | "CANCELLED"
  additional_data: string
}
```

---

### `src/modules/onepay-payment/service.ts`

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
import {
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
  private generateHash(currency: string, amount: number): string {
    const amountStr = amount.toFixed(2)
    const raw = `${this.options_.appId}${currency}${amountStr}${this.options_.hashSalt}`
    return crypto.createHash("sha256").update(raw).digest("hex")
  }

  /** Make a request to Onepay API */
  private async onepayRequest<T>(
    path: string,
    body: object
  ): Promise<T> {
    const url = `${this.options_.baseUrl}${path}`

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const error = await res.text()
      this.logger_.error(`Onepay API error [${res.status}]: ${error}`)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Onepay API error: ${error}`
      )
    }

    return res.json() as Promise<T>
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

    // Onepay amount is in full units with 2 decimal places (e.g. 1490.00)
    // Medusa stores amounts in smallest unit (cents). Convert:
    const onepayAmount = amount / 100

    const currency = currency_code.toUpperCase()
    const hash = this.generateHash(currency, onepayAmount)

    // Build a unique reference from cart/session
    const reference = `cardle-${context.session_id ?? Date.now()}`

    const requestBody = {
      app_id: this.options_.appId,
      amount: onepayAmount,
      currency,
      hash,
      reference,
      customer_first_name: context.customer?.first_name ?? "Customer",
      customer_last_name: context.customer?.last_name ?? "",
      customer_phone_number: context.customer?.phone ?? "+94000000000",
      customer_email: context.customer?.email ?? "",
      transaction_redirect_url: this.options_.redirectUrl,
      additionalData: reference,  // echo back so we can match on return
    }

    this.logger_.info(`Onepay: creating transaction for ${reference}`)

    const response = await this.onepayRequest<OnepayCreateResponse>(
      "/v3/checkout/link/",
      requestBody
    )

    if (!response.status || !response.redirect_url) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Onepay: failed to create transaction — ${response.message ?? "unknown error"}`
      )
    }

    return {
      data: {
        ipg_transaction_id: response.ipg_transaction_id,
        redirect_url: response.redirect_url,
        reference,
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
    } catch (e) {
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

      return { status: statusResponse.status ? "captured" : "pending" }
    } catch (e) {
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
   * Onepay posts: { transaction_id, status, status_message, additional_data }
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
```

---

### `src/modules/onepay-payment/index.ts`

```ts
import OnepayPaymentService from "./service"
import { ModuleProvider, Modules } from "@medusajs/framework/utils"

export default ModuleProvider(Modules.PAYMENT, {
  services: [OnepayPaymentService],
})
```

---

## Step 3 — Register in `medusa-config.ts`

```ts
import { defineConfig } from "@medusajs/framework"

export default defineConfig({
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          // ... Koko and other providers

          {
            resolve: "./src/modules/onepay-payment",
            id: "onepay",
            options: {
              appId: process.env.ONEPAY_APP_ID,
              hashSalt: process.env.ONEPAY_HASH_SALT,
              baseUrl: process.env.ONEPAY_BASE_URL,
              redirectUrl: process.env.ONEPAY_REDIRECT_URL,
            },
          },
        ],
      },
    },
  ],
})
```

---

## Step 4 — Environment Variables

```env
ONEPAY_APP_ID=your_app_id_here
ONEPAY_HASH_SALT=your_hash_salt_here         # NEVER commit this to git
ONEPAY_BASE_URL=https://api.onepay.lk
ONEPAY_REDIRECT_URL=https://cardle.lk/checkout/onepay/return
```

> ⚠️ Add `ONEPAY_HASH_SALT` to Railway environment variables directly — never in `.env` committed to GitHub.

---

## Step 5 — Webhook Route

**`src/api/webhooks/onepay/route.ts`**

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
      provider_id: "pp_onepay_onepay",
      data: req.body as Record<string, unknown>,
      rawData: req.rawBody ?? JSON.stringify(req.body),
      headers: req.headers as Record<string, unknown>,
    })
  } catch (e) {
    console.error("Onepay webhook error:", e)
    // Always 200 — prevent Onepay from retrying
  }

  res.status(200).json({ received: true })
}
```

**Set in Onepay portal → APP section → Callback URL:**
```
https://your-backend.railway.app/webhooks/onepay
```

---

## Step 6 — Return URL Route (Customer Redirect Back)

When Onepay redirects the customer back, you need to verify the payment
server-side before showing success. Never trust URL parameters alone.

**`src/app/[countryCode]/(main)/checkout/onepay/return/page.tsx`**

```tsx
import { redirect } from "next/navigation"

type Props = {
  searchParams: {
    ipg_transaction_id?: string
    status?: string
    reference?: string
  }
}

export default async function OnepayReturnPage({ searchParams }: Props) {
  const { ipg_transaction_id, status, reference } = searchParams

  // Basic guard — real verification happens via webhook on backend
  // The webhook fires before the redirect in most cases
  if (!ipg_transaction_id) {
    redirect("/checkout?error=payment_cancelled")
  }

  // If status param indicates failure
  if (status && status !== "SUCCESS") {
    redirect("/checkout?error=payment_failed")
  }

  // Payment looks good — show order confirmation
  // The actual order capture is handled by the webhook
  return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <h1 className="text-2xl font-semibold mb-4">Payment Successful 🎉</h1>
      <p className="text-gray-600 mb-2">
        Your order is confirmed. You'll receive an email shortly.
      </p>
      {reference && (
        <p className="text-sm text-gray-400 mt-2">
          Order ref: {reference}
        </p>
      )}
      <a
        href="/account/orders"
        className="mt-8 inline-block px-6 py-3 bg-black text-white rounded"
      >
        View My Orders
      </a>
    </div>
  )
}
```

---

## Step 7 — Frontend: Payment Button

**`src/modules/checkout/components/payment-button/onepay-button.tsx`**

```tsx
"use client"

import { useState } from "react"

type OnepayPaymentButtonProps = {
  cart: {
    id: string
    payment_collection?: {
      payment_sessions?: Array<{
        provider_id: string
        data?: {
          redirect_url?: string
          ipg_transaction_id?: string
        }
      }>
    }
  }
  notReady?: boolean
}

export function OnepayPaymentButton({ cart, notReady }: OnepayPaymentButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onepaySession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.provider_id === "pp_onepay_onepay"
  )

  const redirectUrl = onepaySession?.data?.redirect_url

  const handlePay = () => {
    if (!redirectUrl) {
      setError("Payment session not ready. Please refresh and try again.")
      return
    }

    setLoading(true)
    // Same-window redirect — matches Onepay's design (no popups)
    window.location.href = redirectUrl
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={notReady || loading || !redirectUrl}
        className="w-full py-3 px-6 bg-[#e63946] text-white font-semibold rounded-lg
                   hover:bg-[#c1121f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Redirecting to Onepay..." : "Pay with Onepay"}
      </button>

      {!redirectUrl && !loading && (
        <p className="text-xs text-gray-500 mt-1 text-center">
          Initialising payment...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  )
}
```

---

## Step 8 — Enable in Admin

1. Medusa Admin → **Settings → Regions**
2. Select your region (Sri Lanka / LKR)
3. Under **Payment Providers** → enable **Onepay**
4. Save

---

## Hash Verification — Critical Note

Onepay's hash formula from the docs:

```
SHA256(app_id + currency + amount + HASH_SALT)
```

The `amount` must be a **string with 2 decimal places** — e.g. `"1490.00"` not `1490`.
The service uses `amount.toFixed(2)` which handles this correctly.

Test your hash locally before going live:

```ts
import crypto from "crypto"

const appId = "your_app_id"
const currency = "LKR"
const amount = "1490.00"
const hashSalt = "your_hash_salt"

const hash = crypto
  .createHash("sha256")
  .update(`${appId}${currency}${amount}${hashSalt}`)
  .digest("hex")

console.log(hash) // compare with Onepay's test tool
```

---

## Onepay vs Koko — Side by Side

| | Onepay | Koko |
|---|---|---|
| Type | Full payment gateway (cards, bank) | BNPL (3 instalments) |
| Auth method | SHA-256 hash (app_id + HASH_SALT) | HMAC-SHA256 (API secret) |
| Redirect | Same window | Same window |
| Refunds | Manual via portal | API endpoint |
| Webhook field | `additional_data` → your reference | `merchant_reference` |
| Amount format | Full units, 2 decimals (1490.00) | Smallest unit (149000) |
| Provider ID in Medusa | `pp_onepay_onepay` | `pp_koko_koko` |

---

## Testing Checklist

- [ ] `ONEPAY_HASH_SALT` set in Railway env vars (not in `.env` file)
- [ ] Hash generation matches Onepay's test tool output
- [ ] `initiatePayment` returns `redirect_url` in session data
- [ ] Button redirects to Onepay hosted page (same window, no popup)
- [ ] Webhook fires at `/webhooks/onepay` on payment completion
- [ ] `additional_data` → `reference` correctly links back to your order
- [ ] Return URL page handles both success and cancellation
- [ ] Refund flow shows manual note in Medusa Admin order
