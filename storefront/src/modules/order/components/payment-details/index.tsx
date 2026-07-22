import { isStripe, isManual, paymentInfoMap } from "@lib/constants"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0]?.payments?.[0]

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-5 h-full">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Payment</h2>

      {payment ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment Method</p>
            <div className="flex items-center gap-2 text-gray-900">
              <div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 flex-shrink-0 text-gray-500">
                {paymentInfoMap[payment.provider_id]?.icon}
              </div>
              <p className="text-sm font-medium" data-testid="payment-method">
                {paymentInfoMap[payment.provider_id]?.title || payment.provider_id}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payment Details</p>
            <p className="text-sm text-gray-900" data-testid="payment-amount">
              {isManual(payment.provider_id) ? (
                "To be paid on delivery"
              ) : isStripe(payment.provider_id) && payment.data?.card_last4 ? (
                `**** **** **** ${payment.data.card_last4}`
              ) : (
                `${convertToLocale({
                  amount: payment.amount,
                  currency_code: order.currency_code,
                })} paid at ${new Date(payment.created_at ?? "").toLocaleDateString()}`
              )}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No payment details available.</p>
      )}
    </div>
  )
}

export default PaymentDetails
