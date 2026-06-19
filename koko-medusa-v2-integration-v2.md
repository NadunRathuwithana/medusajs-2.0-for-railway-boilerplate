# Koko Pay × Medusa JS v2 — Official Integration Guide (v1.05)
> Built from Koko's official Developer Preview API docs + Merchant Order View API docs.
> This replaces the earlier guess-based guide — the real API is form-POST + RSA signing, not REST/HMAC.

---

## ⚠️ Security Note on Your Credentials

The Merchant ID, API Key, and RSA keypair Koko emailed you are **QA/test credentials**, but treat them as real secrets:

- Store the **private key** as a Railway environment variable — never commit it to git, never paste it in shared docs/tools again.
- The private key signs every request as your merchant account — anyone with it can forge orders.
- When Koko gives you production keys later, repeat the same discipline with even more care.

---

## How Koko Actually Works

This is **not** a typical REST API. The customer's browser submits a signed HTML form **directly to Koko** — your backend never calls Koko's API mid-checkout. Your job is to:

1. Build the signed form fields server-side (so the private key stays on your server)
2. Render/auto-submit that form from the storefront
3. Handle three return paths: `_returnUrl`, `_cancelUrl`, `_responseUrl` (server webhook)
4. Optionally poll `orderView` to double-check status

```
Storefront                Medusa Backend              Koko
    |                          |                         |
    |-- initiate payment ----->|                         |
    |                          |-- build signed form ----|
    |<-- form fields + sig ----|                         |
    |                          |                         |
    |-- auto-submit form directly to Koko -------------->|
    |                                          (customer pays on Koko)
    |                          |<-- _responseUrl webhook (encrypted, server-to-server)
    |<-- browser redirected to _returnUrl ----------------|
    |                          |
    |                          |-- (optional) orderView poll to confirm
```

---

## Step 1 — Environment Variables

```env
KOKO_BASE_URL=https://qaapi.paykoko.com    # QA — switch to prodapi.paykoko.com for production
KOKO_MERCHANT_ID=c8cca514bdfa0582cdc40c9703c71e9d
KOKO_API_KEY=83fA5n1xUaj8OKnX23YY5vlni5q39gBi
KOKO_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIICXAIBAAKBgQCfxX3U...\n-----END RSA PRIVATE KEY-----"
KOKO_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCB...\n-----END PUBLIC KEY-----"
KOKO_PLUGIN_NAME=cardle-medusa
KOKO_PLUGIN_VERSION=1.0.0
KOKO_RETURN_URL=https://cardle.lk/checkout/koko/return
KOKO_CANCEL_URL=https://cardle.lk/checkout/koko/cancel
KOKO_RESPONSE_URL=https://your-backend.railway.app/webhooks/koko
```

> **Railway env var tip:** multi-line PEM keys need `\n` literal escapes when stored as a single-line env var. The code below converts `\n` back to real newlines before using `openssl`.

---

## Step 2 — Backend: Koko Payment Provider Module

### File Structure

```
src/
└── modules/
    └── koko-payment/
        ├── index.ts
        ├── service.ts
        ├── signature.ts     ← RSA signing/verification helpers
        └── types.ts
```

---

### `src/modules/koko-payment/types.ts`

```ts
export type KokoOptions = {
  baseUrl: string              // qaapi.paykoko.com or prodapi.paykoko.com
  merchantId: string           // _mId
  apiKey: string
  privateKey: string           // PEM, used to SIGN our requests
  kokoPublicKey: string        // PEM, used to VERIFY Koko's _responseUrl webhook
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
  _amount: string             // "300.00" format — string, 2 decimals
  _currency: string           // ISO 4217, e.g. "LKR"
  _reference: string
  _orderId: string            // MUST be unique per request
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
  signature: string           // RSA-encrypted by Koko's private key — verify with Koko's PUBLIC key
}

/** orderView API response */
export type KokoOrderViewResponse = {
  orderId: string
  trnId: string
  status: "PENDING" | "SUCCESS" | "FAILED"
  desc: string
  signature: string
}
```

---

### `src/modules/koko-payment/signature.ts`

