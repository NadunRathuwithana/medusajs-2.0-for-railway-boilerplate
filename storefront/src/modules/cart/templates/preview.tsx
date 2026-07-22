"use client"

import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  items?: HttpTypes.StoreCartLineItem[]
}

const ItemsPreviewTemplate = ({ items }: ItemsTemplateProps) => {
  const hasOverflow = items && items.length > 4

  return (
    <div
      className={clx({
        "overflow-y-auto overflow-x-hidden no-scrollbar max-h-[420px]":
          hasOverflow,
      })}
    >
      <div className="flex flex-col gap-4" data-testid="items-table">
        {items
          ? items
              .sort((a, b) => {
                return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
              })
              .map((item) => {
                return <Item key={item.id} item={item} type="preview" />
              })
          : repeat(5).map((i) => {
              return (
                <div key={i} className="h-[90px] bg-gray-50 rounded-xl animate-pulse" />
              )
            })}
      </div>
    </div>
  )
}

export default ItemsPreviewTemplate
