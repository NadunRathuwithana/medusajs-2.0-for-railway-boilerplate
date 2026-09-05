"use client"

import { useContext, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { RadioGroup } from "@headlessui/react"
import ErrorMessage from "@modules/checkout/components/error-message"
import { CheckCircleSolid } from "@medusajs/icons"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"

import PaymentContainer from "@modules/checkout/components/payment-container"
import { isStripe as isStripeFunc, paymentInfoMap, getPaymentPromoInfo, getAllPaymentPromoCodes } from "@lib/constants"
import { StripeContext } from "@modules/checkout/components/payment-wrapper"
import { initiatePaymentSession, applyPromotions } from "@lib/data/cart"
import { trackAddPaymentInfo } from "@lib/analytics/track"
import { wasEventTracked, markEventTracked } from "@lib/analytics/dedup"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const pendingSessions = (cart.payment_collection?.payment_sessions ?? [])
    .filter((paymentSession: any) => paymentSession.status === "pending")
    .sort(
      (a: any, b: any) =>
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    )
  const activeSession = pendingSessions[pendingSessions.length - 1]

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The session returned directly by initiatePaymentSession — synced to
  // PaymentButton the moment the payment API responds, without waiting for the
  // cart prop to catch up via a full Next.js RSC revalidate/refetch.
  const [syncedSession, setSyncedSession] = useState<any>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  // Auto-select COD (pp_system_default) if available, otherwise fallback to the first available method
  useEffect(() => {
    if (!selectedPaymentMethod && availablePaymentMethods?.length > 0) {
      const codMethod = availablePaymentMethods.find(
        (m) => m.id === "pp_system_default"
      )
      if (codMethod) {
        setSelectedPaymentMethod(codMethod.id)
      } else {
        setSelectedPaymentMethod(availablePaymentMethods[0].id)
      }
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

  const [isPendingPromotions, startTransition] = useTransition()

  // Track the last successfully requested promo codes to prevent infinite loops
  const lastAttemptedCodesRef = useRef<string | null>(null)

  // Handle automatic payment promotions
  useEffect(() => {
    if (!selectedPaymentMethod || !cart) return

    const promoInfo = getPaymentPromoInfo(selectedPaymentMethod)
    const codeToAdd = promoInfo.code

    // Normalize codes to uppercase for safe comparison
    const allPaymentCodesUpper = getAllPaymentPromoCodes().map(c => c.toUpperCase())
    const currentCodes = (cart.promotions || []).map((p: any) => p.code).filter(Boolean)

    // Filter out all known payment codes to preserve user's own promos (e.g., SITEWIDE10)
    // Compare in uppercase to prevent case-mismatches from keeping the code stuck
    const nonPaymentCodes = currentCodes.filter(
      (c: string) => !allPaymentCodesUpper.includes(c.toUpperCase())
    )

    // Build target codes array
    const targetCodes = [...nonPaymentCodes]
    if (codeToAdd) {
      // Check if we already have it (case-insensitive)
      const hasCode = targetCodes.some(c => c.toUpperCase() === codeToAdd.toUpperCase())
      if (!hasCode) {
        targetCodes.push(codeToAdd)
      }
    }

    // Check if targetCodes differ from currentCodes (case-insensitive check)
    const targetSorted = [...targetCodes].map(c => c.toUpperCase()).sort()
    const currentSorted = [...currentCodes].map(c => c.toUpperCase()).sort()

    const hasChanged = targetSorted.length !== currentSorted.length ||
      targetSorted.some((val, i) => val !== currentSorted[i])

    // Create a string representation to check if we already attempted this exact sync
    const targetCodesString = targetSorted.join(",")

    // Only apply if it actually changed AND we haven't already attempted this exact state.
    // This strictly prevents infinite loops if the Medusa server drops the update or delays it.
    if (hasChanged && lastAttemptedCodesRef.current !== targetCodesString) {
      lastAttemptedCodesRef.current = targetCodesString
      startTransition(() => {
        applyPromotions(targetCodes).then((res) => {
          if (res?.error) {
            console.error("Failed to apply payment promo:", res.error)
            // If it failed (e.g. missing email), reset the ref so it can be retried later
            lastAttemptedCodesRef.current = null
          }
        }).catch((err) => {
          console.error(err)
          lastAttemptedCodesRef.current = null
        })
      })
    }
  }, [selectedPaymentMethod, cart?.promotions])

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

        // Add basic validation for required customer fields
        // Must match Review component's missingDetails logic
        const billingFirstName = cartRef.current?.billing_address?.first_name
        const email = cartRef.current?.email
        if (!billingFirstName || !email) {
          // Validation error will be shown beautifully in the Review component
          return
        }

        initiatingProviderRef.current = selectedPaymentMethod
        setIsLoading(true)
        setError(null)
        setSyncedSession(null)

        // Use cartRef.current so we always use the latest cart without adding
        // `cart` to the dependency array (which would re-fire on every RSC re-render)
        initiatePaymentSession(cartRef.current, {
          provider_id: selectedPaymentMethod,
          data: {
            customer: cartRef.current?.customer,
            billing_address: cartRef.current?.billing_address,
            shipping_address: cartRef.current?.shipping_address,
            email: cartRef.current?.email,
            // Mintpay's order-create call needs line items and cart
            // timestamps too (see modules/mintpay-payment/service.ts) — Koko
            // and OnePay simply ignore these extra fields.
            items: cartRef.current?.items,
            cart_created_at: cartRef.current?.created_at,
            cart_updated_at: cartRef.current?.updated_at,
          }
        })
          .then((result: any) => {
            if (!isMounted) return
            // initiatePaymentSession returns {error: string} on failure
            // (instead of throwing) to avoid triggering Next.js error boundary
            if (result?.error) {
              setError(result.error)
            } else if (result?.session) {
              setSyncedSession(result.session)
              // Dedup per cart+method — switching providers is a genuinely
              // new "payment info submitted" event, but re-renders of the
              // same already-initiated session shouldn't re-fire.
              const dedupKey = `${cartIdRef.current}:${selectedPaymentMethod}`
              if (!wasEventTracked("payment_info", dedupKey)) {
                trackAddPaymentInfo({
                  items: cartRef.current?.items ?? [],
                  total: cartRef.current?.total,
                  currency: cartRef.current?.currency_code,
                  paymentType: selectedPaymentMethod,
                })
                markEventTracked("payment_info", dedupKey)
              }
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
  }, [paymentReady, cart?.updated_at, selectedPaymentMethod, activeSession, paidByGiftcard])

  // Sync state to PaymentButton to prevent race conditions during rapid checkouts
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("payment-method-sync", {
        detail: {
          isLoading,
          selectedMethod: selectedPaymentMethod,
          session: syncedSession,
        },
      })
    )
  }, [isLoading, selectedPaymentMethod, syncedSession])

  const hasPaymentMethods = availablePaymentMethods?.length > 0

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-4">
        <h2 className="flex flex-row text-[20px] sm:text-[24px] font-bold text-bold gap-x-2 items-center">
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
                          const order = ["pp_system_default", "pp_onepay_onepay", "pp_koko_koko", "pp_mintpay_mintpay"]
                          const indexA = order.indexOf(a.id)
                          const indexB = order.indexOf(b.id)

                          if (indexA === -1 && indexB === -1) return a.id > b.id ? 1 : -1
                          if (indexA === -1) return 1
                          if (indexB === -1) return -1

                          return indexA - indexB
                        })
                        .map((paymentMethod) => {
                          return (
                            <PaymentContainer
                              paymentInfoMap={paymentInfoMap}
                              paymentProviderId={paymentMethod.id}
                              key={paymentMethod.id}
                              selectedPaymentOptionId={selectedPaymentMethod}
                              cart={cart}
                            />
                          )
                        })}
                    </RadioGroup>



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
