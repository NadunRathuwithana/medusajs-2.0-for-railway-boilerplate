import { getProductsList } from "@lib/data/products"
import { getCollectionByHandle } from "@lib/data/collections"
import { getProductPrice } from "@lib/util/get-product-price"
import PopularSlider from "./popular-slider"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ViewItemListTracker from "@components/analytics/ViewItemListTracker"

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

  const { response } = await getProductsList({
    pageParam: 1,
    queryParams,
    countryCode,
  })

  if (!response.products || response.products.length === 0) {
    return null
  }

  return (
    <div className="content-container max-w-[1440px] mx-auto px-6 md:px-16">
      <ViewItemListTracker
        listId={collectionHandle || "popular"}
        listName={title}
        items={response.products.map((p) => {
          const { cheapestPrice } = getProductPrice({ product: p })
          return {
            id: p.id!,
            name: p.title!,
            price: cheapestPrice?.calculated_price_number,
            currency: cheapestPrice?.currency_code,
          }
        })}
      />
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl font-semibold text-bold tracking-tight capitalize">
          {title}
        </h2>
      </div>

      <PopularSlider
        products={response.products} 
        viewAllLink={collectionHandle ? `/collections/${collectionHandle}` : undefined}
        isNew={collectionHandle === "new-arrivals"}
      />
    </div>
  )
}
