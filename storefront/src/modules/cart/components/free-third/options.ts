import { getProductsList } from "@lib/data/products"
import { getPricesForVariant } from "@lib/util/get-product-price"

/** Bag qty in cart (packing / add-on rows don't count). */
export function bagQty(cart: any): number {
  return (cart?.items || [])
    .filter((i: any) => !i?.metadata?.packing)
    .reduce((n: number, i: any) => n + (i.quantity || 0), 0)
}

export type FreeOption = { variantId: string; title: string; thumbnail?: string; price: string }

/** Totes the customer can pick free when the cart holds exactly 2 bags ([] otherwise). */
export async function getFreeThirdOptions(cart: any): Promise<FreeOption[]> {
  if (bagQty(cart) !== 2) return []
  // The promo frees the CHEAPEST bag, so only offer totes that cost no more
  // than the cheapest one already in the cart (what you pick is truly free).
  const cap = Math.min(
    ...(cart?.items || [])
      .filter((i: any) => !i?.metadata?.packing)
      .map((i: any) => Number(i.unit_price) || Infinity)
  )
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
      if (Number(price.calculated_price_number) > cap) return null
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

  return options
}
