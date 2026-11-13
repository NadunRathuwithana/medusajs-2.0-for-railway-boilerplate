"use client"

import { Button, Heading } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { Lock } from "lucide-react"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const blocked = (cart.items ?? []).some((i: any) => !!i?.stock_issue)
  return (
    <div className="flex flex-col gap-y-4 sm:gap-y-6">
      <h2 className="text-[20px] sm:text-[24px] font-bold text-bold tracking-tight">
        Order Summary
      </h2>
      
      <div className="cart-totals-wrapper">
        <CartTotals totals={cart} />
      </div>
      
      {blocked && (
        <p className="text-[13px] text-red-600">
          Some items in your cart are sold out or low on stock. Please update them before checking out.
        </p>
      )}
      {blocked ? (
        <button disabled className="w-full mt-4 h-[60px] bg-gray-300 text-white rounded-[16px] flex items-center justify-center gap-2 font-medium text-[16px] cursor-not-allowed">
          <Lock className="w-4 h-4" />
          Check out
        </button>
      ) : (
      <LocalizedClientLink
        href="/checkout"
        data-testid="checkout-button"
        className="w-full mt-4"
      >
        <button className="w-full h-[60px] bg-[#111111] hover:bg-black text-white rounded-[16px] flex items-center justify-center gap-2 font-medium text-[16px] transition-colors shadow-lg">
          <Lock className="w-4 h-4" />
          Check out
        </button>
      </LocalizedClientLink>
      )}
    </div>
  )
}

export default Summary
