"use client"

import { useState } from "react"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { convertToLocale } from "@lib/util/money"
import { ShoppingCart, ChevronDown, ChevronUp } from "lucide-react"

const MobileCheckoutSummary = ({ cart }: { cart: any }) => {
  const [isOpen, setIsOpen] = useState(false)

  const total = convertToLocale({
    amount: cart.total ?? 0,
    currency_code: cart.currency_code,
  })

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6 lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
      >
        <div className="flex items-center gap-2 text-gray-800 font-medium text-[13px]">
          <ShoppingCart className="w-4 h-4 text-gray-500" />
          {isOpen ? "Hide order summary" : "Show order summary"}
          <ChevronDown className={`w-3.5 h-3.5 ml-1 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </div>
        <span className="font-bold text-[18px] text-gray-900">{total}</span>
      </button>

      <div 
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-5 border-t border-gray-100">
          <CheckoutSummary cart={cart} />
        </div>
      </div>
    </div>
  )
}

export default MobileCheckoutSummary
