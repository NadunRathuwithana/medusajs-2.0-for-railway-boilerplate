import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import SortDropdown from "@modules/store/components/sort-dropdown"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="w-full bg-white">
      {/* Hero Banner */}
      <section className="h-[90vh] w-full relative overflow-hidden bg-[#e5e5e5] flex flex-col items-center justify-center">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=2574&auto=format&fit=crop"
          alt={`${collection.title} Hero Banner`}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-[1440px] px-6 md:px-16 flex flex-col items-center justify-center text-center h-full pt-16">
          <p className="text-zinc-900 mix-blend-difference text-sm md:text-base font-bold tracking-[0.3em] capitalize mb-6 drop-shadow-sm">
            Collection
          </p>
          <h1 className="text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-extrabold capitalize tracking-tighter leading-[0.85] text-zinc-900 mix-blend-difference drop-shadow-sm mb-8">
            {collection.title}
          </h1>
          <p className="text-xl md:text-2xl text-zinc-900 mix-blend-difference font-medium max-w-2xl mx-auto italic drop-shadow-sm">
            Discover the ultimate everyday carry.
          </p>
        </div>
      </section>

      <div className="content-container max-w-[1440px] mx-auto px-6 md:px-16 py-12" data-testid="category-container">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-12 border-b border-gray-150 pb-6">
          <h1 className="text-4xl font-bold capitalize tracking-tight text-bold" data-testid="store-page-title">
            {collection.title}
          </h1>
          <SortDropdown sortBy={sort} />
        </div>

        {/* Products Grid */}
        <div className="w-full">
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              collectionId={collection.id}
              countryCode={countryCode}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
