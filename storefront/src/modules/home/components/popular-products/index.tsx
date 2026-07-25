import { getProductsList } from "@lib/data/products"
import { getCollectionByHandle } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { getBnplProviders } from "@lib/data/payment"
import { getProductPrice } from "@lib/util/get-product-price"
import PopularSlider from "./popular-slider"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductListTracker from "@components/analytics/ProductListTracker"

export default async function PopularProducts({
  countryCode,
  title = "Popular Right Now",
  collectionHandle,
}: {
  countryCode: string
  title?: string
  collectionHandle?: string
}) {
  let collectionId: string | undefined

  if (collectionHandle) {
    const collection = await getCollectionByHandle(collectionHandle)
    collectionId = collection?.id
  }

  // Fetch up to 10 latest or popular products to show in the slider
  const queryParams: any = {
    limit: 10,
  }

  if (collectionId) {
    queryParams.collection_id = [collectionId]
  }

  const [{ response }, region] = await Promise.all([
    getProductsList({
      pageParam: 1,
      queryParams,
      countryCode,
    }),
    getRegion(countryCode),
  ])

  if (!response.products || response.products.length === 0) {
    return null
  }

  const bnplProviders = region ? await getBnplProviders(region.id) : []

  const trackedItems = response.products.map((p) => {
    const { cheapestPrice } = getProductPrice({ product: p })
    return {
      id: p.id!,
      name: p.title!,
      price: cheapestPrice?.calculated_price_number || 0,
    }
  })

  return (
    <div className="content-container max-w-[1440px] mx-auto px-6 md:px-16">
      {region && (
        <ProductListTracker
          listId={collectionHandle ? `home-${collectionHandle}` : "home-popular"}
          listName={title}
          currency={region.currency_code.toUpperCase()}
          items={trackedItems}
        />
      )}

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl font-semibold text-bold tracking-tight capitalize">
          {title}
        </h2>
      </div>

      <PopularSlider
        products={response.products}
        viewAllLink={collectionHandle ? `/collections/${collectionHandle}` : undefined}
        isNew={collectionHandle === "new-arrivals"}
        bnplProviders={bnplProviders}
      />
    </div>
  )
}
