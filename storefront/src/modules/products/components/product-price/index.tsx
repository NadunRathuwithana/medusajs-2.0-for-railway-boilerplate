import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  const hasDiscount = Number(selectedPrice.percentage_diff) > 0

  return (
    <div className="flex flex-col gap-0.5 text-ui-fg-base">
      {hasDiscount && (
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="line-through text-gray-400 font-medium text-xs sm:text-sm leading-none"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>
          <span className="bg-[#e11d48] text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wider">
            {selectedPrice.percentage_diff}% off
          </span>
        </div>
      )}
      <span
        className={clx("text-lg sm:text-xl font-bold leading-tight", {
          "text-[#e11d48]": hasDiscount,
          "text-gray-900": !hasDiscount,
        })}
      >
        {!variant && "From "}
        <span
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {selectedPrice.calculated_price}
        </span>
      </span>
    </div>
  )
}
