import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  const hasDiscount =
    price.calculated_price_number < price.original_price_number

  return (
    <div className="flex items-center gap-x-2">
      {hasDiscount && (
        <>
          <Text
            className="line-through text-ui-fg-muted"
            data-testid="original-price"
          >
            {price.original_price}
          </Text>
          <span className="text-[10px] bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-sm">
            -{price.percentage_diff}%
          </span>
        </>
      )}
      <Text
        className={clx("text-ui-fg-muted", {
          "text-ui-fg-interactive": hasDiscount,
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
    </div>
  )
}
