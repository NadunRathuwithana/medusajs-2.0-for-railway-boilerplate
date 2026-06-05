import { redirect } from "next/navigation"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "OnePay Payment",
  description: "Processing your OnePay payment",
}

type Props = {
  searchParams: Promise<{
    ipg_transaction_id?: string
    status?: string
    reference?: string
  }>
}

export default async function OnepayReturnPage({ searchParams }: Props) {
  const params = await searchParams
  const { ipg_transaction_id, status, reference } = params

  // Basic guard — real verification happens via webhook on backend
  // The webhook fires before the redirect in most cases
  if (!ipg_transaction_id) {
    redirect("/checkout?error=payment_cancelled")
  }

  // If status param indicates failure
  if (status && status !== "SUCCESS") {
    redirect("/checkout?error=payment_failed")
  }

  // Payment looks good — show order confirmation
  // The actual order capture is handled by the webhook
  return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>
      <h1 className="text-2xl font-semibold mb-4">Payment Successful 🎉</h1>
      <p className="text-gray-600 mb-2">
        Your order is confirmed. You&apos;ll receive an email shortly.
      </p>
      {reference && (
        <p className="text-sm text-gray-400 mt-2">
          Order ref: {reference}
        </p>
      )}
      <a
        href="/account/orders"
        className="mt-8 inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
      >
        View My Orders
      </a>
    </div>
  )
}
