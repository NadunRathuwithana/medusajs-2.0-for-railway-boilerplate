import { getProductsList } from "@lib/data/products"
import { getPricesForVariant } from "@lib/util/get-product-price"
import FreeThirdList from "./list"

/** Bag qty in cart (packing / add-on rows don't count). */
export function bagQty(cart: any): number {
  return (cart?.items || [])
    .filter((i: any) => !i?.metadata?.packing)
    .reduce((n: number, i: any) => n + (i.quantity || 0), 0)
}

/** "Buy 2, get the 3rd free" nudge: shown when the cart holds exactly 2 bags. */
export default async function FreeThird({ cart }: { cart: any }) {
  if (bagQty(cart) !== 2) return null
  const countryCode = cart?.shipping_address?.country_code || "lk"
  const { response } = await getProductsList({
    countryCode,
    queryParams: { limit: 24 } as any,
  }).catch(() => ({ response: { products: [] as any[] } }))

  const options = response.products
    .map((p: any) => {
      const v = (p.variants || []).find(
        (v: any) => v.allow_backorder || !v.manage_inventory || (v.inventory_quantity ?? 0) > 0
      )
      const price = v ? getPricesForVariant(v) : null
      if (!v || !price) return null
      return {
        variantId: v.id,
        title: p.title,
        handle: p.handle,
        thumbnail: p.thumbnail,
        price: price.calculated_price,
      }
    })
    .filter(Boolean)
    .slice(0, 12) as any[]

  if (!options.length) return null
  return <FreeThirdList options={options} countryCode={countryCode} />
}
