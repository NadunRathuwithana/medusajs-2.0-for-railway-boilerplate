import { Metadata } from "next"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { placeOrder } from "@lib/data/cart"

export const metadata: Metadata = {
  title: "OnePay Payment",
  description: "Processing your OnePay payment",
}

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

/**
 * OnePay redirects the customer back here after payment.
 *
 * OnePay browser redirect sends these query params:
 *   - transaction_id    (NOT ipg_transaction_id — that's from the session creation response)
 *   - status_message    "SUCCESS" | "FAILED" | "CANCELLED"
 *   - additional_data   the value we sent as additionalData (the session ID)
 *
 * IMPORTANT: Next.js redirect() throws a special NEXT_REDIRECT error internally.
 * We must re-throw it — otherwise the redirect is swallowed and the
 * order confirmed page never loads.
 */
export default async function OnepayReturnPage({ params, searchParams }: Props) {
  const resolvedParams = await params
  const sp = await searchParams
  const countryCode = resolvedParams.countryCode

  // Log all params OnePay sent back so we can debug if anything goes wrong
  console.log("[OnePay Return] searchParams:", JSON.stringify(sp))

  const transactionId = sp.transaction_id   // OnePay redirect uses transaction_id
  const statusMessage = sp.status_message   // "SUCCESS" | "FAILED" | "CANCELLED"

  // Guard: if no transaction_id, OnePay didn't send us back properly
  if (!transactionId) {
    console.error("[OnePay Return] No transaction_id received. Params:", sp)
    redirect(`/${countryCode}/checkout?error=payment_cancelled`)
  }

  // Guard: explicit failure from OnePay
  if (statusMessage && statusMessage !== "SUCCESS") {
    console.error("[OnePay Return] Payment not successful. status_message:", statusMessage)
    redirect(`/${countryCode}/checkout?error=payment_failed`)
  }

  // Complete the cart → Medusa calls authorizePayment() which polls OnePay
  // using the ipg_transaction_id stored in the payment session data.
  // placeOrder() internally calls redirect() which throws NEXT_REDIRECT.
  // We MUST re-throw that so Next.js can handle the navigation.
  try {
    await placeOrder()
  } catch (err: any) {
    // Re-throw Next.js redirect/not-found errors so they propagate correctly
    if (isRedirectError(err)) {
      throw err
    }
    // Real error (e.g. cart already completed, cart not found, network error)
    console.error("[OnePay Return] placeOrder error:", err?.message)
    redirect(`/${countryCode}/account/orders`)
  }

  // Unreachable — placeOrder always redirects on success
  redirect(`/${countryCode}/account/orders`)
}
