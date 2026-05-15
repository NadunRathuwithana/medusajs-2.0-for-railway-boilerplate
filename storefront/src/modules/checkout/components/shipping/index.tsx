"use client"

import { RadioGroup } from "@headlessui/react"
import { CheckCircleSolid } from "@medusajs/icons"
import { clx } from "@medusajs/ui"

import Radio from "@modules/common/components/radio"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { setShippingMethod } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const selectedShippingMethod = availableShippingMethods?.find(
    (method) => method.id === cart.shipping_methods?.at(-1)?.shipping_option_id
  )

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const set = async (id: string) => {
    setIsLoading(true)
    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <h2
          className={clx(
            "flex flex-row text-[24px] font-bold text-black gap-x-2 items-center",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          Delivery
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid className="text-green-500 w-6 h-6" />
          )}
        </h2>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <button
              onClick={handleEdit}
              className="text-[14px] font-medium text-gray-500 hover:text-black transition-colors"
              data-testid="edit-delivery-button"
            >
              Edit
            </button>
          )}
      </div>
      
      {isOpen ? (
        <div data-testid="delivery-options-container">
          <div className="pb-8">
            <RadioGroup value={selectedShippingMethod?.id} onChange={set} className="flex flex-col gap-3">
              {availableShippingMethods?.map((option) => {
                const isSelected = option.id === selectedShippingMethod?.id
                return (
                  <RadioGroup.Option
                    key={option.id}
                    value={option.id}
                    data-testid="delivery-option-radio"
                    className={clx(
                      "flex items-center justify-between cursor-pointer p-5 border rounded-2xl transition-colors hover:bg-gray-50",
                      {
                        "border-black bg-gray-50": isSelected,
                        "border-gray-200 bg-white": !isSelected,
                      }
                    )}
                  >
                    <div className="flex items-center gap-x-4">
                      <Radio checked={isSelected} />
                      <span className="text-[15px] font-medium text-gray-900">{option.name}</span>
                    </div>
                    <span className="text-[15px] font-bold text-gray-900">
                      {convertToLocale({
                        amount: option.amount!,
                        currency_code: cart?.currency_code,
                      })}
                    </span>
                  </RadioGroup.Option>
                )
              })}
            </RadioGroup>
          </div>

          <ErrorMessage
            error={error}
            data-testid="delivery-option-error-message"
          />

          <div className="mt-6">
            <button
              className="w-full md:w-auto px-8 h-[50px] bg-[#111111] hover:bg-black text-white rounded-[12px] font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              onClick={handleSubmit}
              disabled={!cart.shipping_methods?.[0] || isLoading}
              data-testid="submit-delivery-option-button"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                "Continue to payment"
              )}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-sm text-gray-600">
            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
              <div className="flex flex-col w-1/3">
                <span className="font-semibold text-black mb-2">Method</span>
                <span>
                  {selectedShippingMethod?.name}{" "}
                  {convertToLocale({
                    amount: selectedShippingMethod?.amount!,
                    currency_code: cart?.currency_code,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="h-px w-full bg-gray-100 my-8" />
    </div>
  )
}

export default Shipping
