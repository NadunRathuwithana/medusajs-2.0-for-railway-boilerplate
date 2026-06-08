"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AnimatedOrderComplete from "@modules/order/components/animated-order-complete"
import { placeOrder } from "@lib/data/cart"
import { Button } from "@medusajs/ui"

export default function OnepayReturnClient({ 
  searchParams, 
  countryCode 
}: { 
  searchParams: any, 
  countryCode: string 
}) {
  const router = useRouter()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  const [message, setMessage] = useState("Please wait while we confirm your payment and place your order...")

  const transactionId = searchParams?.transaction_id
  const statusMessage = searchParams?.status_message

  useEffect(() => {
    // 1. Console log for the user to inspect in browser
    console.log("[OnePay Return] Received params:", searchParams)

    // 2. Validate params
    if (!transactionId) {
      console.error("[OnePay Return] No transaction_id received")
      setStatus("error")
      setMessage("No transaction ID received from OnePay. Payment cancelled or invalid callback.")
      return
    }

    if (statusMessage && statusMessage.toUpperCase() !== "SUCCESS") {
      console.error("[OnePay Return] Payment not successful:", statusMessage)
      setStatus("error")
      setMessage(`Payment was not successful. OnePay status: ${statusMessage}`)
      return
    }

    // 3. Attempt to place the order
    const processOrder = async () => {
      try {
        const cartRes = await placeOrder()
        // placeOrder internally redirects on success via Next.js redirect(), 
        // so this line usually won't be reached if it successfully places an order.
        // If we reach here, it means placeOrder returned without redirecting (e.g. cart completion failed).
        setStatus("error")
        setMessage("Payment succeeded, but we couldn't complete your order. Please contact support.")
        console.error("[OnePay Return] placeOrder resolved but did not redirect. Cart:", cartRes)
      } catch (err: any) {
        // If it's a redirect error (NEXT_REDIRECT), it means success but we can't catch it cleanly in a client component 
        // without it just navigating away, which is exactly what we want.
        // However, standard errors will be caught here:
        if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.includes("NEXT_REDIRECT")) {
           return // let the redirect happen
        }
        console.error("[OnePay Return] placeOrder error:", err)
        setStatus("error")
        setMessage(`Payment succeeded, but placing the order failed: ${err?.message || "Unknown error"}`)
      }
    }

    processOrder()
  }, [searchParams, transactionId, statusMessage])

  return (
    <div className="py-24 min-h-[calc(100vh-64px)] flex justify-center">
      <AnimatedOrderComplete status={status} message={message}>
        {status === "error" && (
          <div className="flex justify-center mt-6">
            <Button onClick={() => router.push(`/${countryCode}/checkout`)}>
              Return to Checkout
            </Button>
          </div>
        )}
      </AnimatedOrderComplete>
    </div>
  )
}