```ts
import crypto from "crypto"

/**
 * Normalizes a PEM key stored as a single-line env var (with literal \n)
 * back into a real multi-line PEM string.
 */
export function normalizePem(key: string): string {
  return key.includes("\\n") ? key.replace(/\\n/g, "\n") : key
}

/**
 * Builds the dataString for Order Create, in Koko's EXACT required order:
 * mId + amount + currency + pluginName + pluginVersion + returnUrl + cancelUrl
 * + orderId + reference + firstName + lastName + email + description
 * + apiKey + responseUrl
 *
 * NOTE: this order is positional, not alphabetical — verified against
 * Koko's official Java reference implementation in the docs.
 */
export function buildOrderCreateDataString(fields: {
  mId: string
  amount: string
  currency: string
  pluginName: string
  pluginVersion: string
  returnUrl: string
  cancelUrl: string
  orderId: string
  reference: string
  firstName: string
  lastName: string
  email: string
  description: string
  apiKey: string
  responseUrl: string
}): string {
  return (
    fields.mId +
    fields.amount +
    fields.currency +
    fields.pluginName +
    fields.pluginVersion +
    fields.returnUrl +
    fields.cancelUrl +
    fields.orderId +
    fields.reference +
    fields.firstName +
    fields.lastName +
    fields.email +
    fields.description +
    fields.apiKey +
    fields.responseUrl
  )
}

/**
 * Builds the dataString for Order View, per the Merchant Order View docs:
 * MerchantID + PluginName + PluginVersion + OrderID + APIKey
 */
export function buildOrderViewDataString(fields: {
  mId: string
  pluginName: string
  pluginVersion: string
  orderId: string
  apiKey: string
}): string {
  return (
    fields.mId +
    fields.pluginName +
    fields.pluginVersion +
    fields.orderId +
    fields.apiKey
  )
}

/** Sign a dataString with our RSA private key (SHA-256), base64-encoded. */
export function signDataString(dataString: string, privateKeyPem: string): string {
  const pem = normalizePem(privateKeyPem)
  const signer = crypto.createSign("RSA-SHA256")
  signer.update(dataString)
  signer.end()
  return signer.sign(pem, "base64")
}

/**
 * Verify a signature against a dataString using Koko's PUBLIC key.
 * Used to validate the _responseUrl webhook actually came from Koko.
 */
export function verifySignature(
  dataString: string,
  signatureBase64: string,
  publicKeyPem: string
): boolean {
  try {
    const pem = normalizePem(publicKeyPem)
    const verifier = crypto.createVerify("RSA-SHA256")
    verifier.update(dataString)
    verifier.end()
    return verifier.verify(pem, signatureBase64, "base64")
  } catch (e) {
    return false
  }
}
```

---

### `src/modules/koko-payment/service.ts`

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
import {
  buildOrderCreateDataString,
  buildOrderViewDataString,
  signDataString,
  verifySignature,
} from "./signature"
import {
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
  // REQUIRED ABSTRACT METHODS
  // ─────────────────────────────────────────────

  /**
   * initiatePayment — builds the signed form fields for Koko's orderCreate.
   * IMPORTANT: Koko's flow is a browser FORM POST, not a server-to-server call.
   * We build and sign the fields here (private key never leaves the server),
   * then return them so the storefront can render + auto-submit the form.
   */
  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code, context } = input

    // Medusa stores amounts in smallest unit (cents) — Koko wants "300.00" format
    const kokoAmount = (amount / 100).toFixed(2)
    const currency = currency_code.toUpperCase()

    // _orderId MUST be unique per request per Koko's docs — use cart/session + timestamp
    const orderId = `${context.session_id ?? "sess"}-${Date.now()}`
    const reference = orderId

    const firstName = context.customer?.first_name ?? "Customer"
    const lastName = context.customer?.last_name ?? ""
    const email = context.customer?.email ?? ""
    const mobile = context.customer?.phone ?? ""
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
      _mobileNo: mobile,
      dataString,
      signature,
    }

    this.logger_.info(`Koko: built signed order form for orderId=${orderId}`)

    return {
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
    } catch (e) {
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
    } catch (e) {
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

    if (payload.status === "SUCCESS") {
      return {
        action: "captured",
        data: {
          session_id: payload.orderId,
        },
      }
    }

    return {
      action: "failed",
      data: { session_id: payload.orderId },
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
```

---

### `src/modules/koko-payment/index.ts`

```ts
import KokoPaymentService from "./service"
import { ModuleProvider, Modules } from "@medusajs/framework/utils"

export default ModuleProvider(Modules.PAYMENT, {
  services: [KokoPaymentService],
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
          {
            resolve: "./src/modules/koko-payment",
            id: "koko",
            options: {
              baseUrl: process.env.KOKO_BASE_URL,
              merchantId: process.env.KOKO_MERCHANT_ID,
              apiKey: process.env.KOKO_API_KEY,
              privateKey: process.env.KOKO_PRIVATE_KEY,
              kokoPublicKey: process.env.KOKO_PUBLIC_KEY,
              pluginName: process.env.KOKO_PLUGIN_NAME,
              pluginVersion: process.env.KOKO_PLUGIN_VERSION,
              returnUrl: process.env.KOKO_RETURN_URL,
              cancelUrl: process.env.KOKO_CANCEL_URL,
              responseUrl: process.env.KOKO_RESPONSE_URL,
            },
          },
        ],
      },
    },
  ],
})
```

---

## Step 4 — Webhook Route (`_responseUrl`)

Koko POSTs here as `application/x-www-form-urlencoded` when payment succeeds.

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
      provider_id: "pp_koko_koko",
      data: req.body as Record<string, unknown>,   // { orderId, trnId, status, desc, signature }
      rawData: req.rawBody ?? JSON.stringify(req.body),
      headers: req.headers as Record<string, unknown>,
    })
  } catch (e) {
    console.error("Koko webhook error:", e)
  }

  // Koko expects a 200 response to consider the webhook delivered
  res.status(200).json({ received: true })
}
```

