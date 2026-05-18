"use client"

import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState, useEffect, useTransition, useRef } from "react"
import { Minus, Plus, Trash2 } from "lucide-react"
import { getPricesForVariant } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import { getPercentageDiff } from "@lib/util/get-precentage-diff"
import { clx } from "@medusajs/ui"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
}

const Item = ({ item, type = "full" }: ItemProps) => {
  const [error, setError] = useState<string | null>(null)
  const [optimisticQty, setOptimisticQty] = useState(item.quantity)
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestQtyRef = useRef(item.quantity)

  // Sync optimistic qty when server state arrives (and we're not mid-update)
  useEffect(() => {
    if (!isPending && !debounceRef.current) {
      setOptimisticQty(item.quantity)
    }
    latestQtyRef.current = item.quantity
  }, [item.quantity, isPending])

  const { handle } = item.variant?.product ?? {}

  const changeQuantity = (quantity: number) => {
    if (quantity < 1) return
    setError(null)
    setOptimisticQty(quantity)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      startTransition(async () => {
        await updateLineItem({
          lineId: item.id,
          quantity,
        }).catch((err) => {
          setError(err.message)
          setOptimisticQty(latestQtyRef.current)
        })
      })
    }, 500)
  }

  const { currency_code, calculated_price_number, original_price_number } = getPricesForVariant(item.variant) ?? {}
  const adjustmentsSum = (item.adjustments || []).reduce((acc: number, adj: any) => adj.amount + acc, 0)
  const originalPrice = (original_price_number || 0) * optimisticQty
  const currentPrice = (calculated_price_number || 0) * optimisticQty - adjustmentsSum
  const hasReducedPrice = currentPrice < originalPrice
  const formatPrice = (amount: number) => convertToLocale({ amount, currency_code: currency_code || "USD" })

  const isPreview = type === "preview"

  if (isPreview) {
    return (
      <div
        className="flex gap-4 items-center mb-4 group last:mb-0"
        data-testid="product-row"
      >
        {/* Image */}
        <LocalizedClientLink
          href={`/products/${handle}`}
          className="w-[64px] h-[64px] flex-shrink-0 bg-gray-50 relative rounded-lg overflow-hidden"
        >
          <Thumbnail
            thumbnail={item.thumbnail ?? item.variant?.product?.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>

        {/* Details */}
        <div className="flex flex-1 min-w-0 justify-between items-start">
          <div className="flex flex-col flex-1 min-w-0 pr-4">
            {/* Row 1: Name */}
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {item.title}
            </h3>
            
            {/* Row 2: Variant */}
            <LineItemOptions 
              variant={item.variant} 
              className="text-[13px] text-gray-500 mt-0.5" 
              data-testid="product-variant" 
            />
            
            {/* Row 3: Qty */}
            <span className="text-[13px] text-gray-500 mt-0.5">
              Qty: {item.quantity}
            </span>
          </div>
          
          {/* Price */}
          <div className="flex flex-col items-end flex-shrink-0">
            {hasReducedPrice ? (
              <>
                <span className="text-bold text-sm font-medium text-[#e11d48]">
                  {formatPrice(currentPrice)}
                </span>
                <span className="text-gray-400 text-xs line-through">
                  {formatPrice(originalPrice)}
                </span>
              </>
            ) : (
              <span className="text-bold text-sm font-medium">
                {formatPrice(currentPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex gap-5 p-5 bg-[#fafafa] rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors group"
      data-testid="product-row"
    >
      {/* 1:1 Image */}
      <LocalizedClientLink
        href={`/products/${handle}`}
        className="w-[120px] h-[120px] flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 relative aspect-square"
      >
        <Thumbnail
          thumbnail={item.thumbnail ?? item.variant?.product?.thumbnail}
          images={item.variant?.product?.images}
          size="square"
        />
      </LocalizedClientLink>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <LocalizedClientLink href={`/products/${handle}`}>
              <h3 className="text-[15px] font-semibold text-gray-900 leading-tight hover:text-gray-600 transition-colors truncate">
                {item.title}
              </h3>
            </LocalizedClientLink>
            <LineItemOptions variant={item.variant} className="text-[13px] text-gray-400" data-testid="product-variant" />
          </div>

          {/* Price block */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {hasReducedPrice ? (
              <>
                <span className="text-gray-400 text-[13px] line-through">
                  {formatPrice(originalPrice)}
                </span>
                <span className="text-[#e11d48] text-[16px] font-bold">
                  {formatPrice(currentPrice)}
                </span>
              </>
            ) : (
              <span className="text-bold text-[16px] font-bold">
                {formatPrice(currentPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Bottom row: discount badge + quantity + delete */}
        <div className="flex items-center justify-between mt-4">
          {/* Discount badge */}
          <div className="flex items-center gap-2">
            {hasReducedPrice && (
              <>
                <span className="bg-[#fce7f3] text-[#be185d] text-[11px] font-medium px-2.5 py-1 rounded-full">
                  {getPercentageDiff(originalPrice, currentPrice)}% off
                </span>
                <span className="bg-[#e11d48] text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
                  -{formatPrice(originalPrice - currentPrice)}
                </span>
              </>
            )}
          </div>

          {/* Quantity + Delete */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-full px-1 py-1 w-[100px] shadow-sm">
              <button
                onClick={() => changeQuantity(optimisticQty - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-bold transition-all disabled:opacity-40"
                disabled={optimisticQty <= 1}
              >
                <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
              <span className={`text-[14px] font-bold text-gray-900 w-5 text-center select-none transition-opacity ${isPending ? 'opacity-40' : ''}`}>
                {optimisticQty}
              </span>
              <button
                onClick={() => changeQuantity(optimisticQty + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>

            <DeleteButton
              id={item.id}
              className="text-gray-300 hover:text-[#e11d48] transition-colors"
              data-testid="product-delete-button"
            />
          </div>
        </div>

        <ErrorMessage error={error} data-testid="product-error-message" />
      </div>
    </div>
  )
}

export default Item
