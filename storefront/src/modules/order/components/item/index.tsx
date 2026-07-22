import { HttpTypes } from "@medusajs/types"
import { getPricesForVariant } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"

import LineItemOptions from "@modules/common/components/line-item-options"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
}

const Item = ({ item }: ItemProps) => {
  const productHandle = (item as any).variant?.product?.handle

  const prices = getPricesForVariant(item.variant)
  const currency_code = prices?.currency_code
  const unitPrice = prices?.calculated_price_number ?? 0
  const originalUnitPrice = prices?.original_price_number ?? 0

  const adjustmentsSum = (item.adjustments || []).reduce(
    (acc, adj) => adj.amount + acc,
    0
  )

  const totalPrice = unitPrice * item.quantity - adjustmentsSum
  const originalTotal = originalUnitPrice * item.quantity
  const hasDiscount = totalPrice < originalTotal

  const fmt = (amount: number) =>
    currency_code
      ? convertToLocale({ amount, currency_code })
      : `${amount}`

  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow" data-testid="product-row">
      {/* Image */}
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title ?? "Product"}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
      </div>

      {/* Title + Variant */}
      <div className="flex-1 min-w-0">
        {productHandle ? (
          <a
            href={`/products/${productHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-900 hover:underline hover:text-black transition-colors line-clamp-1"
            data-testid="product-name"
          >
            {item.title}
          </a>
        ) : (
          <p className="text-sm font-semibold text-gray-900 line-clamp-1" data-testid="product-name">
            {item.title}
          </p>
        )}
        {item.variant && (
          <div className="mt-0.5">
            <LineItemOptions variant={item.variant} data-testid="product-variant" />
          </div>
        )}
        {/* Unit price × qty */}
        <p className="text-xs text-gray-400 mt-1">
          {fmt(unitPrice)} × {item.quantity}
        </p>
      </div>

      {/* Pricing */}
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 text-right">
        {hasDiscount ? (
          <>
            <span className="text-xs text-gray-400 line-through" data-testid="product-original-price">
              {fmt(originalTotal)}
            </span>
            <span className="text-sm font-bold text-[#e11d48]" data-testid="product-price">
              {fmt(totalPrice)}
            </span>
          </>
        ) : (
          <span className="text-sm font-bold text-gray-900" data-testid="product-price">
            {fmt(totalPrice)}
          </span>
        )}
      </div>
    </div>
  )
}

export default Item
