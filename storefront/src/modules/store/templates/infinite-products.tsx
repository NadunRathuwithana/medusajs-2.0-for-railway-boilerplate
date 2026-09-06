import { getProductsListWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getBnplProviders } from "@lib/data/payment"
import { getProductPrice } from "@lib/util/get-product-price"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import InfiniteProductGrid from "@modules/store/components/infinite-product-grid"
import ProductListTracker from "@components/analytics/ProductListTracker"

const PRODUCT_LIMIT = 12

/**
 * Store page's product listing — infinite scroll (12 at a time) instead of
 * numbered pagination. Only the first page is server-rendered; everything
 * after that loads client-side via InfiniteProductGrid, which starts
 * fetching the next batch before the user scrolls far enough to notice.
 *
 * Deliberately a separate component from PaginatedProducts rather than a
 * shared change — PaginatedProducts is also used by search, collections,
 * and categories, and this was scoped to the store page specifically.
 */
export default async function InfiniteProducts({
  sortBy,
  countryCode,
}: {
  sortBy: SortOptions
  countryCode: string
}) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const [{ response: { products, count } }, bnplProviders] = await Promise.all([
    getProductsListWithSort({
      page: 1,
      queryParams: { limit: PRODUCT_LIMIT },
      sortBy,
      countryCode,
    }),
    getBnplProviders(region.id),
  ])

  const trackedItems = products.map((p) => {
    const { cheapestPrice } = getProductPrice({ product: p })
    return {
      id: p.id!,
      name: p.title!,
      price: cheapestPrice?.calculated_price_number || 0,
    }
  })

  return (
    <>
      <ProductListTracker
        listId="store"
        listName="All Products"
        currency={region.currency_code.toUpperCase()}
        items={trackedItems}
      />
      <InfiniteProductGrid
        // Remounts (resetting to page 1) whenever the sort changes, since
        // the accumulated client-side list is only valid for the sort it
        // was loaded under.
        key={sortBy}
        initialProducts={products}
        totalCount={count}
        sortBy={sortBy}
        countryCode={countryCode}
        bnplProviders={bnplProviders}
      />
    </>
  )
}
