import { notFound } from "next/navigation"
import { Suspense } from "react"

import PageBanner from "@modules/cms/page-banner"
import BannerText from "@modules/cms/banner-text"
import { HERO_SIZE } from "@modules/cms/hero-size"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import SortDropdown from "@modules/store/components/sort-dropdown"
import InfiniteProducts from "@modules/store/templates/infinite-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

// Same layout as the Store page: banner, title + sort, infinite product grid.
export default function CategoryTemplate({
  categories,
  sortBy,
  countryCode,
}: {
  categories: HttpTypes.StoreProductCategory[]
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const sort = sortBy || "best_selling"
  const category = categories[categories.length - 1]
  const parents = categories.slice(0, categories.length - 1)

  if (!category || !countryCode) notFound()

  return (
    <div className="w-full bg-white" data-testid="category-container">
      {/* Banner: upload one per category in Admin > Site CMS (page = this category). */}
      <PageBanner
        pageKey={`category:${category.handle}`}
        fallback={
          <section className={`${HERO_SIZE} bg-[#e5e5e5]`}>
            <BannerText eyebrow="The Collection" title={category.name} />
          </section>
        }
      />

      <div className="content-container max-w-[1440px] mx-auto px-6 md:px-16 py-12">
        <div className="flex flex-row items-center justify-between mb-8 sm:mb-12 border-b border-gray-150 pb-6 gap-4">
          <div>
            {parents.length > 0 && (
              <p className="text-sm text-gray-500 mb-1">
                {parents.map((p) => (
                  <span key={p.id}>
                    <LocalizedClientLink href={`/categories/${p.handle}`} className="hover:text-gray-900">{p.name}</LocalizedClientLink>
                    {" / "}
                  </span>
                ))}
              </p>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold capitalize tracking-tight text-bold" data-testid="category-page-title">
              {category.name}
            </h1>
            {category.description && <p className="text-sm text-gray-500 mt-2 max-w-xl">{category.description}</p>}
          </div>
          <SortDropdown sortBy={sort} />
        </div>

        <div className="w-full">
          <Suspense key={`${sort}-${category.id}`} fallback={<SkeletonProductGrid />}>
            <InfiniteProducts sortBy={sort} countryCode={countryCode} categoryId={category.id} listName={category.name} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
