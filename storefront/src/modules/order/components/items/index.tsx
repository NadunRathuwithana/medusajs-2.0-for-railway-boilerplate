import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"

import Divider from "@modules/common/components/divider"
import Item from "@modules/order/components/item"

type ItemsProps = {
  items: HttpTypes.StoreCartLineItem[] | HttpTypes.StoreOrderLineItem[] | null
}

const SkeletonOrderLineItem = () => {
  return (
    <div className="flex gap-4 p-4 border border-gray-100 rounded-lg shadow-sm bg-white animate-pulse">
      <div className="w-16 h-20 bg-gray-200 rounded-md" />
      <div className="flex-1 flex flex-col justify-center gap-y-2">
        <div className="w-32 h-4 bg-gray-200 rounded-md" />
        <div className="w-24 h-4 bg-gray-200 rounded-md" />
      </div>
      <div className="flex flex-col items-end justify-center gap-y-2">
        <div className="w-16 h-4 bg-gray-200 rounded-md" />
        <div className="w-12 h-4 bg-gray-200 rounded-md" />
      </div>
    </div>
  )
}

const Items = ({ items }: ItemsProps) => {
  return (
    <div className="flex flex-col gap-y-4">
      <Divider className="!mb-0" />
      <div className="flex flex-col gap-4" data-testid="products-table">
        {items?.length
          ? items
              .sort((a, b) => {
                return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
              })
              .map((item) => {
                return <Item key={item.id} item={item} />
              })
          : repeat(5).map((i) => {
              return <SkeletonOrderLineItem key={i} />
            })}
      </div>
    </div>
  )
}

export default Items
