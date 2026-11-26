"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import AnimatedOrderComplete from "@modules/order/components/animated-order-complete"
import { placeOrder } from "@lib/data/cart"
import { Button } from "@medusajs/ui"

import { checkOrderForCart } from "./actions"

export default function OnepayReturnClient({ 
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

  // Onepay's popup (Onepay.js) follows the redirect URL inside its iframe.
  // If we're framed, tell the checkout page underneath (it closes the popup
  // and finishes the order). If nothing answers, take over the full window.
  const inFrame = typeof window !== "undefined" && window.self !== window.top
  const [framed, setFramed] = useState(false)
  // Paid (or maybe paid) but no order yet: never show "Payment Failed" here.
  const [stuck, setStuck] = useState(false)

  const statusMessage = String(searchParams?.status_message || searchParams?.status || "").toUpperCase()
  const failed = ["FAILED", "CANCELLED", "0", "2"].includes(statusMessage)
  const txn: string | undefined =
    searchParams?.txn ||
    searchParams?.transaction_id ||
    searchParams?.onepay_transaction_id ||
    searchParams?.ipg_transaction_id ||
    undefined

  useEffect(() => {
    if (inFrame) {
      setFramed(true)
      try {
        window.parent.postMessage(
          { type: "cardle:onepay-return", failed, txn },
          window.location.origin
        )
      } catch {}
      const t = setTimeout(() => {
        try {
          window.top!.location.href = window.location.href
        } catch {}
      }, 4000)
      return () => clearTimeout(t)
    }
    // Prevent double-run in React strict mode
    if (hasRun.current) return
    hasRun.current = true

    if (failed) {
      setStatus("error")
      setMessage("Payment was cancelled or not completed. You have not been charged. Please try again.")
      import("./actions").then((actions) => {
        actions.resetPaymentSession().catch(console.error)
      })
      return
    }

    // Success path. The backend verifies every payment with Onepay (including
    // a link checkout replaced), so we just keep trying to finish the order:
    //   1. already placed by the webhook / reconcile job? -> confirmation page
    //   2. point the cart at the paid transaction (when we know it)
    //   3. complete the cart ourselves
    const processOrder = async () => {
      // Fast checks for a minute, then keep checking slowly for ~6 more minutes
      // (the safety job finishes stuck orders within 5) and redirect as soon
      // as the order exists.
      const fastUntil = Date.now() + 60_000
      const deadline = Date.now() + 7 * 60_000
      let attempt = 0
      let slow = false
      while (Date.now() < deadline) {
        attempt++
        // One fast request: verify with Onepay + create the order (or return
        // the order the server already made while the customer was away).
        try {
          const r = await fetch("/api/onepay/finish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ txn }),
          }).then((x) => x.json())
          if (r?.order_id) {
            window.location.replace(`/${r.country || countryCode}/order/confirmed/${r.order_id}`)
            return
          }
          if (r?.failed) {
            setStatus("error")
            setMessage("Payment was not completed. You have not been charged. Please try again.")
            return
          }
        } catch {}
        // No txn in the URL (older links): fall back to the order lookup.
        if (!txn) {
          try {
            const existingOrderId = await checkOrderForCart()
            if (existingOrderId) {
              const { clearCart } = await import("./actions")
              await clearCart()
              router.push(`/${countryCode}/order/confirmed/${existingOrderId}`)
              return
            }
            await placeOrder()
          } catch (err: any) {
            if (err?.digest?.startsWith?.("NEXT_REDIRECT") || err?.message?.includes?.("NEXT_REDIRECT")) return
          }
        }
        if (attempt === 1) {
          setMessage("Confirming your payment and placing your order. Please don't close this page.")
        }
        if (Date.now() > fastUntil && !slow) {
          slow = true
          setStuck(true)
          setMessage(
            "Your order is being created, it can take a minute. Please don't pay again and don't close this page. Your confirmation will also arrive by email."
          )
        }
        await new Promise((res) => setTimeout(res, Date.now() > fastUntil ? 10_000 : 1500))
      }
      setMessage(
        "We couldn't confirm your payment yet. If you were charged, please don't pay again: contact us on WhatsApp and we'll sort it out right away."
      )
    }

    processOrder()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (framed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Finishing up...
      </div>
    )
  }

  return (
    <div className="py-24 min-h-[calc(100vh-64px)] flex justify-center">
      <AnimatedOrderComplete
        status={status}
        message={message}
        title={stuck ? "Confirming your payment" : status === "error" ? "Payment not completed" : undefined}
      >
        {(status === "error" || stuck) && (
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
