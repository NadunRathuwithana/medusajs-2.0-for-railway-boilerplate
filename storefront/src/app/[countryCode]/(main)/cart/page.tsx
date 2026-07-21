import { Metadata } from "next"
import CartTemplate from "@modules/cart/templates"

import { getCart } from "@lib/data/cart"
import { getCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Your Cart | Cardle",
  description: "Review your Cardle order before checkout.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function Cart() {
  const cart = await getCart()
  const customer = await getCustomer()

  return <CartTemplate cart={cart} customer={customer} />
}
