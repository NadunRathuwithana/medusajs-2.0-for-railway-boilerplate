import { getProductsList } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getBnplProviders } from "@lib/data/payment"
import { getProductPrice } from "@lib/util/get-product-price"
import ProductCard from "@modules/products/components/product-card"
import { Pagination } from "@modules/store/components/pagination"
import ProductListTracker from "@components/analytics/ProductListTracker"

export default async function AllProducts({
  countryCode,
  page = 1,
}: {
  countryCode: string
  page?: number
}) {
  const limit = 20

  const [{ response }, region] = await Promise.all([
    getProductsList({
      pageParam: page,
      queryParams: {
        limit,
      },
      countryCode,
    }),
    getRegion(countryCode),
  ])

  const { products, count } = response
  const bnplProviders = region ? await getBnplProviders(region.id) : []

  if (!products || products.length === 0) {
    return null
  }

  const totalPages = Math.ceil(count / limit)

  const trackedItems = products.map((p) => {
    const { cheapestPrice } = getProductPrice({ product: p })
    return {
      id: p.id!,
      name: p.title!,
      price: cheapestPrice?.calculated_price_number || 0,
    }
  })

  return (
    <div className="content-container max-w-[1440px] mx-auto px-6 md:px-16" id="all-products">
      {region && (
        <ProductListTracker
          listId="home-all-products"
          listName="Our Products"
          currency={region.currency_code.toUpperCase()}
          items={trackedItems}
        />
      )}

      <div className="flex items-center justify-between mb-8 border-b border-gray-150 pb-4">
        <h2 className="text-4xl font-semibold text-bold tracking-tight capitalize">
          Our Products
        </h2>
        <span className="hidden md:block text-sm font-medium text-gray-500 capitalize tracking-wider">
          Showing {products.length} of {count} products
        </span>
      </div>

      <ul
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12"
        data-testid="products-list"
      >
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} bnplProviders={bnplProviders} />
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </div>
  )
}
