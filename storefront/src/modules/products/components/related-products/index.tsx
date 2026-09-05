import ProductCard from "@modules/products/components/product-card"
import { getRegion } from "@lib/data/regions"
import { getBnplProviders } from "@lib/data/payment"
import { getProductsList } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import ProductListTracker from "@components/analytics/ProductListTracker"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

type StoreProductParamsWithTags = HttpTypes.StoreProductParams & {
  is_giftcard?: boolean
  collection_id?: string[]
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // edit this function to define your related products logic
  const queryParams: StoreProductParamsWithTags = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }

  queryParams.is_giftcard = false

  let products: HttpTypes.StoreProduct[] = []

  try {
    const response = await getProductsList({
      queryParams,
      countryCode,
    })

    products = response.response.products.filter(
      (responseProduct) => responseProduct.id !== product.id
    )
  } catch (error: any) {
    console.error(
      `[RelatedProducts] Error fetching related products for ${product.id} with params:`,
      JSON.stringify(queryParams),
      error.message || error
    )
    products = []
  }

  // This section should always show 4 products — a collection with 4 or
  // fewer total products (this one included) previously left the grid
  // short, since the only source was "other products in the same
  // collection". Pad from the general catalog when needed, excluding this
  // product and anything already picked, so the count never drops below 4
  // as long as the store actually has enough inventory.
  if (products.length < 4) {
    try {
      const excludeIds = new Set([product.id, ...products.map((p) => p.id)])
      const fallbackQueryParams: StoreProductParamsWithTags & HttpTypes.FindParams = {
        region_id: region.id,
        is_giftcard: false,
        limit: 4 + excludeIds.size,
      }
      const fallbackResponse = await getProductsList({
        queryParams: fallbackQueryParams,
        countryCode,
      })
      const fallbackProducts = fallbackResponse.response.products.filter(
        (p) => !excludeIds.has(p.id)
      )
      products = [...products, ...fallbackProducts]
    } catch (error: any) {
      console.error(
        `[RelatedProducts] Fallback fetch failed for ${product.id}:`,
        error.message || error
      )
    }
  }

  if (!products.length) {
    return null
  }

  const bnplProviders = await getBnplProviders(region.id)

  const relatedProducts = products.slice(0, 4)

  const trackedItems = relatedProducts.map((p) => {
    const { cheapestPrice } = getProductPrice({ product: p })
    return {
      id: p.id!,
      name: p.title!,
      price: cheapestPrice?.calculated_price_number || 0,
    }
  })

  return (
    <div className="w-full">
      <ProductListTracker
        listId="related-products"
        listName="You Might Also Like"
        currency={region.currency_code.toUpperCase()}
        items={trackedItems}
      />

      <div className="flex flex-col items-center text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-bold mb-4">
          You Might Also Like
        </h2>
        <p className="text-sm text-gray-500 max-w-lg">
          Complete your look with these hand-picked items from our collection.
        </p>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
        {relatedProducts.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} bnplProviders={bnplProviders} />
          </li>
        ))}
      </ul>
    </div>
  )
}
