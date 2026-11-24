import BannerText from "@modules/cms/banner-text"
import { HERO_SIZE } from "@modules/cms/hero-size"
import PageBanner from "@modules/cms/page-banner"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import SortDropdown from "@modules/store/components/sort-dropdown"
import InfiniteProducts from "./infinite-products"

const StoreTemplate = ({
  sortBy,
  countryCode,
}: {
  sortBy?: SortOptions
  countryCode: string
}) => {
  const sort = sortBy || "best_selling"

  return (
    <div className="w-full bg-white">
      {/* Hero Banner (editable in Admin > Site CMS) */}
      <PageBanner
        pageKey="store"
        fallback={
          <section className={`${HERO_SIZE} bg-[#e5e5e5]`}>
            <BannerText eyebrow="The Collection" title="All Bags" />
          </section>
        }
      />

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
          <Suspense key={sort} fallback={<SkeletonProductGrid />}>
            <InfiniteProducts sortBy={sort} countryCode={countryCode} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate
