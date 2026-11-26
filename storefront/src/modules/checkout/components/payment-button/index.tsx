"use client"

import { OnApproveActions, OnApproveData } from "@paypal/paypal-js"
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState, useEffect } from "react"
import ErrorMessage from "../error-message"
import Spinner from "@modules/common/icons/spinner"
import { checkCartReady, placeOrder, startOnepayCheckout } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { isKoko, isManual, isMintpay, isOnepay, isPaypal, isStripe } from "@lib/constants"
import { useLiveCheckout } from "@modules/checkout/context/live-checkout-context"
import { clx } from "@medusajs/ui"
import { confirmOnepayJs } from "../../../../app/[countryCode]/(checkout)/checkout/onepay/return/actions"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const CustomButton = ({
  children,
  isLoading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }) => {
  return (
    <button
      {...props}
      className={clx(
        "w-full px-8 h-[50px] bg-[#111111] hover:bg-black text-white rounded-[12px] font-medium transition-colors disabled:opacity-50 flex items-center justify-center",
        props.className
      )}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  )
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const [syncState, setSyncState] = useState<{
    isLoading: boolean
    selectedMethod: string | null
    session?: { id: string; provider_id: string; status: string; data: Record<string, unknown> } | null
  }>({
    isLoading: false,
    selectedMethod: null,
    session: null,
  })

  useEffect(() => {
    const handleSync = (e: any) => setSyncState(e.detail)
    window.addEventListener("payment-method-sync", handleSync)
    return () => window.removeEventListener("payment-method-sync", handleSync)
  }, [])

  // When switching providers, Medusa may leave multiple sessions as "pending".
  // The store cart API appends the most recently created session to the end of the array.
  // We cannot rely solely on the data fields (since they might be cached or missing),
  // so we sort by updated_at to ensure we take the most recently modified pending session.
  const pendingSessions = (
    cart.payment_collection?.payment_sessions ?? []
  )
    .filter((s: any) => s.status === "pending")
    .sort(
      (a: any, b: any) =>
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    )

  const paymentSession = pendingSessions[pendingSessions.length - 1]

  // Use the just-selected provider (updated instantly via the sync event) as the
  // source of truth for which button to render, instead of waiting for the cart
  // prop to catch up after revalidation. This keeps a stable "Place order" button
  // on screen — just disabled/spinning — instead of swapping to a generic
  // "Select a payment method" placeholder while the new session is being created.
  const activeProviderId = syncState.selectedMethod || paymentSession?.provider_id

  // Prefer the session handed back directly by initiatePaymentSession (available
  // the instant the payment API responds) over the cart prop, which only reflects
  // the new session after a full Next.js cart revalidate/refetch — a second,
  // heavier round trip that was leaving the button disabled for several extra
  // seconds after the actual payment provider had already responded.
  const activeSession =
    syncState.session?.provider_id === activeProviderId
      ? syncState.session
      : paymentSession?.provider_id === activeProviderId
      ? paymentSession
      : undefined

  // Missing (or invalid) required checkout info. addressesComplete comes
  // from the Addresses form's live on-screen values (recomputed
  // synchronously on every keystroke, no network) — so clearing the phone
  // field disables this button instantly, not ~1.5s later once the
  // debounced save reaches the server. Shipping method is checked
  // separately since that's its own explicit selection step, not text
  // that gets typed/cleared the same way.
  const { addressesComplete } = useLiveCheckout()
  const paidByGiftcard =
    (cart as any)?.gift_cards?.length > 0 && cart.total === 0
  const missingInfo =
    !addressesComplete ||
    ((cart.shipping_methods?.length ?? 0) < 1 && !paidByGiftcard)

  // A payment session is actively being created/synced for the selected method —
  // this IS "in progress", so the button stays disabled AND shows a spinner.
  // Only while details are complete: with details missing no session is being
  // made (it waits for them), so a spinner there looked like an endless load.
  const isSyncing =
    !missingInfo &&
    (syncState.isLoading ||
      (syncState.selectedMethod !== null && !activeSession))

  const notReady = missingInfo || isSyncing

  const debugInfo = null

  switch (true) {
    case isStripe(activeProviderId):
      return (
        <>
          {debugInfo}
          <StripePaymentButton
            notReady={notReady}
            isPreparing={isSyncing}
            cart={cart}
            session={activeSession as any}
            data-testid={dataTestId}
          />
        </>
      )
    case isKoko(activeProviderId):
      return (
        <>
          {debugInfo}
          <KokoPaymentButton
            notReady={notReady}
            isPreparing={isSyncing}
            session={activeSession as any}
            data-testid={dataTestId}
          />
        </>
      )
    case isManual(activeProviderId):
      return (
        <>
          {debugInfo}
          <ManualTestPaymentButton
            notReady={notReady}
            isPreparing={isSyncing}
            data-testid={dataTestId || "submit-order-button"}
          />
        </>
      )
    case isOnepay(activeProviderId):
      return (
        <>
          {debugInfo}
          {/* Onepay creates its link on click, so it never waits on a
              background session: only the customer's details gate it. */}
          <OnepayButton
            notReady={missingInfo}
            popup={process.env.NEXT_PUBLIC_ONEPAY_JS === "true"}
          />
        </>
      )
    case isMintpay(activeProviderId):
      return (
        <>
          {debugInfo}
          <MintpayPaymentButton
            notReady={notReady}
            isPreparing={isSyncing}
            session={activeSession as any}
            data-testid={dataTestId}
          />
        </>
      )
    case isPaypal(activeProviderId):
      return (
        <>
          {debugInfo}
          <PayPalPaymentButton
            notReady={notReady}
            cart={cart}
            data-testid={dataTestId}
          />
        </>
      )
    default:
      return (
        <>
          {debugInfo}
          <CustomButton disabled isLoading={isSyncing}>
            Select a payment method
          </CustomButton>
        </>
      )
  }
}

