"use server"

import { getProductsListWithSort } from "@lib/data/products"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { HttpTypes } from "@medusajs/types"

const PRODUCT_LIMIT = 12

/**
 * Fetches one more page (12 products) for the store page's infinite scroll.
 * Server Action so the client component can call it directly without a
 * dedicated API route.
 */
export async function loadMoreStoreProducts({
  page,
  sortBy,
  countryCode,
}: {
  page: number
  sortBy: SortOptions
  countryCode: string
}): Promise<{ products: HttpTypes.StoreProduct[]; count: number }> {
  const {
    response: { products, count },
  } = await getProductsListWithSort({
    page,
    queryParams: { limit: PRODUCT_LIMIT },
    sortBy,
    countryCode,
  })

  return { products, count }
}
