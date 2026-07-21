import { Metadata } from "next"
import { notFound } from "next/navigation"

import Wrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import MobileCheckoutSummary from "@modules/checkout/components/mobile-checkout-summary"
import { getCart } from "@lib/data/cart"
import { getCustomer } from "@lib/data/customer"
import BackButton from "@modules/common/components/back-button"

export const metadata: Metadata = {
  title: "Checkout",
}

import CheckoutTracker from "@components/analytics/CheckoutTracker"

export default async function Checkout() {
  const cart = await getCart()
  if (!cart) {
    notFound()
  }

  const customer = await getCustomer()

  return (
    <div className="bg-[#fafafa] min-h-screen py-12 md:py-24">
      <CheckoutTracker cart={cart} />
      <div className="content-container max-w-[1140px] mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>
        <MobileCheckoutSummary cart={cart} />
        
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <Wrapper cart={cart}>
              <CheckoutForm cart={cart} customer={customer} />
            </Wrapper>
          </div>
          <div className="hidden lg:block w-full lg:w-[400px] flex-shrink-0">
            <div className="sticky top-24 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <CheckoutSummary cart={cart} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