> Make sure Medusa's body parser handles `application/x-www-form-urlencoded` — by default Medusa parses JSON; you may need `express.urlencoded()` middleware registered for this specific route if form data isn't parsing into `req.body`.

---

## Step 5 — Frontend: Auto-Submitting Form (NOT fetch/redirect)

This is the **biggest difference** from a typical gateway. Koko expects an actual HTML `<form>` POST from the browser — not a JS redirect to a URL. The PHP samples confirm this (`document.getElementById(...).submit()` style auto-submit).

**`src/modules/checkout/components/payment-button/koko-button.tsx`**

```tsx
"use client"

import { useEffect, useRef, useState } from "react"

type KokoFormFields = {
  _mId: string
  api_key: string
  _returnUrl: string
  _cancelUrl: string
  _responseUrl: string
  _amount: string
  _currency: string
  _reference: string
  _orderId: string
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

type KokoPaymentButtonProps = {
  cart: {
    payment_collection?: {
      payment_sessions?: Array<{
        provider_id: string
        data?: {
          koko_form_action?: string
          koko_form_fields?: KokoFormFields
        }
      }>
    }
  }
  notReady?: boolean
}

export function KokoPaymentButton({ cart, notReady }: KokoPaymentButtonProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [submitting, setSubmitting] = useState(false)

  const kokoSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.provider_id === "pp_koko_koko"
  )

  const formAction = kokoSession?.data?.koko_form_action
  const fields = kokoSession?.data?.koko_form_fields

  const handleClick = () => {
    if (!formRef.current) return
    setSubmitting(true)
    // Submit the real HTML form — Koko requires an actual browser POST,
    // not a fetch() call, since the customer continues the flow on Koko's domain.
    formRef.current.submit()
  }

  if (!formAction || !fields) {
    return (
      <p className="text-sm text-gray-500 text-center">
        Initialising Koko checkout…
      </p>
    )
  }

  return (
    <div>
      {/* Hidden auto-submitting form — mirrors Koko's own sample code pattern */}
      <form ref={formRef} action={formAction} method="POST" style={{ display: "none" }}>
        <input type="hidden" name="_mId" value={fields._mId} />
        <input type="hidden" name="api_key" value={fields.api_key} />
        <input type="hidden" name="_returnUrl" value={fields._returnUrl} />
        <input type="hidden" name="_cancelUrl" value={fields._cancelUrl} />
        <input type="hidden" name="_responseUrl" value={fields._responseUrl} />
        <input type="hidden" name="_amount" value={fields._amount} />
        <input type="hidden" name="_currency" value={fields._currency} />
        <input type="hidden" name="_reference" value={fields._reference} />
        <input type="hidden" name="_orderId" value={fields._orderId} />
        <input type="hidden" name="_pluginName" value={fields._pluginName} />
        <input type="hidden" name="_pluginVersion" value={fields._pluginVersion} />
        <input type="hidden" name="_description" value={fields._description} />
        <input type="hidden" name="_firstName" value={fields._firstName} />
        <input type="hidden" name="_lastName" value={fields._lastName} />
        <input type="hidden" name="_email" value={fields._email} />
        {fields._mobileNo && (
          <input type="hidden" name="_mobileNo" value={fields._mobileNo} />
        )}
        <input type="hidden" name="dataString" value={fields.dataString} />
        <input type="hidden" name="signature" value={fields.signature} />
      </form>

      <button
        onClick={handleClick}
        disabled={notReady || submitting}
        className="w-full py-3 px-6 bg-[#5B2EFF] text-white font-semibold rounded-lg
                   hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {submitting ? "Redirecting to Koko…" : "Pay with Koko - 3 instalments"}
      </button>
    </div>
  )
}
```

