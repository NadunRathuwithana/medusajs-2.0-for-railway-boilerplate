"use client"

import { clx } from "@medusajs/ui"
import PaymentButton from "../payment-button"
import { convertToLocale } from "@lib/util/money"
import { useLiveCheckout } from "@modules/checkout/context/live-checkout-context"

const Review = ({ cart }: { cart: any }) => {
  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (cart?.shipping_methods?.length ?? 0) !== 0 || paidByGiftcard

  // Same live (instant, no network) check PaymentButton uses to decide
  // whether the submit button is actually clickable, so the warning banner
  // and the button's own gating never disagree with each other.
  const { addressesComplete } = useLiveCheckout()
  const missingDetails = !addressesComplete

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-3">
        <h2 className="flex flex-row text-[24px] font-bold text-bold gap-x-2 items-center">
          Review & Place Order
        </h2>
      </div>

      {paymentReady && missingDetails && (
        <div className="mb-4 flex items-start gap-x-3 rounded-xl bg-orange-50 p-4 border border-orange-200">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-orange-500 shrink-0 mt-0.5">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-orange-800">Action Required</h3>
            <p className="text-sm text-orange-700 mt-1">
              Please complete your contact and address details (including a valid phone
              number) before proceeding.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-x-1 w-full mb-4">
        <div className="w-full">
          <p className="text-[14px] text-gray-500 leading-relaxed">
            By clicking the Place Order button, you confirm that you have
            read, understand and accept our Terms of Use, Terms of Sale and
            Returns Policy and acknowledge that you have read Medusa
            Store&apos;s Privacy Policy.
          </p>
        </div>
      </div>

      <div className="lg:hidden flex items-center justify-between mb-4 pt-4 border-t border-gray-100">
        <span className="text-base font-bold text-gray-900">Total</span>
        <span className="text-[20px] font-bold text-gray-900 tracking-tight">
          {convertToLocale({
            amount: cart.total ?? 0,
            currency_code: cart.currency_code,
          })}
        </span>
      </div>

      {/* Always rendered — PaymentButton disables itself and shows a loader
          based on the cart's own readiness, so the CTA never disappears. */}
      <PaymentButton cart={cart} data-testid="submit-order-button" />
    </div>
  )
}

export default Review
