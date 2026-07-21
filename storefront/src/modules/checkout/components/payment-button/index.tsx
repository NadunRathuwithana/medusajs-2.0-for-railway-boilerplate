"use client"

import { OnApproveActions, OnApproveData } from "@paypal/paypal-js"
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState, useEffect } from "react"
import ErrorMessage from "../error-message"
import Spinner from "@modules/common/icons/spinner"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { isKoko, isManual, isOnepay, isPaypal, isStripe } from "@lib/constants"
import { clx } from "@medusajs/ui"

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

  // Missing required checkout info (address, email, shipping) — the button stays
  // disabled with no spinner, since nothing is "in progress"; the user needs to
  // go fill something in.
  const missingInfo =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  // A payment session is actively being created/synced for the selected method —
  // this IS "in progress", so the button stays disabled AND shows a spinner.
  const isSyncing =
    syncState.isLoading ||
    (syncState.selectedMethod !== null && !activeSession)

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
          <HostedPaymentButton
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

  const onPaymentCompleted = async () => {
    try {
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

  const onPaymentCompleted = async () => {
    try {
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

  const onPaymentCompleted = async () => {
    try {
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


const HostedPaymentButton = ({
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
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const redirectUrl = session?.data?.redirect_url as string | undefined
  const sessionReady = Boolean(redirectUrl)

  // If the session gets stuck without a redirect_url (provider hiccup), stop
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

  const handlePayment = () => {
    if (!redirectUrl) {
      return
    }
    setSubmitting(true)
    window.location.href = redirectUrl
  }

  return (
    <>
      <CustomButton
        disabled={notReady || submitting || !sessionReady}
        isLoading={submitting || isPreparing || (!notReady && !sessionReady)}
        onClick={handlePayment}
        data-testid={dataTestId || "submit-hosted-payment-button"}
      >
        Proceed to Payment
      </CustomButton>
      <ErrorMessage
        error={errorMessage}
        data-testid="hosted-payment-error-message"
      />
    </>
  )
}

/**
 * KokoPaymentButton — renders a hidden HTML form and submits it to Koko.
 *
 * Koko's checkout flow requires a real browser-native form POST, not a fetch()
 * call or window.location redirect. The signed form fields are built server-side
 * in initiatePayment and stored in the payment session data.
 */
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

  const handleClick = () => {
    if (!formRef.current || !formAction || !fields) {
      return
    }
    setSubmitting(true)
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

export default PaymentButton