---

## Step 6 — Return / Cancel Pages

### `_returnUrl` handler

**`src/app/[countryCode]/(main)/checkout/koko/return/page.tsx`**

```tsx
type Props = {
  searchParams: {
    orderId?: string
    trnId?: string
    status?: "SUCCESS" | "FAILURE"
  }
}

export default async function KokoReturnPage({ searchParams }: Props) {
  const { orderId, status } = searchParams

  const isSuccess = status === "SUCCESS"

  return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <h1 className="text-2xl font-semibold mb-4">
        {isSuccess ? "Payment Successful 🎉" : "Payment Failed"}
      </h1>
      <p className="text-gray-600 mb-2">
        {isSuccess
          ? "Your order is confirmed. The webhook is finalising it on our end."
          : "Something went wrong with your Koko payment. Please try again or use another method."}
      </p>
      {orderId && (
        <p className="text-sm text-gray-400 mt-2">Order ref: {orderId}</p>
      )}
      <a
        href={isSuccess ? "/account/orders" : "/checkout"}
        className="mt-8 inline-block px-6 py-3 bg-black text-white rounded"
      >
        {isSuccess ? "View My Orders" : "Back to Checkout"}
      </a>
    </div>
  )
}
```

### `_cancelUrl` handler

**`src/app/[countryCode]/(main)/checkout/koko/cancel/page.tsx`**

```tsx
export default function KokoCancelPage() {
  return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <h1 className="text-2xl font-semibold mb-4">Payment Cancelled</h1>
      <p className="text-gray-600 mb-6">
        You cancelled the Koko payment. Your cart is still saved.
      </p>
      <a href="/checkout" className="px-6 py-3 bg-black text-white rounded">
        Return to Checkout
      </a>
    </div>
  )
}
```

> ⚠️ Important: per the docs, **don't fully trust `_returnUrl` query params alone** — they're just the browser redirect. The authoritative confirmation is the signed `_responseUrl` server webhook, which is why `authorizePayment` calls `orderView` to double-check rather than trusting the redirect.

---

## Step 7 — Enable in Medusa Admin

1. Admin → Settings → Regions → your Sri Lanka/LKR region
2. Payment Providers → enable **Koko**
3. Save

---

## Key Corrections vs. My Earlier (Wrong) Guide

| Earlier guide assumed | Actual Koko API (from official docs) |
|---|---|
| JSON REST API, `fetch()` from backend | **Form POST** submitted from the customer's browser directly to Koko |
| HMAC-SHA256 with shared secret | **RSA-SHA256** signature using your private key |
| One callback URL | **Three URLs**: `_returnUrl`, `_cancelUrl`, `_responseUrl` — each with a distinct role |
| Plain JSON webhook | `_responseUrl` payload includes a Koko-signed `signature` you verify with **Koko's public key** |
| Single combined status field | Separate **Order View API** (`orderView`) with its **own** dataString order (different from orderCreate's) |
| Generic reusable order id | `_orderId` must be **unique every request** |

---

## Testing Checklist

- [ ] `KOKO_PRIVATE_KEY` and `KOKO_PUBLIC_KEY` stored as Railway secrets (with `\n` escaped correctly)
- [ ] `buildOrderCreateDataString` field order matches Koko's Java reference exactly
- [ ] Generated signature validates against Koko's QA sandbox (test via Postman first using the PHP sample as ground truth)
- [ ] Form auto-submits to `https://qaapi.paykoko.com/api/merchants/orderCreate`
- [ ] `_orderId` is unique per checkout attempt (never reused)
- [ ] `_responseUrl` webhook received and signature verifies against Koko's **public** key
- [ ] `orderView` polling works as a fallback/double-check
- [ ] Success, failure, and cancel flows all redirect correctly
- [ ] Once QA flow is fully verified, contact Koko for **production** Merchant ID / API Key / keypair

---

## One Thing Worth Double-Checking With Koko

The docs you received are marked **"Developer Preview"** — meaning the API may still change. Two things worth confirming directly with their merchant success team before going live:

1. Whether `_responseUrl` truly requires `application/x-www-form-urlencoded` parsing on your end (confirmed in docs) — make sure your Medusa webhook route parses that content type correctly, not just JSON.
2. Whether there's a refund or void endpoint not yet documented — the preview docs don't mention one.
