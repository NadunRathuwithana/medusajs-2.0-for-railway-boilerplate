import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const getAmount = (amount?: number | null) => {
    if (amount == null) return null
    return convertToLocale({ amount, currency_code: order.currency_code })
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Order Summary</h2>

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium text-gray-900">{getAmount(order.subtotal)}</span>
        </div>

        {order.discount_total > 0 && (
          <div className="flex items-center justify-between text-green-600">
            <span>Discount</span>
            <span>- {getAmount(order.discount_total)}</span>
          </div>
        )}

        {order.gift_card_total > 0 && (
          <div className="flex items-center justify-between text-green-600">
            <span>Gift Card</span>
            <span>- {getAmount(order.gift_card_total)}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-gray-500">Shipping</span>
          <span className="font-medium text-gray-900">{getAmount(order.shipping_total)}</span>
        </div>

        {order.tax_total != null && order.tax_total > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Taxes</span>
            <span className="font-medium text-gray-900">{getAmount(order.tax_total)}</span>
          </div>
        )}
      </div>

      <div className="h-px bg-gray-100" />

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">Total</span>
        <span className="text-base font-bold text-gray-900">{getAmount(order.total)}</span>
      </div>
    </div>
  )
}

export default OrderSummary
