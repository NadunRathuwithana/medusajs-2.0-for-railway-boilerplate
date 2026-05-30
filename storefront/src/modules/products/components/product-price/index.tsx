import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"

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

  return (
    <div className="flex flex-col text-ui-fg-base">
      <span
        className={clx("text-xl-semi font-bold", {
          "text-[#e11d48]": Number(selectedPrice.percentage_diff) > 0,
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
      {Number(selectedPrice.percentage_diff) > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span
            className="line-through text-gray-400 font-medium text-sm"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>
          <span className="bg-[#fce7f3] text-[#be185d] text-[11px] font-medium px-2.5 py-1 rounded-full">
            {selectedPrice.percentage_diff}% off
          </span>
          <span className="bg-[#e11d48] text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
            -{convertToLocale({ amount: selectedPrice.original_price_number - selectedPrice.calculated_price_number, currency_code: selectedPrice.currency_code })}
          </span>
        </div>
      )}
    </div>
  )
}
