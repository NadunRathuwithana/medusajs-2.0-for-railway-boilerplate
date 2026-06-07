"use client"

import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { RadioGroup } from "@headlessui/react"
import ErrorMessage from "@modules/checkout/components/error-message"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Container, clx } from "@medusajs/ui"
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
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

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

  useEffect(() => {
    let isMounted = true
    if (paymentReady && selectedPaymentMethod && !paidByGiftcard) {
      if (!activeSession || activeSession.provider_id !== selectedPaymentMethod) {
        setIsLoading(true)
        initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
          .then((result: any) => {
            // initiatePaymentSession returns {error: string} on failure
            // (instead of throwing) to avoid triggering Next.js error boundary
            if (result?.error && isMounted) {
              setError(result.error)
            }
          })
          .catch((err: any) => {
            if (isMounted) setError(err.message)
          })
          .finally(() => {
            if (isMounted) setIsLoading(false)
          })
      }
    }
    return () => {
      isMounted = false
    }
  }, [paymentReady, selectedPaymentMethod, activeSession, cart, paidByGiftcard])

  if (!paymentReady) {
    return null
  }

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <h2 className="flex flex-row text-[24px] font-bold text-bold gap-x-2 items-center">
          Payment
          {activeSession && <CheckCircleSolid className="text-green-500 w-6 h-6" />}
        </h2>
      </div>
      <div>
        <div>
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setSelectedPaymentMethod(value)}
              >
                {availablePaymentMethods
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
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
                  Loading payment options...
                </div>
              )}

              {isStripe && stripeReady && activeSession && activeSession.provider_id === selectedPaymentMethod && (
                <div className="mt-5 transition-all duration-150 ease-in-out">
                  <span className="font-semibold text-bold mb-2 block">
                    Enter your card details:
                  </span>

                  <CardElement
                    options={useOptions as StripeCardElementOptions}
                    onChange={(e) => {
                      setCardBrand(
                        e.brand &&
                          e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                      )
                      setError(e.error?.message || null)
                      setCardComplete(e.complete)
                    }}
                  />
                </div>
              )}
            </>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <span className="font-semibold text-bold mb-2">
                Payment method
              </span>
              <span
                className="text-gray-600"
                data-testid="payment-method-summary"
              >
                Gift card
              </span>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />
        </div>
      </div>
      <div className="h-px w-full bg-gray-100 my-8" />
    </div>
  )
}

export default Payment