const StripePaymentButton = ({
  cart,
  session,
  notReady,
  isPreparing,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  session?: { provider_id: string; status: string; data: Record<string, unknown> } | null
  notReady: boolean
  isPreparing?: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { flushAddresses } = useLiveCheckout()

  const onPaymentCompleted = async () => {
    try {
      await flushAddresses()
      const ready = await checkCartReady()
      if (ready.error) {
        setErrorMessage(ready.error)
        setSubmitting(false)
        return
      }
      await placeOrder()
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err
      }
      setErrorMessage(err.message)
      setSubmitting(false)
    }
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  // Prefer the session synced instantly from initiatePaymentSession's response
  // over re-deriving it from the (slower-to-arrive) cart prop.
  const clientSecret = session?.data?.client_secret as string | undefined

  const disabled = !stripe || !elements || !clientSecret ? true : false

  const handlePayment = async () => {
    setSubmitting(true)
    await flushAddresses()

    if (!stripe || !elements || !card || !cart || !clientSecret) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setErrorMessage(error.message || null)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        return
      })
  }

  return (
    <>
      <CustomButton
        disabled={disabled || notReady || submitting}
        onClick={handlePayment}
        isLoading={submitting || isPreparing}
        data-testid={dataTestId}
      >
        Place order
      </CustomButton>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const PayPalPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { flushAddresses } = useLiveCheckout()

  const onPaymentCompleted = async () => {
    try {
      await flushAddresses()
      const ready = await checkCartReady()
      if (ready.error) {
        setErrorMessage(ready.error)
        setSubmitting(false)
        return
      }
      await placeOrder()
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err
      }
      setErrorMessage(err.message)
      setSubmitting(false)
    }
  }

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const handlePayment = async (
    _data: OnApproveData,
    actions: OnApproveActions
  ) => {
    actions?.order
      ?.authorize()
      .then((authorization) => {
        if (authorization.status !== "COMPLETED") {
          setErrorMessage(`An error occurred, status: ${authorization.status}`)
          return
        }
        onPaymentCompleted()
      })
      .catch(() => {
        setErrorMessage(`An unknown error occurred, please try again.`)
        setSubmitting(false)
      })
  }

  const [{ isPending, isResolved }] = usePayPalScriptReducer()

  if (isPending) {
    return <Spinner />
  }

  if (isResolved) {
    return (
      <>
        <PayPalButtons
          style={{ layout: "horizontal" }}
          createOrder={async () => session?.data.id as string}
          onApprove={handlePayment}
          disabled={notReady || submitting || isPending}
          data-testid={dataTestId}
        />
        <ErrorMessage
          error={errorMessage}
          data-testid="paypal-payment-error-message"
        />
      </>
    )
  }
}

