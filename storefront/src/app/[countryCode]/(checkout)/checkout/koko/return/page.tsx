import { redirect } from "next/navigation"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Koko Payment",
  description: "Processing your Koko payment",
}

type Props = {
  searchParams: Promise<{
    order_id?: string
    merchant_reference?: string
  }>
}

export default async function KokoReturnPage({ searchParams }: Props) {
  const params = await searchParams
  const { order_id, merchant_reference } = params

  // Koko redirects to this success url. We show the order confirmation.
  // The actual order capture is handled via webhook.

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
        Thank you for your order. Koko will send you instalment reminders.
      </p>
      {merchant_reference && (
        <p className="text-sm text-gray-400 mt-2">
          Reference: {merchant_reference}
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
