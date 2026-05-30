import { Button } from "@medusajs/ui"
import { useMemo } from "react"

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

  return (
    <div
      className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md mb-3"
      data-testid="order-card"
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
        {order.items && order.items.length > 0 && order.items[0].thumbnail ? (
          <img
            src={order.items[0].thumbnail}
            alt={order.items[0].title ?? "Order item"}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
      </div>

      <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p
            className="font-semibold text-sm text-gray-900"
            data-testid="order-display-id"
          >
            Order #{order.display_id}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span data-testid="order-created-at">
              {new Date(order.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span>•</span>
            <span>
              {numberOfLines} {numberOfLines === 1 ? "item" : "items"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
          <p
            className="font-medium text-sm text-gray-900"
            data-testid="order-amount"
          >
            {convertToLocale({
              amount: order.total,
              currency_code: order.currency_code,
            })}
          </p>
          <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
            <Button
              data-testid="order-details-link"
              variant="secondary"
              className="rounded-lg px-4 py-1.5 bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100 font-medium transition-colors text-xs"
            >
              View
            </Button>
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

export default OrderCard
