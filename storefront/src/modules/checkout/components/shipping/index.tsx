"use client"

import { RadioGroup } from "@headlessui/react"
import { CheckCircleSolid } from "@medusajs/icons"
import { clx } from "@medusajs/ui"

import Radio from "@modules/common/components/radio"
import ErrorMessage from "@modules/checkout/components/error-message"
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

  const selectedShippingMethod = availableShippingMethods?.find(
    (method) => method.id === cart.shipping_methods?.at(-1)?.shipping_option_id
  )

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
  }, [])

  // Auto-select the first shipping method if none is selected
  useEffect(() => {
    if (availableShippingMethods?.length && !selectedShippingMethod?.id && !isLoading) {
      set(availableShippingMethods[0].id)
    }
  }, [availableShippingMethods, selectedShippingMethod, isLoading])

  // If no address is set, we don't show the shipping options as actionable
  const isAddressSet = !!cart.shipping_address?.country_code
  
  if (!isAddressSet) {
    return null
  }

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <h2 className="flex flex-row text-[24px] font-bold text-bold gap-x-2 items-center">
          Delivery
          {cart.shipping_methods?.length ? (
            <CheckCircleSolid className="text-green-500 w-6 h-6" />
          ) : null}
        </h2>
      </div>
      
      <div data-testid="delivery-options-container">
          <div className="pb-8">
            <RadioGroup value={selectedShippingMethod?.id ?? ""} onChange={set} className="flex flex-col gap-3">
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
        </div>
      <div className="h-px w-full bg-gray-100 my-8" />
    </div>
  )
}

export default Shipping
