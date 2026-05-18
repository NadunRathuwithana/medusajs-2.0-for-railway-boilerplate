"use client"

import { Button, Heading } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { Lock } from "lucide-react"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="flex flex-col gap-y-6">
      <h2 className="text-[24px] font-bold text-bold tracking-tight">
        Order Summary
      </h2>
      
      <DiscountCode cart={cart} />
      
      <div className="h-px w-full bg-gray-100 my-2" />
      
      <div className="cart-totals-wrapper">
        <CartTotals totals={cart} />
      </div>
      
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
        className="w-full mt-4"
      >
        <button className="w-full h-[60px] bg-[#111111] hover:bg-black text-white rounded-[16px] flex items-center justify-center gap-2 font-medium text-[16px] transition-colors shadow-lg">
          <Lock className="w-4 h-4" />
          Check out
        </button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
