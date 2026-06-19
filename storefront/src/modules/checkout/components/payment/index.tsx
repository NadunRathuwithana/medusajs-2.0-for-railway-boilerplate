"use client"

import { useContext, useEffect, useMemo, useRef, useState } from "react"
import { RadioGroup } from "@headlessui/react"
import ErrorMessage from "@modules/checkout/components/error-message"
import { CheckCircleSolid } from "@medusajs/icons"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"

import PaymentContainer from "@modules/checkout/components/payment-container"
import { isStripe as isStripeFunc, paymentInfoMap } from "@lib/constants"
import { StripeContext } from "@modules/checkout/components/payment-wrapper"
import { initiatePaymentSession } from "@lib/data/cart"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const pendingSessions = (cart.payment_collection?.payment_sessions ?? []).filter(
    (paymentSession: any) => paymentSession.status === "pending"
  )
  const activeSession = pendingSessions[pendingSessions.length - 1]

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  // Auto-select the first available payment method if none is selected
  useEffect(() => {
    if (!selectedPaymentMethod && availablePaymentMethods?.length > 0) {
      setSelectedPaymentMethod(availablePaymentMethods[0].id)
    }
  }, [availablePaymentMethods, selectedPaymentMethod])


  const isStripe = isStripeFunc(activeSession?.provider_id)
  const stripeReady = useContext(StripeContext)

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (cart?.shipping_methods?.length ?? 0) !== 0 || paidByGiftcard

  const useOptions: StripeCardElementOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "Inter, sans-serif",
          color: "#111111",
          "::placeholder": {
            color: "#9ca3af",
          },
        },
      },
      classes: {
        base: "pt-3 pb-1 block w-full h-11 px-4 mt-0 bg-gray-50 border rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-black focus:border-black border-gray-200 hover:bg-gray-100 transition-colors duration-200",
      },
    }
  }, [])

  useEffect(() => {
    setError(null)
  }, [])

  // Stable refs to prevent stale closure issues without adding `cart` to deps
  const cartIdRef = useRef<string>(cart?.id)
  const cartRef = useRef<any>(cart)

  // Keep refs current on every render without causing effect re-fires
  cartIdRef.current = cart?.id
  cartRef.current = cart

  // Guard: tracks the provider currently being initiated to prevent duplicate calls
  const initiatingProviderRef = useRef<string | null>(null)

  useEffect(() => {
    let isMounted = true

    if (paymentReady && selectedPaymentMethod && !paidByGiftcard) {
      if (!activeSession || activeSession.provider_id !== selectedPaymentMethod) {
        // Prevent duplicate in-flight calls for the same provider
        if (initiatingProviderRef.current === selectedPaymentMethod) {
          return
        }

        initiatingProviderRef.current = selectedPaymentMethod
        setIsLoading(true)
        setError(null)

        // Use cartRef.current so we always use the latest cart without adding
        // `cart` to the dependency array (which would re-fire on every RSC re-render)
        initiatePaymentSession(cartRef.current, {
          provider_id: selectedPaymentMethod,
        })
          .then((result: any) => {
            if (!isMounted) return
            // initiatePaymentSession returns {error: string} on failure
            // (instead of throwing) to avoid triggering Next.js error boundary
            if (result?.error) {
              setError(result.error)
            }
          })
          .catch((err: any) => {
            if (isMounted) setError(err.message)
          })
          .finally(() => {
            initiatingProviderRef.current = null
            if (isMounted) setIsLoading(false)
          })
      }
    }

    return () => {
      isMounted = false
    }
    // NOTE: `cart` is intentionally NOT in the dependency array.
    // Adding it would cause this effect to re-fire on every RSC re-render
    // (since each render delivers a new `cart` object reference), resulting in
    // duplicate initiatePaymentSession calls. We access the latest cart value
    // via cartRef.current inside the effect instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentReady, selectedPaymentMethod, activeSession, paidByGiftcard])

  const hasPaymentMethods = availablePaymentMethods?.length > 0

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-4">
        <h2 className="flex flex-row text-[24px] font-bold text-bold gap-x-2 items-center">
          Payment
          {activeSession && <CheckCircleSolid className="text-green-500 w-6 h-6" />}
        </h2>
      </div>
      {paymentReady ? (
        <div>
          <div>
            {!paidByGiftcard && (
              <>
                {!hasPaymentMethods ? (
                  // Payment methods fetch failed or returned empty — show retry UI
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <p className="text-gray-600 text-[15px] mb-3">
                      Unable to load payment options. Please refresh the page.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-sm font-medium underline text-gray-800 hover:text-black"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    <RadioGroup
                      value={selectedPaymentMethod}
                      onChange={(value: string) => setSelectedPaymentMethod(value)}
                      className="flex flex-col gap-2"
                    >
                      {[...availablePaymentMethods]
                        .sort((a, b) => {
                          return a.provider_id > b.provider_id ? 1 : -1
                        })
                        .map((paymentMethod) => {
                          return (
                            <PaymentContainer
                              paymentInfoMap={paymentInfoMap}
                              paymentProviderId={paymentMethod.id}
                              key={paymentMethod.id}
                              selectedPaymentOptionId={selectedPaymentMethod}
                            />
                          )
                        })}
                    </RadioGroup>

                    {isLoading && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
                        Loading payment options...
                      </div>
                    )}

                    {isStripe && stripeReady && activeSession && activeSession.provider_id === selectedPaymentMethod && (
                      <div className="mt-4 transition-all duration-150 ease-in-out">
                        <span className="font-semibold text-bold mb-2 block">
                          Enter card details:
                        </span>
                        <CardElement
                          options={useOptions as StripeCardElementOptions}
                          onChange={(e) => {
                            setCardBrand(
                              e.brand && e.brand !== "unknown" ? e.brand : null
                            )
                            setCardComplete(e.complete)
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {paidByGiftcard && (
              <div className="flex flex-col w-1/3">
                <span className="text-gray-900 mb-1 font-medium">Payment method</span>
                <span className="text-gray-500 text-sm">Gift card</span>
              </div>
            )}

            <ErrorMessage
              error={error}
              data-testid="payment-method-error-message"
            />
          </div>
        </div>
      ) : (
        <div className="pb-4">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-gray-500 text-[15px]">
            Please complete the delivery step to view available payment options.
          </div>
        </div>
      )}
      <div className="h-px w-full bg-gray-100 my-5" />
    </div>
  )
}

export default Payment
