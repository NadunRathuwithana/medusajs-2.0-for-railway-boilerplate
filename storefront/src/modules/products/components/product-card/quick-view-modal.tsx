"use client"

import { HttpTypes } from "@medusajs/types"
import { X, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useState, useMemo, useEffect } from "react"
import { clx } from "@medusajs/ui"
import { useParams } from "next/navigation"
import { addToCart } from "@lib/data/cart"
import { getProductPrice } from "@lib/util/get-product-price"
import { isEqual } from "lodash"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OptionSelect from "@modules/products/components/product-actions/option-select"

type QuickViewModalProps = {
  product: HttpTypes.StoreProduct
  onClose: () => void
}

const optionsAsKeymap = (variantOptions: any) => {
  return variantOptions?.reduce((acc: Record<string, string | undefined>, varopt: any) => {
    if (varopt.option && varopt.value !== null && varopt.value !== undefined) {
      acc[varopt.option.title] = varopt.value
    }
    return acc
  }, {})
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string

  // Animation states
  const [isMounted, setIsMounted] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Variant selection logic
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return
    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // Images — same mechanism as the PDP's ImageGallery: swap the whole list
  // to the selected variant's own images (not just "jump to a matching
  // index" within one merged list), falling back to the product's combined
  // images when no variant is selected yet or it has none of its own.
  const baseImages = useMemo(() => {
    const allImages = [
      product.thumbnail,
      ...(product.images?.map((i) => i.url) || []),
    ].filter(Boolean) as string[]
    return Array.from(new Set(allImages))
  }, [product.thumbnail, product.images])

  const uniqueImages = useMemo(() => {
    if (selectedVariant?.images?.length) {
      return Array.from(
        new Set(selectedVariant.images.map((i) => i.url).filter(Boolean) as string[])
      )
    }
    return baseImages
  }, [selectedVariant, baseImages])

  // Reset to the first image whenever the active variant changes — keyed
  // only on the variant's identity, never on currentIndex itself, so
  // manual arrow/dot navigation isn't fought (same reasoning as the PDP's
  // reset effect).
  useEffect(() => {
    setCurrentIndex(0)
  }, [selectedVariant?.id])

  const setOptionValue = (title: string, value: string) => {
    setOptions((prev) => ({ ...prev, [title]: value }))
  }

  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) return true
    if (selectedVariant?.allow_backorder) return true
    if (selectedVariant?.manage_inventory && (selectedVariant?.inventory_quantity || 0) > 0) return true
    return false
  }, [selectedVariant])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300) // matches duration-300 class
  }

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null
    setIsAdding(true)
    await addToCart({ variantId: selectedVariant.id, quantity: 1, countryCode })
    setIsAdding(false)
    handleClose()
  }

  const { cheapestPrice } = getProductPrice({ product })
  
  // To handle background scroll lock & trigger mount animation
  useEffect(() => {
    document.body.style.overflow = "hidden"
    setIsMounted(true)
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [])

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % uniqueImages.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + uniqueImages.length) % uniqueImages.length)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12" onClick={handleClose}>
      {/* Backdrop */}
      <div 
        className={clx(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isMounted && !isClosing ? "opacity-100" : "opacity-0"
        )} 
      />

      {/* Modal Content */}
      <div
        className={clx(
          "relative bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]",
          "transition-all duration-300 transform",
          isMounted && !isClosing ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"
        )}
        onClick={(e) => e.stopPropagation()} // Prevent click from closing
      >
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-white shadow-md border border-gray-100 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Left: Image Carousel */}
        <div className="w-full md:w-1/2 relative bg-gray-100 h-64 md:h-auto flex-shrink-0 group">
          {uniqueImages.map((src, idx) => (
            <div 
              key={idx} 
              className={clx(
                "absolute inset-0 transition-opacity duration-500",
                idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              )}
            >
              <Image src={src} alt={product.title} title={product.title} fill className="object-cover object-center" />
            </div>
          ))}

          {/* Navigation Arrows */}
          {uniqueImages.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/80 backdrop-blur-sm hover:bg-white text-bold flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/80 backdrop-blur-sm hover:bg-white text-bold flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Right: Details */}
        <div className="w-full md:w-1/2 p-8 md:p-10 lg:p-12 flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-500 mb-2">
              {product.collection?.title || "Fashion"}
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-bold mb-4 leading-tight">
              {product.title}
            </h2>
            <div className="flex items-end justify-between">
              <div>
                {cheapestPrice ? (
                  <div className="flex flex-col gap-0.5">
                    {Number(cheapestPrice.percentage_diff) > 0 && (
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs sm:text-sm font-medium text-gray-400 line-through leading-none">
                          {cheapestPrice.original_price}
                        </span>
                        <span className="bg-[#e11d48] text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wider">
                          {cheapestPrice.percentage_diff}% off
                        </span>
                      </div>
                    )}
                    <span
                      className={clx("text-lg sm:text-xl font-bold leading-tight", {
                        "text-[#e11d48]": Number(cheapestPrice.percentage_diff) > 0,
                        "text-gray-900": Number(cheapestPrice.percentage_diff) <= 0,
                      })}
                    >
                      {cheapestPrice.calculated_price}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Description Snippet */}
          <div className="mb-8">
            <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed">
              {product.description || "No description available."}
            </p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-y-6 mb-auto">
            {(product.options || []).map((option) => (
              <OptionSelect
                key={option.id}
                option={option}
                current={options[option.title ?? ""]}
                updateOption={setOptionValue}
                title={option.title ?? ""}
                disabled={isAdding}
                variants={product.variants ?? undefined}
              />
            ))}
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-4">
            <button
              onClick={handleAddToCart}
              disabled={!inStock || !selectedVariant || isAdding}
              className="w-full h-14 rounded-full bg-black hover:bg-gray-800 text-white text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!selectedVariant ? "Select variant" : !inStock ? "Out of stock" : isAdding ? "Adding..." : "Add to Cart"}
            </button>
            <LocalizedClientLink
              href={`/products/${product.handle}`}
              className="flex items-center justify-between w-full p-4 text-sm font-medium text-gray-600 hover:text-bold transition-colors rounded-xl hover:bg-gray-50"
            >
              View full details
              <ArrowRight className="w-4 h-4" />
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  )
}
