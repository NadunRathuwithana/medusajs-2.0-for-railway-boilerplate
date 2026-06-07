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
  searchParams: Promise<{
    ipg_transaction_id?: string
    status?: string
    reference?: string
  }>
}

/**
 * OnePay redirects the customer back here after payment.
 *
 * IMPORTANT: Next.js redirect() throws a special NEXT_REDIRECT error internally.
 * We must re-throw it — otherwise the redirect is swallowed and the
 * order confirmed page never loads.
 */
export default async function OnepayReturnPage({ params, searchParams }: Props) {
  const resolvedParams = await params
  const sp = await searchParams
  const { ipg_transaction_id, status } = sp

  // Guard: if no transaction ID, OnePay didn't send us back properly
  if (!ipg_transaction_id) {
    redirect(`/${resolvedParams.countryCode}/checkout?error=payment_cancelled`)
  }

  // Guard: OnePay sent back a failure status
  if (status && status !== "SUCCESS") {
    redirect(`/${resolvedParams.countryCode}/checkout?error=payment_failed`)
  }

  // Complete the cart → creates the order → redirects to /order/confirmed/[id].
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
    console.error("OnePay return: placeOrder error:", err?.message)
    redirect(`/${resolvedParams.countryCode}/account/orders`)
  }

  // Unreachable — placeOrder always redirects on success
  redirect(`/${resolvedParams.countryCode}/account/orders`)
}