const ManualTestPaymentButton = ({
  notReady,
  isPreparing,
  "data-testid": dataTestId,
}: {
  notReady: boolean
  isPreparing?: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { flushAddresses } = useLiveCheckout()

  const onPaymentCompleted = async () => {
    try {
      await flushAddresses()
      const ready = await checkCartReady()
      if (ready.error) {
        setErrorMessage(ready.error)
        setSubmitting(false)
        return
      }
      await placeOrder()
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err
      }
      setErrorMessage(err.message)
      setSubmitting(false)
    }
  }

  const handlePayment = () => {
    setSubmitting(true)
    onPaymentCompleted()
  }

  return (
    <>
      <CustomButton
        disabled={notReady || submitting}
        isLoading={submitting || isPreparing}
        onClick={handlePayment}
        data-testid={dataTestId || "submit-order-button"}
      >
        Place order
      </CustomButton>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}


/**
 * Onepay card payment.
 *
 * Click -> save details + validate + create a fresh Onepay link (one server
 * round trip) -> open it in Onepay's on-page popup (or redirect when the popup
 * is off / unavailable). The link is created at click time so it always
 * matches the final cart total and can't be replaced while the customer pays.
 *
 * Finishing: whichever arrives first wins (single-flight):
 *  - Onepay.js "onePaySuccess" event
 *  - our return page loading inside the popup (it posts a message up)
 *  - the popup being closed (we check with Onepay in case they paid)
 * The backend verifies with Onepay before any order is created, and the
 * reconcile job + webhook still finish the order if this tab dies.
 */
const ONEPAY_JS_SRC = "https://storage.googleapis.com/onepayjs/onepayv2.js"

let onepayJsPromise: Promise<void> | null = null
const loadOnepayJs = () => {
  if (typeof (window as any).openPaymentIframe === "function") return Promise.resolve()
  if (onepayJsPromise) return onepayJsPromise
  onepayJsPromise = new Promise<void>((resolve, reject) => {
    // Onepay.js looks for #onepay-btn when it loads.
    if (!document.getElementById("onepay-btn")) {
      const host = document.createElement("div")
      host.id = "onepay-btn"
      host.style.display = "none"
      document.body.appendChild(host)
    }
    const el = document.createElement("script")
    el.src = ONEPAY_JS_SRC
    el.async = true
    el.onload = () => resolve()
    el.onerror = () => {
      onepayJsPromise = null
      reject(new Error("load failed"))
    }
    document.body.appendChild(el)
  })
  return onepayJsPromise
}

type OnepayPhase = "idle" | "starting" | "paying" | "confirming"

const OnepayButton = ({ notReady, popup }: { notReady: boolean; popup: boolean }) => {
  const [phase, setPhase] = useState<OnepayPhase>("idle")
  const [error, setError] = useState<string | null>(null)
  // Neutral status line (not an error), e.g. while we quietly check a closed popup.
  const [note, setNote] = useState<string | null>(null)
  const { flushAddresses } = useLiveCheckout()
  const txnRef = React.useRef<string | null>(null)
  // Synchronous click lock: React state doesn't update between two clicks in
  // the same instant, so a fast double tap used to open two popups/links.
  const busyRef = React.useRef(false)
  const finishing = React.useRef(false)
  const overlayRef = React.useRef<Element | null>(null)
  const observerRef = React.useRef<MutationObserver | null>(null)

  // Warm the popup script while the customer fills the form.
  useEffect(() => {
    if (popup) loadOnepayJs().catch(() => {})
  }, [popup])

  const stopWatching = () => {
    observerRef.current?.disconnect()
    observerRef.current = null
  }

  const removeOverlay = () => {
    const el = overlayRef.current
    overlayRef.current = null
    if (el?.parentNode) el.parentNode.removeChild(el)
  }

  // Verify with Onepay, then complete the order. Never shows "failed" for a
  // payment that may have gone through: it tells the customer not to pay again.
  const finish = async (fromClose = false) => {
    const txn = txnRef.current
    if (!txn || finishing.current) return
    stopWatching()
    removeOverlay()

    if (fromClose) {
      // Almost always "closed without paying": give the button back at once and
      // check quietly in the background. Onepay can take a few seconds to report
      // a payment, so if one shows up we finish the order then.
      busyRef.current = false
      setPhase("idle")
      setError(null)
      setNote("Payment window closed.")
      ;(async () => {
        for (let i = 0; i < 12; i++) {
          if (txnRef.current !== txn || finishing.current) return
          const r: any = await confirmOnepayJs(txn)
          if (txnRef.current !== txn || finishing.current) return
          if (r?.ok) return finishRef.current(false)
          if (r?.failed) break // Onepay says not paid: nothing to wait for
          await new Promise((r2) => setTimeout(r2, i < 3 ? 1500 : 3000))
        }
        if (txnRef.current === txn) setNote(null)
      })()
      return
    }

    finishing.current = true
    busyRef.current = true
    setPhase("confirming")
    setError(null)
    setNote(null)

    let ok = false
    for (let i = 0; i < 8 && !ok; i++) {
      const r = await confirmOnepayJs(txn)
      ok = !!r?.ok
      if (!ok && i < 7) await new Promise((r2) => setTimeout(r2, 1500))
    }

    if (!ok) {
      finishing.current = false
      // Paid per Onepay.js but not confirmed yet: hand over to the return
      // page, which keeps checking and shows the right message.
      window.location.href = `${window.location.pathname.replace(/\/checkout.*$/, "")}/checkout/onepay/return?txn=${encodeURIComponent(txn)}`
      return
    }

    try {
      await placeOrder() // redirects to the confirmation page on success
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    }
    // Order may already exist (webhook won the race) or needs another moment:
    // the return page resolves both cases.
    window.location.href = `${window.location.pathname.replace(/\/checkout.*$/, "")}/checkout/onepay/return?txn=${encodeURIComponent(txn)}`
  }

  const finishRef = React.useRef(finish)
  finishRef.current = finish

  useEffect(() => {
    const onSuccess = () => finishRef.current(false)
    const onFail = () => {
      if (finishing.current) return
      stopWatching()
      removeOverlay()
      txnRef.current = null
      busyRef.current = false
      setNote(null)
      setPhase("idle")
      setError("Payment was not completed. You have not been charged, please try again.")
    }
    // Our return page, when Onepay loads it inside the popup.
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      if (e.data?.type !== "cardle:onepay-return") return
      if (e.data.failed) onFail()
      else finishRef.current(false)
    }
    window.addEventListener("onePaySuccess", onSuccess)
    window.addEventListener("onePayFail", onFail)
    window.addEventListener("message", onMessage)
    return () => {
      window.removeEventListener("onePaySuccess", onSuccess)
      window.removeEventListener("onePayFail", onFail)
      window.removeEventListener("message", onMessage)
      stopWatching()
    }
  }, [])

  // Track Onepay's overlay so closing it resets the button (and checks whether
  // the customer paid before closing).
  const watchOverlay = (before: Set<Element>) => {
    stopWatching()
    const find = () =>
      Array.from(document.body.children).find(
        (el) => !before.has(el) && (el.tagName === "IFRAME" || el.querySelector("iframe"))
      ) ?? null
    overlayRef.current = find()
    const obs = new MutationObserver(() => {
      if (!overlayRef.current) {
        overlayRef.current = find()
        return
      }
      if (!overlayRef.current.isConnected) {
        overlayRef.current = null
        stopWatching()
        finishRef.current(true)
      }
    })
    obs.observe(document.body, { childList: true })
    observerRef.current = obs
  }

  const handlePayment = async () => {
    if (notReady || busyRef.current) return
    busyRef.current = true
    setPhase("starting")
    setError(null)
    setNote(null)
    finishing.current = false
    txnRef.current = null // stops any background check of an earlier popup
    try {
      await flushAddresses()
      const res = await startOnepayCheckout()
      if ("error" in res) {
        setError(res.error)
        setPhase("idle")
        busyRef.current = false
        return
      }
      txnRef.current = res.txn_id

      if (!popup) {
        window.location.href = res.redirect_url
        return
      }
      try {
        await loadOnepayJs()
        const open = (window as any).openPaymentIframe
        if (typeof open !== "function") throw new Error("no popup")
        // Direct mode: Onepay.js opens our server-made link (no secrets here).
        ;(window as any).onePayData = {
          directGatewayURL: res.redirect_url,
          directTransactionId: res.txn_id,
        }
        const before = new Set(Array.from(document.body.children))
        open(res.redirect_url, res.txn_id)
        setPhase("paying")
        watchOverlay(before)
      } catch {
        window.location.href = res.redirect_url
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.")
      setPhase("idle")
      busyRef.current = false
    }
  }

  const label =
    phase === "starting"
      ? "Preparing secure payment..."
      : phase === "paying"
      ? "Complete payment in the window"
      : phase === "confirming"
      ? "Confirming payment..."
      : "Place order"

  return (
    <>
      <button
        type="button"
        onClick={handlePayment}
        disabled={notReady || phase !== "idle"}
        data-testid="submit-onepay-button"
        className={clx(
          "w-full px-8 h-[50px] bg-[#111111] hover:bg-black text-white rounded-[12px] font-medium transition-colors flex items-center justify-center gap-x-3",
          notReady && phase === "idle" && "opacity-50",
          phase !== "idle" && "cursor-wait"
        )}
      >
        {phase !== "idle" && (
          <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" aria-hidden />
        )}
        <span>{label}</span>
      </button>
      {phase === "confirming" && (
        <p className="mt-2 text-center text-xs text-gray-500">
          Please keep this page open. Do not pay again.
        </p>
      )}
      {note && !error && (
        <p className="mt-2 text-center text-xs text-gray-500" data-testid="onepay-note">{note}</p>
      )}
      <ErrorMessage error={error} data-testid="onepay-error-message" />
    </>
  )
}

const KokoPaymentButton = ({
  session,
  notReady,
  isPreparing,
  "data-testid": dataTestId,
}: {
  session: any
  notReady: boolean
  isPreparing?: boolean
  "data-testid"?: string
}) => {
  const formRef = React.useRef<HTMLFormElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { flushAddresses } = useLiveCheckout()

  const formAction = session?.data?.koko_form_action as string | undefined
  const fields = session?.data?.koko_form_fields as Record<string, string> | undefined
  const sessionReady = Boolean(formAction && fields)

  // If the form fields get stuck without arriving (provider hiccup), stop
  // spinning forever and let the user know instead of leaving a dead button.
  useEffect(() => {
    if (notReady || sessionReady) {
      setErrorMessage(null)
      return
    }
    const timer = setTimeout(() => {
      setErrorMessage("Payment session is taking longer than expected. Please try again.")
    }, 8000)
    return () => clearTimeout(timer)
  }, [notReady, sessionReady])

  const handleClick = async () => {
    // notReady already reflects the live (instant, no network) Addresses
    // form validity — this is just a final synchronous guard in case the
    // disabled attribute was somehow bypassed.
    if (!formRef.current || !formAction || !fields || notReady) {
      return
    }
    setSubmitting(true)
    try {
      await flushAddresses()
      const ready = await checkCartReady()
      if (ready.error) {
        setErrorMessage(ready.error)
        setSubmitting(false)
        return
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Could not verify stock. Please try again.")
      setSubmitting(false)
      return
    }
    // Submit the real HTML form — Koko requires an actual browser POST,
    // not a fetch() call, since the customer continues the flow on Koko's domain.
    formRef.current.submit()
  }

  return (
    <>
      {/* Hidden auto-submitting form — mirrors Koko's own sample code pattern */}
      {formAction && fields && (
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
      )}

      <CustomButton
        onClick={handleClick}
        disabled={notReady || submitting || !sessionReady}
        isLoading={submitting || isPreparing || (!notReady && !sessionReady)}
        data-testid={dataTestId || "koko-payment-button"}
        className="bg-black hover:bg-black/90"
      >
        {submitting ? "Redirecting to Koko…" : "Pay with Koko"}
      </CustomButton>
      <ErrorMessage
        error={errorMessage}
        data-testid="koko-payment-error-message"
      />
    </>
  )
}

/**
 * MintpayPaymentButton — renders a hidden HTML form and submits it to Mintpay.
 *
 * Unlike Koko, the order/customer data was already POSTed server-to-server in
 * initiatePayment (Mintpay's Step 1); this form only carries the resulting
 * purchase_id (Step 2), which is what redirects the customer's browser to
 * Mintpay's hosted payment page.
 */
const MintpayPaymentButton = ({
  session,
  notReady,
  isPreparing,
  "data-testid": dataTestId,
}: {
  session: any
  notReady: boolean
  isPreparing?: boolean
  "data-testid"?: string
}) => {
  const formRef = React.useRef<HTMLFormElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { flushAddresses } = useLiveCheckout()

  const formAction = session?.data?.mintpay_form_action as string | undefined
  const fields = session?.data?.mintpay_form_fields as Record<string, string> | undefined
  const sessionReady = Boolean(formAction && fields)

  // If the form fields get stuck without arriving (provider hiccup), stop
  // spinning forever and let the user know instead of leaving a dead button.
  useEffect(() => {
    if (notReady || sessionReady) {
      setErrorMessage(null)
      return
    }
    const timer = setTimeout(() => {
      setErrorMessage("Payment session is taking longer than expected. Please try again.")
    }, 8000)
    return () => clearTimeout(timer)
  }, [notReady, sessionReady])

  const handleClick = async () => {
    // notReady already reflects the live (instant, no network) Addresses
    // form validity — this is just a final synchronous guard in case the
    // disabled attribute was somehow bypassed.
    if (!formRef.current || !formAction || !fields || notReady) {
      return
    }
    setSubmitting(true)
    try {
      await flushAddresses()
      const ready = await checkCartReady()
      if (ready.error) {
        setErrorMessage(ready.error)
        setSubmitting(false)
        return
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Could not verify stock. Please try again.")
      setSubmitting(false)
      return
    }
    // Real browser POST — the customer continues the flow on Mintpay's domain.
    formRef.current.submit()
  }

  return (
    <>
      {formAction && fields && (
        <form ref={formRef} action={formAction} method="POST" style={{ display: "none" }}>
          <input type="hidden" name="purchase_id" value={fields.purchase_id} />
        </form>
      )}

      <CustomButton
        onClick={handleClick}
        disabled={notReady || submitting || !sessionReady}
        isLoading={submitting || isPreparing || (!notReady && !sessionReady)}
        data-testid={dataTestId || "mintpay-payment-button"}
        className="bg-black hover:bg-black/90"
      >
        {submitting ? "Redirecting to Mintpay…" : "Pay with Mintpay"}
      </CustomButton>
      <ErrorMessage
        error={errorMessage}
        data-testid="mintpay-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
