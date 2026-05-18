import { Heading } from "@medusajs/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"

const CheckoutSummary = ({ cart }: { cart: any }) => {
  return (
    <div className="sticky top-0 flex flex-col gap-y-6">
      <div className="flex flex-col">
        <h2 className="text-[24px] font-bold text-bold tracking-tight mb-2">
          Order Summary
        </h2>
        
        <div className="h-px w-full bg-gray-100 my-4" />
        
        <CartTotals totals={cart} />
        
        <div className="h-px w-full bg-gray-100 my-4" />
        
        <div className="mb-4">
          <ItemsPreviewTemplate items={cart?.items} />
        </div>
        
        <div className="mt-2">
          <DiscountCode cart={cart} />
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary
