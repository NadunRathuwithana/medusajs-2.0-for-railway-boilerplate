import CartDropdown from "../cart-dropdown"
import { getCart } from "@lib/data/cart"

export default async function CartButton() {
  const cart = await getCart()

  return <CartDropdown cart={cart} />
}
