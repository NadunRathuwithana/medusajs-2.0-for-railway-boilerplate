"use client"

import { CheckCircleSolid } from "@medusajs/icons"
import { useToggleState } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import Spinner from "@modules/common/icons/spinner"

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

  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <h2 className="flex flex-row text-[24px] font-bold text-bold gap-x-2 items-center">
          Shipping Address
          {!isOpen && <CheckCircleSolid className="text-green-500 w-6 h-6" />}
        </h2>
        {!isOpen && cart?.shipping_address && (
          <button
            onClick={handleEdit}
            className="text-[14px] font-medium text-gray-500 hover:text-bold transition-colors"
            data-testid="edit-address-button"
          >
            Edit
          </button>
        )}
      </div>
      
      {isOpen ? (
        <form action={formAction}>
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
            
            <div className="mt-8">
              <SubmitButton 
                className="w-full md:w-auto px-8 h-[50px] bg-[#111111] hover:bg-black text-white rounded-[12px] font-medium transition-colors" 
                data-testid="submit-address-button"
              >
                Continue to delivery
              </SubmitButton>
            </div>
            
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div>
          <div className="text-sm text-gray-600">
            {cart && cart.shipping_address ? (
              <div className="flex flex-col md:flex-row gap-8">
                <div
                  className="flex flex-col flex-1"
                  data-testid="shipping-address-summary"
                >
                  <span className="font-semibold text-bold mb-2">Shipping Address</span>
                  <span>{cart.shipping_address.first_name} {cart.shipping_address.last_name}</span>
                  <span>{cart.shipping_address.address_1} {cart.shipping_address.address_2}</span>
                  <span>{cart.shipping_address.postal_code}, {cart.shipping_address.city}</span>
                  <span>{cart.shipping_address.country_code?.toUpperCase()}</span>
                </div>

                <div
                  className="flex flex-col flex-1"
                  data-testid="shipping-contact-summary"
                >
                  <span className="font-semibold text-bold mb-2">Contact</span>
                  <span>{cart.shipping_address.phone}</span>
                  <span>{cart.email}</span>
                </div>

                <div
                  className="flex flex-col flex-1"
                  data-testid="billing-address-summary"
                >
                  <span className="font-semibold text-bold mb-2">Billing Address</span>
                  {sameAsBilling ? (
                    <span>Same as shipping address</span>
                  ) : (
                    <>
                      <span>{cart.billing_address?.first_name} {cart.billing_address?.last_name}</span>
                      <span>{cart.billing_address?.address_1} {cart.billing_address?.address_2}</span>
                      <span>{cart.billing_address?.postal_code}, {cart.billing_address?.city}</span>
                      <span>{cart.billing_address?.country_code?.toUpperCase()}</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <Spinner />
              </div>
            )}
          </div>
        </div>
      )}
      <div className="h-px w-full bg-gray-100 my-8" />
    </div>
  )
}

export default Addresses
