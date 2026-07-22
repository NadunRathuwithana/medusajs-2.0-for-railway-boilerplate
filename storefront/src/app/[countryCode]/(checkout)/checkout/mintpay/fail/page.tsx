import { Metadata } from "next"
import { resetPaymentSession } from "../return/actions"

export const metadata: Metadata = {
  title: "Payment Failed | Cardle",
  description: "Mintpay payment failed or cancelled",
}

/**
 * Mintpay fail_url handler.
 *
 * Mintpay redirects the customer here if the payment was rejected or they
 * cancelled on Mintpay's payment page. Their cart is still intact — reset the
 * stuck Mintpay payment session so they get a fresh one on the next attempt.
 */
export default async function MintpayFailPage() {
  await resetPaymentSession().catch(() => {})

  return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-500"
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
        </div>
      </div>

      <h1 className="text-2xl font-semibold mb-4">Payment Failed</h1>
      <p className="text-gray-600 mb-6">
        Your Mintpay payment was declined or cancelled. Your cart is still
        saved — you can complete your order whenever you&apos;re ready.
      </p>

      <a
        href="/checkout"
        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
      >
        Return to Checkout
      </a>
    </div>
  )
}
