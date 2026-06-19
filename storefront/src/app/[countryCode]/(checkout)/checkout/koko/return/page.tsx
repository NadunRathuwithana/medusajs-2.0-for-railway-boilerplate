import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Koko Payment | Cardle",
  description: "Koko payment result",
}

type Props = {
  searchParams: Promise<{
    orderId?: string
    trnId?: string
    status?: "SUCCESS" | "FAILURE" | "CANCELED"
  }>
}

/**
 * Koko _returnUrl handler.
 *
 * Koko redirects the customer's browser here after payment completes or fails.
 * Query params appended by Koko: orderId, trnId, status
 *
 * IMPORTANT: per Koko docs, don't fully trust these redirect params alone —
 * the authoritative confirmation is the signed _responseUrl server webhook,
 * which triggers authorizePayment → orderView verification on the backend.
 */
export default async function KokoReturnPage({ searchParams }: Props) {
  const params = await searchParams
  const { orderId, status } = params

  const isSuccess = status === "SUCCESS"

  return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <div className="mb-6">
        <div
          className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
            isSuccess ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {isSuccess ? (
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
          ) : (
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>
      </div>

      <h1 className="text-2xl font-semibold mb-4">
        {isSuccess ? "Payment Successful 🎉" : "Payment Failed"}
      </h1>

      <p className="text-gray-600 mb-2">
        {isSuccess
          ? "Your order is confirmed. Koko will send you instalment reminders."
          : "Something went wrong with your Koko payment. Please try again or use another payment method."}
      </p>

      {orderId && (
        <p className="text-sm text-gray-400 mt-2">Order ref: {orderId}</p>
      )}

      <a
        href={isSuccess ? "/account/orders" : "/checkout"}
        className="mt-8 inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
      >
        {isSuccess ? "View My Orders" : "Back to Checkout"}
      </a>
    </div>
  )
}
