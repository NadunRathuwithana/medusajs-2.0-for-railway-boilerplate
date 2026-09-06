"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductCard from "@modules/products/components/product-card"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"
import { loadMoreStoreProducts } from "@lib/actions/load-more-store-products"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type InfiniteProductGridProps = {
  initialProducts: HttpTypes.StoreProduct[]
  totalCount: number
  sortBy: SortOptions
  countryCode: string
  bnplProviders: any[]
}

export default function InfiniteProductGrid({
  initialProducts,
  totalCount,
  sortBy,
  countryCode,
  bnplProviders,
}: InfiniteProductGridProps) {
  const [products, setProducts] = useState(initialProducts)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialProducts.length < totalCount)
  const sentinelRef = useRef<HTMLDivElement>(null)
  // Guards against firing a second load while one is already in flight —
  // state alone isn't enough since the observer can fire again before a
  // setState from the previous call has re-rendered.
  const loadingRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return
    loadingRef.current = true
    setIsLoading(true)

    const nextPage = page + 1
    try {
      const { products: newProducts } = await loadMoreStoreProducts({
        page: nextPage,
        sortBy,
        countryCode,
      })
      setProducts((prev) => {
        const combined = [...prev, ...newProducts]
        setHasMore(newProducts.length > 0 && combined.length < totalCount)
        return combined
      })
      setPage(nextPage)
    } catch (e) {
      console.error("[InfiniteProductGrid] Failed to load more products:", e)
      // Leave hasMore as-is — the sentinel stays mounted and the next
      // scroll/observer trigger will simply retry.
    } finally {
      loadingRef.current = false
      setIsLoading(false)
    }
  }, [page, hasMore, sortBy, countryCode, totalCount])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    // rootMargin fires this well before the sentinel is actually on screen,
    // so the next batch is normally already loaded by the time the user
    // scrolls far enough to see it — no visible loading pause under normal
    // network conditions.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: "1200px 0px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore, hasMore])

  return (
    <>
      <ul
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 w-full"
        data-testid="products-list"
      >
        {products.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} bnplProviders={bnplProviders} />
          </li>
        ))}
      </ul>

      {hasMore && (
        <div ref={sentinelRef} className="w-full">
          {isLoading && (
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 mt-8 sm:mt-12">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i}>
                  <SkeletonProductPreview />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  )
}
