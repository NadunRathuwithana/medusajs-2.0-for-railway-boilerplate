import ProductCard from "@modules/products/components/product-card"
import { getRegion } from "@lib/data/regions"
import { getProductsList } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

type StoreProductParamsWithTags = HttpTypes.StoreProductParams & {
  tags?: string[]
}

type StoreProductWithTags = HttpTypes.StoreProduct & {
  tags?: { value: string }[]
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
  const productWithTags = product as StoreProductWithTags
  if (productWithTags.tags) {
    queryParams.tags = productWithTags.tags
      .map((t) => t.value)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const products = await getProductsList({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return response.products.filter(
      (responseProduct) => responseProduct.id !== product.id
    )
  })

  if (!products.length) {
    return null
  }

  return (
    <div className="w-full">
      <div className="flex flex-col items-center text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-black mb-4">
          You Might Also Like
        </h2>
        <p className="text-sm text-gray-500 max-w-lg">
          Complete your look with these hand-picked items from our collection.
        </p>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  )
}
