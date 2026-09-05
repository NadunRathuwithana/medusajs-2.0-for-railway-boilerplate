import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getRegion } from "./regions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { sortProducts } from "@lib/util/sort-products"
import { withRetry, nextFetchOptions } from "@lib/util/with-retry"

// See lib/data/regions.ts for why `revalidate` (not just `tags`) matters on
// Next 15 — without it these product reads were live, uncached backend
// round-trips on every single page load.
const PRODUCTS_REVALIDATE_SECONDS = 300

export const getProductsById = cache(async function ({
  ids,
  regionId,
}: {
  ids: string[]
  regionId: string
}) {
  return withRetry(() =>
    sdk.store.product
      .list(
        {
          id: ids,
          region_id: regionId,
          fields: "*variants.calculated_price,+variants.inventory_quantity,*variants.images",
        },
        nextFetchOptions(["products"], PRODUCTS_REVALIDATE_SECONDS)
      )
      .then(({ products }) => {
        return products
      })
  )
})

export const getProductByHandle = cache(async function (
  handle: string,
  regionId: string
) {
  return withRetry(() =>
    sdk.store.product
      .list(
        {
          handle,
          region_id: regionId,
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,+variants.weight,+variants.length,+variants.height,+variants.width,+variants.metadata,*variants.images,+metadata",
        },
        nextFetchOptions(["products"], PRODUCTS_REVALIDATE_SECONDS)
      )
      .then(({ products }) => {
        return products[0]
      })
  )
})

export const getProductsList = cache(async function ({
  pageParam = 1,
  queryParams,
  countryCode,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> {
  const limit = queryParams?.limit || 12
  const validPageParam = Math.max(pageParam, 1);
  const offset = (validPageParam - 1) * limit
  const region = await getRegion(countryCode)

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }
  return withRetry(() =>
    sdk.store.product
      .list(
        {
          limit,
          offset,
          region_id: region.id,
          fields: "*variants.calculated_price,+variants.inventory_quantity,*variants.images",
          ...queryParams,
        },
        nextFetchOptions(["products"], PRODUCTS_REVALIDATE_SECONDS)
      )
      .then(({ products, count }) => {
        const nextPage = count > offset + limit ? pageParam + 1 : null

        return {
          response: {
            products,
            count,
          },
          nextPage: nextPage,
          queryParams,
        }
      })
  )
})

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const getProductsListWithSort = cache(async function ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> {
  const limit = queryParams?.limit || 12

  const {
    response: { products, count },
  } = await getProductsList({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  const pageParam = (page - 1) * limit

  const nextPage = count > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
})
