import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  items?: HttpTypes.StoreCartLineItem[]
}

const ItemsTemplate = ({ items }: ItemsTemplateProps) => {
  return (
    <div>
      <div className="pb-6 flex items-center justify-between border-b border-gray-100">
        <h1 className="text-[32px] font-bold tracking-tight text-black">Your Cart</h1>
        {items && (
          <span className="text-sm text-gray-400 font-medium">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        )}
      </div>
      <div className="mt-6 flex flex-col gap-5">
        {items
          ? items
              .sort((a, b) => {
                return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
              })
              .map((item) => {
                return <Item key={item.id} item={item} />
              })
          : repeat(5).map((i) => {
              return (
                <div key={i} className="h-[140px] bg-gray-50 rounded-2xl animate-pulse" />
              )
            })}
      </div>
    </div>
  )
}

export default ItemsTemplate
