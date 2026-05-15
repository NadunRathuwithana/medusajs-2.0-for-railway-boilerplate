import { Metadata } from "next"
import { notFound } from "next/navigation"

import Wrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { enrichLineItems, retrieveCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { getCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Checkout",
}

const fetchCart = async () => {
  const cart = await retrieveCart()
  if (!cart) {
    return notFound()
  }

  if (cart?.items?.length) {
    const enrichedItems = await enrichLineItems(cart?.items, cart?.region_id!)
    cart.items = enrichedItems as HttpTypes.StoreCartLineItem[]
  }

  return cart
}

export default async function Checkout() {
  const cart = await fetchCart()
  const customer = await getCustomer()

  return (
    <div className="bg-[#fafafa] min-h-screen py-12 md:py-24">
      <div className="content-container max-w-[1140px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <Wrapper cart={cart}>
              <CheckoutForm cart={cart} customer={customer} />
            </Wrapper>
          </div>
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <div className="sticky top-24 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <CheckoutSummary cart={cart} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
