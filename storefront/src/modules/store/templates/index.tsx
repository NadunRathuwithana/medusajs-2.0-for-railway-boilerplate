import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import SortDropdown from "@modules/store/components/sort-dropdown"
import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "best_selling"

  return (
    <div className="w-full bg-white">
      {/* Hero Banner */}
      <section className="h-[90vh] w-full relative overflow-hidden bg-[#e5e5e5] flex flex-col items-center justify-center">
        <picture>
          <source media="(max-width: 768px)" srcSet="/store/shopMobile.jpg" />
          <source media="(max-width: 1024px)" srcSet="/store/shopTab.jpg" />
          <img
            src="/store/shopHero.jpg"
            alt="Cardle Store Hero Banner"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </picture>
      </section>

      <div className="content-container max-w-[1440px] mx-auto px-6 md:px-16 py-12" data-testid="category-container">
        {/* Header Section */}
        <div className="flex flex-row items-center justify-between mb-8 sm:mb-12 border-b border-gray-150 pb-6 gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold capitalize tracking-tight text-bold" data-testid="store-page-title">
            All products
          </h1>
          <div>
            <SortDropdown sortBy={sort} />
          </div>
        </div>

        {/* Products Grid */}
        <div className="w-full">
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              countryCode={countryCode}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate
