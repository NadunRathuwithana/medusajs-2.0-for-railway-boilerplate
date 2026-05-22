import { Button } from "@medusajs/ui"
import { useMemo } from "react"

import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(() => {
    return (
      order.items?.reduce((acc, item) => {
        return acc + item.quantity
      }, 0) ?? 0
    )
  }, [order])

  const numberOfProducts = useMemo(() => {
    return order.items?.length ?? 0
  }, [order])

  return (
    <div className="bg-white flex flex-col p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md mb-4" data-testid="order-card">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Order Placed</p>
          <p className="font-medium text-gray-900" data-testid="order-created-at">
            {new Date(order.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total</p>
          <p className="font-medium text-gray-900" data-testid="order-amount">
            {convertToLocale({
              amount: order.total,
              currency_code: order.currency_code,
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Order #</p>
          <p className="font-medium text-gray-900" data-testid="order-display-id">
            {order.display_id}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">{`${numberOfLines} ${
          numberOfLines > 1 ? "items" : "item"
        }`}</span>
      </div>

      <div className="grid grid-cols-2 small:grid-cols-4 gap-4 mb-6">
        {order.items?.slice(0, 3).map((i) => {
          return (
            <div
              key={i.id}
              className="flex flex-col gap-y-3"
              data-testid="order-item"
            >
              <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm aspect-square bg-gray-50">
                <Thumbnail thumbnail={i.thumbnail} images={[]} size="full" />
              </div>
              <div className="flex flex-col text-small-regular">
                <span
                  className="font-semibold text-gray-900 truncate"
                  data-testid="item-title"
                >
                  {i.title}
                </span>
                <span className="text-gray-500 text-sm mt-1" data-testid="item-quantity">Qty: {i.quantity}</span>
              </div>
            </div>
          )
        })}
        {numberOfProducts > 4 && (
          <div className="w-full aspect-square rounded-xl flex flex-col items-center justify-center bg-gray-50 border border-gray-100 shadow-sm text-gray-500 font-medium">
            <span className="text-lg">
              + {numberOfLines - 4}
            </span>
            <span className="text-sm">more</span>
          </div>
        )}
      </div>
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
          <Button data-testid="order-details-link" variant="secondary" className="rounded-xl px-6 py-2 bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 font-medium transition-colors shadow-sm">
            View Order Details
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderCard
