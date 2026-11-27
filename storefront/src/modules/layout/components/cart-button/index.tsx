import { notFound } from "next/navigation"
import CartDropdown from "../cart-dropdown"
import { enrichLineItems, retrieveCart } from "@lib/data/cart"

const fetchCart = async () => {
  const cart = await retrieveCart().catch(() => null)

  if (!cart) {
    return null
  }

  if (cart?.items?.length) {
    // A products-endpoint blip must not take down every page: fall back to
    // the plain cart lines.
    try {
      cart.items = await enrichLineItems(cart.items, cart.region_id!)
    } catch {}
  }

  return cart
}

export default async function CartButton() {
  const cart = await fetchCart()

  return <CartDropdown cart={cart} />
}
