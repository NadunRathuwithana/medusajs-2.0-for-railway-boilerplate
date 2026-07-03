"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import AnimatedOrderComplete from "@modules/order/components/animated-order-complete"
import { placeOrder } from "@lib/data/cart"
import { Button } from "@medusajs/ui"

import { checkOrderForCart } from "./actions"

export default function KokoReturnClient({ 
  searchParams, 
  countryCode,
  isLoggedIn,
}: { 
  searchParams: any, 
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

    // Log all received params for debugging
    console.log("[Koko Return] Received ALL searchParams:", JSON.stringify(searchParams))

    const isSuccess = searchParams?.status === "SUCCESS"
    
    // Explicitly check for failure/cancellation statuses from Koko
    if (!isSuccess) {
      console.error("[Koko Return] Payment cancelled or failed:", searchParams?.status)
      setStatus("error")
      setMessage("Payment was cancelled or failed. Please try again.")
      // Reset the payment session so Medusa forces a fresh Koko link next time
      import("./actions").then((actions) => {
        actions.resetPaymentSession().catch(console.error)
      })
      return
    }

    // We do NOT validate the URL params strictly for success.
    // The REAL payment verification happens server-side via the webhook.
    // This page simply needs to:
    //   1. Wait for the webhook to complete the order
    //   2. OR try to complete the cart via placeOrder()
    //   3. Then redirect to the order confirmation page

    const processOrder = async () => {
      const MAX_RETRIES = 8
      
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`[Koko Return] Attempt ${attempt}/${MAX_RETRIES}`)
        
        try {
          // First: check if the webhook already completed the order
          const existingOrderId = await checkOrderForCart()
          if (existingOrderId) {
            console.log("[Koko Return] Order already exists (webhook completed it)!", existingOrderId)
            // Remove the cart cookie so a new cart is generated for the next purchase
            const { clearCart } = await import("./actions")
            await clearCart()
            router.push(`/${countryCode}/order/confirmed/${existingOrderId}`)
            return
          }
        } catch (err) {
          console.warn("[Koko Return] checkOrderForCart error:", err)
        }

        try {
          // Second: try to complete the cart ourselves via placeOrder()
          // placeOrder() calls cart.complete() internally.
          // If successful, it calls redirect() which throws NEXT_REDIRECT.
          const cartRes = await placeOrder()
          
          // If placeOrder returned without redirecting, it returned the cart
          // (meaning the cart wasn't ready to complete yet)
          console.warn(`[Koko Return] placeOrder returned without redirect. Attempt ${attempt}. Result:`, cartRes)
        } catch (err: any) {
          // NEXT_REDIRECT is thrown by Next.js redirect() — it means SUCCESS!
          if (err?.digest?.startsWith?.("NEXT_REDIRECT") || err?.message?.includes?.("NEXT_REDIRECT")) {
            console.log("[Koko Return] placeOrder triggered redirect (success!)")
            return // Let the redirect happen
          }
          console.warn(`[Koko Return] placeOrder error on attempt ${attempt}:`, err?.message || err)
        }

        // Wait before retrying — give the webhook time to process
        const waitMs = attempt <= 3 ? 2000 : 3000
        console.log(`[Koko Return] Waiting ${waitMs}ms before retry...`)
        await new Promise(res => setTimeout(res, waitMs))
      }

      // If we exhausted all retries, show error
      console.error("[Koko Return] All retries exhausted")
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
