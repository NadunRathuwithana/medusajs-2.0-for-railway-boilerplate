"use client"

import React, { useActionState, useState, useTransition } from "react"
import { Tag, X, ChevronDown, ChevronUp } from "lucide-react"

import { applyPromotions, submitPromotionForm } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "../error-message"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { promotions = [] } = cart

  const removePromotionCode = (code: string) => {
    setErrorMsg(null)
    startTransition(async () => {
      const remaining = promotions
        .filter((p) => p.code !== code && p.code !== undefined)
        .map((p) => p.code!)
      const res = await applyPromotions(remaining)
      if (res?.error) {
        setErrorMsg(res.error)
      }
    })
  }

  const addPromotionCode = () => {
    const code = inputValue.trim()
    if (!code) return
    setErrorMsg(null)
    startTransition(async () => {
      const existing = promotions
        .filter((p) => p.code !== undefined)
        .map((p) => p.code!)
      const res = await applyPromotions([...existing, code])
      if (res?.error) {
        setErrorMsg(res.error)
      } else {
        setInputValue("")
        setIsOpen(false)
      }
    })
  }

  const [message, formAction] = useActionState(submitPromotionForm, null)

  const hasPromos = promotions.length > 0

  return (
    <div className="w-full">
      {/* Applied codes — shown as tags above the input toggle */}
      {hasPromos && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {promotions.map((promotion) => {
            if (!promotion) return null;
            return (
            <div
              key={promotion.id}
              data-testid="discount-row"
              className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-800 text-[12px] font-medium rounded-full px-2.5 py-1"
            >
              <Tag className="w-3 h-3 flex-shrink-0" />
              <span data-testid="discount-code">{promotion.code}</span>
              {promotion.application_method?.value !== undefined && (
                <span className="text-green-600 ml-0.5">
                  {promotion.application_method.type === "percentage"
                    ? `(${promotion.application_method.value}% off)`
                    : `(${convertToLocale({
                        amount: Number(promotion.application_method.value),
                        currency_code:
                          promotion.application_method.currency_code ?? cart.currency_code,
                      })} off)`}
                </span>
              )}
              {!promotion.is_automatic && (
                <button
                  onClick={() => promotion.code && removePromotionCode(promotion.code)}
                  className="ml-0.5 text-green-600 hover:text-green-900 transition-colors"
                  data-testid="remove-discount-button"
                  aria-label="Remove promo code"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
          })}
        </div>
      )}

      {/* Toggle row */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-800 transition-colors"
        data-testid="add-discount-button"
      >
        <Tag className="w-3.5 h-3.5" />
        <span>{hasPromos ? "Add another code" : "Have a promo code?"}</span>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Inline input */}
      {isOpen && (
        <div className="mt-2">
          <form
            action={formAction}
            onSubmit={(e) => {
              e.preventDefault()
              addPromotionCode()
            }}
            className="flex gap-2"
          >
            <input
              id="promotion-input"
              name="code"
              type="text"
              autoComplete="off"
              placeholder="Enter code"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              className="flex-1 min-w-0 h-9 px-3 text-[13px] border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black focus:border-black focus:bg-white transition-colors placeholder:text-gray-400 font-mono tracking-widest"
              data-testid="discount-input"
              autoFocus
            />
            <button
              type="submit"
              disabled={isPending || !inputValue.trim()}
              className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              data-testid="discount-apply-button"
            >
              {isPending ? "…" : "Apply"}
            </button>
          </form>

          <ErrorMessage
            error={errorMsg || message}
            data-testid="discount-error-message"
          />
        </div>
      )}
    </div>
  )
}

export default DiscountCode
