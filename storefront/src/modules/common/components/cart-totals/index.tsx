"use client"

import { convertToLocale } from "@lib/util/money"
import { InformationCircleSolid } from "@medusajs/icons"
import { Tooltip } from "@medusajs/ui"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    shipping_total?: number | null
    discount_total?: number | null
    gift_card_total?: number | null
    currency_code: string
  }
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    subtotal,
    tax_total,
    shipping_total,
    discount_total,
    gift_card_total,
  } = totals

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-3 text-[14px]">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span className="text-bold font-medium" data-testid="cart-subtotal">
            {convertToLocale({ amount: subtotal ?? 0, currency_code })}
          </span>
        </div>
        
        {!!discount_total && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Discount</span>
            <span className="text-[#e11d48] font-medium" data-testid="cart-discount">
              -{convertToLocale({ amount: discount_total ?? 0, currency_code })}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Shipping</span>
          <span className="text-bold font-medium" data-testid="cart-shipping">
            {convertToLocale({ amount: shipping_total ?? 0, currency_code })}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Taxes</span>
          <span className="text-bold font-medium" data-testid="cart-taxes">
            {convertToLocale({ amount: tax_total ?? 0, currency_code })}
          </span>
        </div>

        {!!gift_card_total && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Gift card</span>
            <span className="text-[#e11d48] font-medium" data-testid="cart-gift-card-amount">
              -{convertToLocale({ amount: gift_card_total ?? 0, currency_code })}
            </span>
          </div>
        )}
      </div>

      <div className="h-px w-full bg-gray-100 my-2" />
      
      <div className="flex items-center justify-between">
        <span className="text-[16px] font-bold text-bold">Total</span>
        <span className="text-[24px] font-bold text-bold tracking-tight" data-testid="cart-total">
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>
    </div>
  )
}

export default CartTotals
