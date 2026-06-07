"use client"

import { CheckCircleSolid } from "@medusajs/icons"
import { useToggleState } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"
import debounce from "lodash/debounce"

import { setAddresses } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import { useActionState } from "react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const [message, formAction] = useActionState(setAddresses, null)

  const formRef = useRef<HTMLFormElement>(null)

  const debouncedSubmit = useRef(
    debounce(() => {
      if (formRef.current) {
        formRef.current.requestSubmit()
      }
    }, 1500)
  ).current

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <h2 className="flex flex-row text-[24px] font-bold text-bold gap-x-2 items-center">
          Shipping Address
          {cart?.shipping_address && <CheckCircleSolid className="text-green-500 w-6 h-6" />}
        </h2>
      </div>
      
      <form action={formAction} ref={formRef} onChange={debouncedSubmit}>
          <div className="pb-8">
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
            />

            {!sameAsBilling && (
              <div>
                <h2 className="text-[20px] font-bold text-bold pb-6 pt-8">
                  Billing address
                </h2>
                <BillingAddress cart={cart} />
              </div>
            )}
            
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      <div className="h-px w-full bg-gray-100 my-8" />
    </div>
  )
}

export default Addresses
