"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import AnimatedOrderComplete from "@modules/order/components/animated-order-complete"
import { placeOrder } from "@lib/data/cart"
import { Button } from "@medusajs/ui"

import { checkOrderForCart } from "./actions"

export default function MintpayReturnClient({
  countryCode,
  isLoggedIn,
}: {
  countryCode: string
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  const [message, setMessage] = useState("Please wait while we confirm your payment and place your order...")
  const hasRun = useRef(false)

  useEffect(() => {
    // Prevent double-run in React strict mode
    if (hasRun.current) return
    hasRun.current = true

    // Mintpay's docs don't define any query params on the success_url redirect,
    // so — unlike Koko — there's nothing here worth trusting. The REAL payment
    // verification happens server-side: placeOrder() below runs Medusa's
    // complete-cart workflow, which calls MintpayPaymentService.authorizePayment,
    // which always live-polls Mintpay's status endpoint (Mintpay has no webhook,
    // so there's no cache to trust either). This page just needs to:
    //   1. Check whether the order already exists (e.g. the reconcile job beat us to it)
    //   2. OR try to complete the cart via placeOrder(), which re-verifies status
    //   3. Then redirect to the order confirmation page

    const processOrder = async () => {
      const MAX_RETRIES = 8

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const existingOrderId = await checkOrderForCart()
          if (existingOrderId) {
            const { clearCart } = await import("./actions")
            await clearCart()
            router.push(`/${countryCode}/order/confirmed/${existingOrderId}`)
            return
          }
        } catch (err) {
          console.warn("[Mintpay Return] checkOrderForCart error:", err)
        }

        try {
          // placeOrder() calls cart.complete() internally, which authorizes the
          // pending payment session (live status poll) before capturing.
          // On success it calls redirect(), which throws NEXT_REDIRECT.
          const cartRes = await placeOrder()
          console.warn(`[Mintpay Return] placeOrder returned without redirect. Attempt ${attempt}. Result:`, cartRes)
        } catch (err: any) {
          if (err?.digest?.startsWith?.("NEXT_REDIRECT") || err?.message?.includes?.("NEXT_REDIRECT")) {
            return // Let the redirect happen
          }
          console.warn(`[Mintpay Return] placeOrder error on attempt ${attempt}:`, err?.message || err)
        }

        // Wait before retrying — give Mintpay's status endpoint time to settle
        const waitMs = attempt <= 3 ? 2000 : 3000
        await new Promise((res) => setTimeout(res, waitMs))
      }

      console.error("[Mintpay Return] All retries exhausted")
      setStatus("error")
      setMessage("Payment was processed, but we couldn't confirm your order yet. Please check your orders page or contact support.")
    }

    processOrder()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="py-24 min-h-[calc(100vh-64px)] flex justify-center">
      <AnimatedOrderComplete status={status} message={message}>
        {status === "error" && (
          <div className="flex flex-col items-center gap-3 mt-6">
            <Button onClick={() => router.push(`/${countryCode}/account${isLoggedIn ? '/orders' : ''}`)}>
              Check My Orders
            </Button>
            <Button variant="secondary" onClick={() => router.push(`/${countryCode}/checkout`)}>
              Return to Checkout
            </Button>
          </div>
        )}
      </AnimatedOrderComplete>
    </div>
  )
}
