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

  const isOpen = searchParams.get("step") === "payment"

  const isStripe = isStripeFunc(activeSession?.provider_id)
  const stripeReady = useContext(StripeContext)

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

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

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeFunc(selectedPaymentMethod) && !activeSession

      if (!activeSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <h2
          className={clx(
            "flex flex-row text-[24px] font-bold text-bold gap-x-2 items-center",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Payment
          {!isOpen && paymentReady && <CheckCircleSolid className="text-green-500 w-6 h-6" />}
        </h2>
        {!isOpen && paymentReady && (
          <button
            onClick={handleEdit}
            className="text-[14px] font-medium text-gray-500 hover:text-bold transition-colors"
            data-testid="edit-payment-button"
          >
            Edit
          </button>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
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
              {isStripe && stripeReady && (
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

          <div className="mt-6">
            <button
              className="w-full md:w-auto px-8 h-[50px] bg-[#111111] hover:bg-black text-white rounded-[12px] font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              onClick={handleSubmit}
              disabled={
                (isStripe && !cardComplete) ||
                (!selectedPaymentMethod && !paidByGiftcard) || isLoading
              }
              data-testid="submit-payment-button"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                !activeSession && isStripeFunc(selectedPaymentMethod)
                ? "Enter card details"
                : "Continue to review"
              )}
            </button>
          </div>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex items-start gap-x-8 w-full text-sm">
              <div className="flex flex-col flex-1">
                <span className="font-semibold text-bold mb-2">
                  Payment method
                </span>
                <span
                  className="text-gray-600"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[selectedPaymentMethod]?.title ||
                    selectedPaymentMethod}
                </span>
              </div>
              <div className="flex flex-col flex-1">
                <span className="font-semibold text-bold mb-2">
                  Payment details
                </span>
                <div
                  className="flex gap-2 text-gray-600 items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-gray-50 border-gray-200">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || (
                      <CreditCard className="w-4 h-4 text-gray-500" />
                    )}
                  </Container>
                  <span>
                    {isStripeFunc(selectedPaymentMethod) && cardBrand
                      ? cardBrand
                      : "Another step will appear"}
                  </span>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col flex-1 text-sm">
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
          ) : null}
        </div>
      </div>
      <div className="h-px w-full bg-gray-100 my-8" />
    </div>
  )
}

export default Payment
