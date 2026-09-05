import { sdk } from "@lib/config"
import { cache } from "react"
import { getProductsList } from "./products"
import { HttpTypes } from "@medusajs/types"
import { withRetry, nextFetchOptions } from "@lib/util/with-retry"

// See regions.ts for why `revalidate` (not just `tags`) matters on Next 15.
const COLLECTIONS_REVALIDATE_SECONDS = 300

export const retrieveCollection = cache(async function (id: string) {
  return withRetry(() =>
    sdk.store.collection
      .retrieve(
        id,
        {},
        nextFetchOptions(["collections"], COLLECTIONS_REVALIDATE_SECONDS)
      )
      .then(({ collection }) => collection)
  )
})

export const getCollectionsList = cache(async function (
  offset: number = 0,
  limit: number = 100
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> {
  return withRetry(() =>
    sdk.store.collection
      .list(
        { limit, offset: 0 },
        nextFetchOptions(["collections"], COLLECTIONS_REVALIDATE_SECONDS)
      )
      .then(({ collections }) => ({ collections, count: collections.length }))
  )
})

export const getCollectionByHandle = cache(async function (
  handle: string
): Promise<HttpTypes.StoreCollection> {
  return withRetry(() =>
    sdk.store.collection
      .list(
        { handle },
        nextFetchOptions(["collections"], COLLECTIONS_REVALIDATE_SECONDS)
      )
      .then(({ collections }) => collections[0])
  )
})

export const getCollectionsWithProducts = cache(
  async (countryCode: string): Promise<HttpTypes.StoreCollection[] | null> => {
    const { collections } = await getCollectionsList(0, 3)

    if (!collections) {
      return null
    }

    const collectionIds = collections
      .map((collection) => collection.id)
      .filter(Boolean) as string[]

    const { response } = await getProductsList({
      queryParams: { collection_id: collectionIds },
      countryCode,
    })

    response.products.forEach((product) => {
      const collection = collections.find(
        (collection) => collection.id === product.collection_id
      )

      if (collection) {
        if (!collection.products) {
          collection.products = []
        }

        collection.products.push(product as any)
      }
    })

    return collections as unknown as HttpTypes.StoreCollection[]
  }
)
