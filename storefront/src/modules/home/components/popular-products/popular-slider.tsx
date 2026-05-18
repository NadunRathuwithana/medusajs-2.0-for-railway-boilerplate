"use client"

import { HttpTypes } from "@medusajs/types"
import { useRef } from "react"
import ProductCard from "@modules/products/components/product-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function PopularSlider({
  products,
  viewAllLink,
  isNew,
}: {
  products: HttpTypes.StoreProduct[]
  viewAllLink?: string
  isNew?: boolean
}) {
  const sliderRef = useRef<HTMLUListElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  return (
    <div className="relative w-full">
      <div className="absolute right-0 -top-[76px] flex items-center gap-6">
        {viewAllLink && (
          <LocalizedClientLink
            href="/store"
            className="text-bold hover:text-gray-600 transition-colors capitalize font-medium text-sm whitespace-nowrap hidden sm:block bg-zinc-100 py-2 px-4 rounded-full"
          >
            View All
          </LocalizedClientLink>
        )}
        {products.length > 4 && (
          <div className="hidden md:flex items-center gap-3">
          <button 
            onClick={() => scroll("left")} 
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Previous"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button 
            onClick={() => scroll("right")} 
            className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            aria-label="Next"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
        )}
      </div>

      <ul 
        ref={sliderRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8 mt-6 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => (
          <li key={product.id} className="w-[85vw] md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] snap-start flex-shrink-0 group">
            <ProductCard product={product} isNew={isNew} />
          </li>
        ))}
      </ul>
      
      <style dangerouslySetInnerHTML={{__html: `
        ul::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  )
}
