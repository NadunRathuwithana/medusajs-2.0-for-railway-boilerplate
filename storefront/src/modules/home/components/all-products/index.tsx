import { getProductsList } from "@lib/data/products"
import ProductCard from "@modules/products/components/product-card"
import { Pagination } from "@modules/store/components/pagination"

export default async function AllProducts({
  countryCode,
  page = 1,
}: {
  countryCode: string
  page?: number
}) {
  const limit = 20

  const { response } = await getProductsList({
    pageParam: page,
    queryParams: {
      limit,
    },
    countryCode,
  })

  const { products, count } = response

  if (!products || products.length === 0) {
    return null
  }

  const totalPages = Math.ceil(count / limit)

  return (
    <div className="content-container max-w-[1440px] mx-auto px-6 md:px-16" id="all-products">
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
            <ProductCard product={product} />
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
