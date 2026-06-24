"use client"

import { convertToLocale } from "@lib/util/money"
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

  const fmt = (amount: number) => convertToLocale({ amount, currency_code })

  return (
    <div className="flex flex-col gap-y-2 text-[13px]">
      {/* Line items */}
      <div className="flex items-center justify-between">
        <span className="text-gray-500">Subtotal</span>
        <span className="text-gray-800 font-medium" data-testid="cart-subtotal">
          {fmt(subtotal ?? 0)}
        </span>
      </div>

      {!!discount_total && (
        <div className="flex items-center justify-between">
          <span className="text-green-700">Discount</span>
          <span className="text-green-700 font-medium" data-testid="cart-discount">
            -{fmt(discount_total)}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-gray-500">Shipping</span>
        <span className="text-gray-800 font-medium" data-testid="cart-shipping">
          {shipping_total ? fmt(shipping_total) : (
            <span className="text-gray-400 italic text-[12px]">Calculated at next step</span>
          )}
        </span>
      </div>

      {/* <div className="flex items-center justify-between">
        <span className="text-gray-500">Taxes</span>
        <span className="text-gray-800 font-medium" data-testid="cart-taxes">
          {fmt(tax_total ?? 0)}
        </span>
      </div> */}

      {!!gift_card_total && (
        <div className="flex items-center justify-between">
          <span className="text-green-700">Gift card</span>
          <span className="text-green-700 font-medium" data-testid="cart-gift-card-amount">
            -{fmt(gift_card_total)}
          </span>
        </div>
      )}

      {/* Total */}
      <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-200">
        <span className="text-[15px] font-bold text-gray-900">Total</span>
        <span
          className="text-[22px] font-bold text-gray-900 tracking-tight"
          data-testid="cart-total"
        >
          {fmt(total ?? 0)}
        </span>
      </div>
    </div>
  )
}

export default CartTotals
