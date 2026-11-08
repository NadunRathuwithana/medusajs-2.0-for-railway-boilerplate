"use client"

import CartTotals from "@modules/common/components/cart-totals"
import type { Packing } from "@lib/data/addons"
import { usePackingSelection, withPackingDelta } from "./packing-store"

export function LiveTotals({ cart, packing }: { cart: any; packing?: Packing }) {
  const { delta } = usePackingSelection(cart, packing)
  return <CartTotals totals={withPackingDelta(cart, delta)} />
}
