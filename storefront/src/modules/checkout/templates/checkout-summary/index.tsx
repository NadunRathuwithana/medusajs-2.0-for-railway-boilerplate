import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import { convertToLocale } from "@lib/util/money"

const CheckoutSummary = ({ cart }: { cart: any }) => {
  const itemCount = cart?.items?.reduce(
    (acc: number, item: any) => acc + item.quantity,
    0
  ) ?? 0

  return (
    <div className="sticky top-6 flex flex-col">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">
          Order summary
        </h2>
        <span className="text-[13px] text-gray-400 font-medium">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Items list */}
      <div className="mb-4">
        <ItemsPreviewTemplate items={cart?.items} />
      </div>

      {/* Promo code — sits just above the totals */}
      <div className="border border-dashed border-gray-200 rounded-xl px-4 py-3 mb-4 bg-gray-50/50">
        <DiscountCode cart={cart} />
      </div>

      {/* Totals block */}
      <div className="bg-gray-50 rounded-2xl px-5 py-4">
        <CartTotals totals={cart} />
      </div>
    </div>
  )
}

export default CheckoutSummary
