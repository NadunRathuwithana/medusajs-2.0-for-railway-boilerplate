"use client"

import { clx } from "@medusajs/ui"
import PaymentButton from "../payment-button"
import { convertToLocale } from "@lib/util/money"

const Review = ({ cart }: { cart: any }) => {
  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const previousStepsCompleted =
    cart.shipping_address &&
    cart.shipping_methods.length > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-3">
        <h2 className="flex flex-row text-[24px] font-bold text-bold gap-x-2 items-center">
          Review & Place Order
        </h2>
      </div>
      {previousStepsCompleted && (
        <>
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

          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      )}
    </div>
  )
}

export default Review
