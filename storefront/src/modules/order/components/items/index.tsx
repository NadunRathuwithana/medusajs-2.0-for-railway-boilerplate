import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"

import Item from "@modules/order/components/item"

type ItemsProps = {
  items: HttpTypes.StoreCartLineItem[] | HttpTypes.StoreOrderLineItem[] | null
}

const SkeletonOrderLineItem = () => {
  return (
    <div className="flex gap-4 p-4 border border-gray-100 rounded-xl bg-white animate-pulse">
      <div className="w-16 h-16 bg-gray-100 rounded-lg" />
      <div className="flex-1 flex flex-col justify-center gap-y-2">
        <div className="w-32 h-3 bg-gray-100 rounded-md" />
        <div className="w-24 h-3 bg-gray-100 rounded-md" />
      </div>
      <div className="flex flex-col items-end justify-center gap-y-2">
        <div className="w-16 h-3 bg-gray-100 rounded-md" />
        <div className="w-12 h-3 bg-gray-100 rounded-md" />
      </div>
    </div>
  )
}

const Items = ({ items }: ItemsProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Items</h2>
      <div className="flex flex-col gap-3" data-testid="products-table">
        {items?.length
          ? items
              .sort((a, b) => {
                return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
              })
              .map((item) => {
                return <Item key={item.id} item={item} />
              })
          : repeat(3).map((i) => {
              return <SkeletonOrderLineItem key={i} />
            })}
      </div>
    </div>
  )
}

export default Items
