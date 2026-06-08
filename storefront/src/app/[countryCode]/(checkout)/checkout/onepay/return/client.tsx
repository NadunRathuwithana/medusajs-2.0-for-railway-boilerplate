"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AnimatedOrderComplete from "@modules/order/components/animated-order-complete"
import { placeOrder } from "@lib/data/cart"
import { Button } from "@medusajs/ui"

import { checkOrderForCart } from "./actions"

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
      let retries = 5;
      
      while (retries > 0) {
        try {
          // Check if webhook already completed the order!
          const existingOrderId = await checkOrderForCart()
          if (existingOrderId) {
             console.log("[OnePay Return] Order already exists (webhook won the race)!", existingOrderId)
             router.push(`/${countryCode}/order/confirmed/${existingOrderId}`)
             return
          }

          const cartRes = await placeOrder()
          // placeOrder internally redirects on success via Next.js redirect(), 
          // so this line usually won't be reached if it successfully places an order.
          // If we reach here, it means placeOrder returned without redirecting (e.g. cart completion failed).
          console.warn(`[OnePay Return] placeOrder resolved but did not redirect. Retries left: ${retries - 1}. Cart:`, cartRes)
        } catch (err: any) {
          // If it's a redirect error (NEXT_REDIRECT), it means success but we can't catch it cleanly in a client component 
          if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.includes("NEXT_REDIRECT")) {
             return // let the redirect happen
          }
          console.warn(`[OnePay Return] placeOrder error (retrying...):`, err)
          
          // Check one more time if the error was because the cart was completed by the webhook
          const existingOrderId = await checkOrderForCart()
          if (existingOrderId) {
             console.log("[OnePay Return] Order already exists after error!", existingOrderId)
             router.push(`/${countryCode}/order/confirmed/${existingOrderId}`)
             return
          }
        }
        
        // Wait 2.5 seconds before retrying to give the webhook time to process
        await new Promise(res => setTimeout(res, 2500))
        retries--;
      }

      // If we exhausted all retries
      setStatus("error")
      setMessage("Payment succeeded, but we couldn't complete your order in time. Please check your orders page or contact support.")
    }

    processOrder()
  }, [searchParams, transactionId, statusMessage, countryCode, router])

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
