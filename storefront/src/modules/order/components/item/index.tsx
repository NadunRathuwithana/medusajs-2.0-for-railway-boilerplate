import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
}

const Item = ({ item }: ItemProps) => {
  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl w-full" data-testid="product-row">
      <div className="w-16 flex-shrink-0">
        <Thumbnail thumbnail={item.thumbnail} size="square" className="rounded-md" />
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <Text
          className="text-base font-semibold text-gray-900"
          data-testid="product-name"
        >
          {item.title}
        </Text>
        {item.variant && (
          <div className="mt-1">
            <LineItemOptions variant={item.variant} data-testid="product-variant" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-end justify-center">
        <span className="flex gap-x-1 items-center text-sm">
          <Text className="text-gray-500 font-medium">
            <span data-testid="product-quantity">{item.quantity}</span>x{" "}
          </Text>
          <LineItemUnitPrice item={item} style="tight" />
        </span>
        <div className="mt-1 font-semibold text-gray-900">
          <LineItemPrice item={item} style="tight" />
        </div>
      </div>
    </div>
  )
}

export default Item
