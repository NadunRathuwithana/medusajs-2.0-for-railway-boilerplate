"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { addToCart } from "@lib/data/cart"
import { getProductPrice } from "@lib/util/get-product-price"
import { clx } from "@medusajs/ui"
import QuickViewModal from "./quick-view-modal"

function AddToCartBtn({ product, onOpenModal }: { product: HttpTypes.StoreProduct, onOpenModal: () => void }) {
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string

  const hasOptions = (product.variants?.length || 0) > 1

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (hasOptions) {
      onOpenModal()
      return
    }

    if (!product.variants || product.variants.length === 0) return

    const variantId = product.variants[0].id
    if (!variantId) return

    setIsAdding(true)
    try {
      await addToCart({
        variantId,
        quantity: 1,
        countryCode,
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding || (!hasOptions && (!product.variants || product.variants.length === 0))}
      className="bg-[#111111] text-white px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isAdding ? "Adding..." : hasOptions ? "Choose Options" : "Add to Cart"}
    </button>
  )
}

export default function ProductCard({
  product,
  className,
}: {
  product: HttpTypes.StoreProduct
  className?: string
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const allImages = [
    product.thumbnail,
    ...(product.images?.map((i) => i.url) || []),
  ].filter(Boolean) as string[]
  const uniqueImages = Array.from(new Set(allImages))

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isHovered && uniqueImages.length > 1 && !isModalOpen) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % uniqueImages.length)
      }, 800)
    } else {
      setCurrentIndex(0)
    }
    return () => clearInterval(interval)
  }, [isHovered, uniqueImages.length, isModalOpen])

  const { cheapestPrice } = getProductPrice({ product })

  return (
    <>
      <div className={clx("group flex flex-col h-full", className)}>
        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className="flex flex-col h-full"
        >
          <div
            className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100 mb-4 rounded-[24px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="absolute top-4 left-4 z-10 bg-[#111111] text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              New
            </div>

            <div
              className="flex w-full h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {uniqueImages.map((src, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0 relative">
                  <img
                    src={src}
                    alt={`${product.title} - ${idx}`}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                </div>
              ))}
            </div>

            <div
              className={`absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 transition-opacity duration-300 ${
                isHovered && uniqueImages.length > 1 ? "opacity-100" : "opacity-0"
              }`}
            >
              {uniqueImages.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? "w-4 bg-black" : "w-1.5 bg-black/30"
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="flex flex-col flex-grow px-1">
            <h3 className="text-xl font-bold tracking-tighter mb-2 text-black line-clamp-1 font-sans">
              {product.title}
            </h3>
            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                {cheapestPrice ? (
                  <>
                    <span className="text-lg font-semibold text-gray-700">
                      {cheapestPrice.calculated_price}
                    </span>
                    {Number(cheapestPrice.percentage_diff) > 0 && (
                      <span className="text-sm font-medium text-gray-400 line-through">
                        {cheapestPrice.original_price}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-lg font-semibold text-gray-700">N/A</span>
                )}
              </div>
              <AddToCartBtn product={product} onOpenModal={() => setIsModalOpen(true)} />
            </div>
          </div>
        </LocalizedClientLink>
      </div>

      {isModalOpen && (
        <QuickViewModal product={product} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  )
}
