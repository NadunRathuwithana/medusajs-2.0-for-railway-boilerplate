"use client"

import { OnApproveActions, OnApproveData } from "@paypal/paypal-js"
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState } from "react"
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
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

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

  const debugInfo = null

  switch (true) {
    case isStripe(paymentSession?.provider_id):
      return (
        <>
          {debugInfo}
          <StripePaymentButton
            notReady={notReady}
            cart={cart}
            data-testid={dataTestId}
          />
        </>
      )
    case isKoko(paymentSession?.provider_id):
      return (
        <>
          {debugInfo}
          <KokoPaymentButton
            notReady={notReady}
            session={paymentSession as any}
            data-testid={dataTestId}
          />
        </>
      )
    case isManual(paymentSession?.provider_id):
      return (
        <>
          {debugInfo}
          <ManualTestPaymentButton
            notReady={notReady}
            data-testid={dataTestId || "submit-order-button"}
          />
        </>
      )
    case isOnepay(paymentSession?.provider_id):
      return (
        <>
          {debugInfo}
          <HostedPaymentButton
            notReady={notReady}
            session={paymentSession as any}
            data-testid={dataTestId}
          />
        </>
      )
    case isPaypal(paymentSession?.provider_id):
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
          <CustomButton disabled>Select a payment method</CustomButton>
        </>
      )
  }
}

const StripePaymentButton = ({
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

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
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
        isLoading={submitting}
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
  "data-testid": dataTestId,
}: {
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

  const handlePayment = () => {
    setSubmitting(true)
    onPaymentCompleted()
  }

  return (
    <>
      <CustomButton
        disabled={notReady || submitting}
        isLoading={submitting}
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
  "data-testid": dataTestId,
}: {
  session: any
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePayment = () => {
    setSubmitting(true)
    const redirectUrl = session?.data?.redirect_url as string | undefined
    if (redirectUrl) {
      window.location.href = redirectUrl
    } else {
      setErrorMessage("Payment session not ready. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <>
      <CustomButton
        disabled={notReady || submitting}
        isLoading={submitting}
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
  "data-testid": dataTestId,
}: {
  session: any
  notReady: boolean
  "data-testid"?: string
}) => {
  const formRef = React.useRef<HTMLFormElement>(null)
  const [submitting, setSubmitting] = useState(false)

  const formAction = session?.data?.koko_form_action as string | undefined
  const fields = session?.data?.koko_form_fields as Record<string, string> | undefined

  const handleClick = () => {
    if (!formRef.current || !formAction || !fields) {
      return
    }
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

  console.log("KOKO FIELDS RECEIVED IN FRONTEND:", {
    _pluginName: fields._pluginName,
    _pluginVersion: fields._pluginVersion,
    _mId: fields._mId,
    formAction
  });

  return (
    <>
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

      <CustomButton
        onClick={handleClick}
        disabled={notReady || submitting}
        isLoading={submitting}
        data-testid={dataTestId || "koko-payment-button"}
        className="bg-black hover:bg-black/90"
      >
        {submitting ? "Redirecting to Koko…" : "Place Order"}
      </CustomButton>
    </>
  )
}

export default PaymentButton

