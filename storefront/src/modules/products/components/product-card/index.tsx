"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { addToCart } from "@lib/data/cart"
import { getProductPrice } from "@lib/util/get-product-price"
import { clx } from "@medusajs/ui"
import QuickViewModal from "./quick-view-modal"
import { convertToLocale } from "@lib/util/money"
import BnplWidget from "@modules/products/components/product-actions/bnpl-widget"

// Tailwind's `lg` breakpoint — matches the flex-col/lg:flex-row switch used
// throughout this card, so "mobile" here means the same thing it means there.
const MOBILE_MEDIA_QUERY = "(max-width: 1023px)"

// Matches the "10% Off Sitewide" nav banner / checkout promo — a display-only
// hint on cards that don't already have their own price-list sale price.
// The real discount still only applies via the promotion at checkout.
const SITEWIDE_DISCOUNT_PERCENT = Number(process.env.NEXT_PUBLIC_SITEWIDE_DISCOUNT_PERCENT) || 0

function AddToCartBtn({ product, onOpenModal }: { product: HttpTypes.StoreProduct, onOpenModal: () => void }) {
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string

  const hasOptions = (product.variants?.length || 0) > 1

  const handleAddToCart = async (e: React.MouseEvent) => {
    if (hasOptions) {
      const isMobile =
        typeof window !== "undefined" && window.matchMedia(MOBILE_MEDIA_QUERY).matches
      if (isMobile) {
        // Let the click bubble up to the card's wrapping Link — on mobile we
        // skip the options dialog entirely and just go to the product page.
        return
      }
      e.preventDefault()
      e.stopPropagation()
      onOpenModal()
      return
    }

    e.preventDefault()
    e.stopPropagation()

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
      className="w-full lg:w-auto bg-[#111111] text-white px-4 sm:px-6 py-3 rounded-full text-xs font-bold tracking-widest capitalize hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {isAdding ? "Adding..." : hasOptions ? "Options" : "Add to Cart"}
    </button>
  )
}

export default function ProductCard({
  product,
  className,
  isNew,
  bnplProviders = [],
}: {
  product: HttpTypes.StoreProduct
  className?: string
  isNew?: boolean
  bnplProviders?: Array<"koko" | "mintpay">
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const allImages = [
    product.thumbnail,
    ...(product.variants?.map((v) => v.thumbnail || (v as any).images?.[0]?.url) || []),
  ].filter(Boolean) as string[]
  const uniqueImages = Array.from(new Set(allImages))

  useEffect(() => {
    let interval: NodeJS.Timeout
    // Mobile has no real hover — some mobile browsers still fire a
    // synthetic mouseenter on tap, which would otherwise auto-advance
    // through the images right as the user is trying to tap through to
    // the product page. Desktop-only.
    const isMobile = typeof window !== "undefined" && window.matchMedia(MOBILE_MEDIA_QUERY).matches
    if (isHovered && !isMobile && uniqueImages.length > 1 && !isModalOpen) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % uniqueImages.length)
      }, 800)
    } else {
      setCurrentIndex(0)
    }
    return () => clearInterval(interval)
  }, [isHovered, uniqueImages.length, isModalOpen])

  const { cheapestPrice } = getProductPrice({ product })
  const isComingSoon = !cheapestPrice

  // Real price-list sale (percentage_diff > 0) always wins. Otherwise, if a
  // sitewide discount percent is configured, show what the regular price
  // becomes under it — same crossed-out-original + badge treatment either way.
  const hasRealDiscount = !!cheapestPrice && Number(cheapestPrice.percentage_diff) > 0
  const sitewideDiscountedAmount =
    cheapestPrice && !hasRealDiscount && SITEWIDE_DISCOUNT_PERCENT > 0
      ? cheapestPrice.calculated_price_number * (1 - SITEWIDE_DISCOUNT_PERCENT / 100)
      : null

  const showDiscount = hasRealDiscount || sitewideDiscountedAmount !== null
  const discountPercent = hasRealDiscount
    ? cheapestPrice!.percentage_diff
    : String(SITEWIDE_DISCOUNT_PERCENT)
  const displayOriginalPrice = hasRealDiscount ? cheapestPrice!.original_price : cheapestPrice?.calculated_price
  const displayCurrentPrice =
    sitewideDiscountedAmount !== null
      ? convertToLocale({ amount: sitewideDiscountedAmount, currency_code: cheapestPrice!.currency_code })
      : cheapestPrice?.calculated_price
  const displaySavingsAmount = hasRealDiscount
    ? cheapestPrice!.original_price_number - cheapestPrice!.calculated_price_number
    : sitewideDiscountedAmount !== null
    ? cheapestPrice!.calculated_price_number - sitewideDiscountedAmount
    : 0
  // So the BNPL "3 X <installment>" math matches whatever price is actually
  // shown above, instead of the pre-sitewide-discount amount.
  const effectivePriceNumber = sitewideDiscountedAmount ?? cheapestPrice?.calculated_price_number

  const imageArea = (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100 mb-4 rounded-[24px]"
      onMouseEnter={() => !isComingSoon && setIsHovered(true)}
      onMouseLeave={() => !isComingSoon && setIsHovered(false)}
    >
      {(isNew || (product as any).collection?.handle === "new-arrivals") && !isComingSoon && (
        <div className="absolute top-4 left-4 z-10 bg-[#111111] text-white text-[10px] font-bold px-3 py-1.5 rounded-full capitalize tracking-wider">
          New
        </div>
      )}
      {isComingSoon && (
        <div className="absolute top-4 left-4 z-10 bg-zinc-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full capitalize tracking-wider">
          Coming Soon
        </div>
      )}

      <div
        className="flex h-full"
        style={{
          width: `${uniqueImages.length * 100}%`,
          transform: `translateX(-${currentIndex * (100 / uniqueImages.length)}%)`,
          transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {uniqueImages.map((src, idx) => (
          <div key={idx} className="relative h-full" style={{ width: `${100 / uniqueImages.length}%` }}>
            <img
              src={src}
              alt={`${product.title} - ${idx}`}
              className="absolute inset-0 w-full h-full object-cover object-center"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {uniqueImages.length > 1 && (
        <div className="hidden lg:flex absolute bottom-4 left-0 right-0 justify-center gap-1.5 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
          {uniqueImages.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-4 bg-black/40" : "w-1.5 bg-black/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )

  const info = (
    <div className="flex flex-col flex-grow px-1 mt-2">
      <h3 className="text-sm sm:text-xl font-bold tracking-tighter mb-1 sm:mb-2 text-bold line-clamp-1 font-sans">
        {product.title}
      </h3>
      <div className="mt-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 sm:gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {cheapestPrice ? (
            <>
              {showDiscount && (
                <span className="text-xs sm:text-sm font-medium text-gray-400 line-through">
                  {displayOriginalPrice}
                </span>
              )}
              <span className={clx("text-sm sm:text-md font-semibold", showDiscount ? "text-[#e11d48]" : "text-gray-700")}>
                {displayCurrentPrice}
              </span>
              {showDiscount && (
                <div className="flex items-center gap-1 mt-1 sm:mt-0 w-full sm:w-auto">
                  <span className="bg-[#fce7f3] text-[#be185d] text-[10px] font-medium px-2 py-0.5 rounded-full">
                    {discountPercent}% off
                  </span>
                  <span className="bg-[#e11d48] text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                    -{convertToLocale({ amount: displaySavingsAmount, currency_code: cheapestPrice.currency_code })}
                  </span>
                </div>
              )}
            </>
          ) : (
            <span className="text-sm sm:text-md font-semibold text-gray-500">Coming soon</span>
          )}
        </div>

        {/* Mobile-only: Koko/Mintpay must appear above the Add to Cart button.
            Desktop keeps its own copy below the price/button row (see below). */}
        {cheapestPrice && bnplProviders.length > 0 && (
          <div className="lg:hidden w-full">
            <BnplWidget
              price={effectivePriceNumber!}
              currencyCode={cheapestPrice.currency_code}
              providers={bnplProviders}
              compact
            />
          </div>
        )}

        <div className="w-full lg:w-auto">
          {cheapestPrice ? (
            <AddToCartBtn product={product} onOpenModal={() => setIsModalOpen(true)} />
          ) : (
            <button
              disabled
              className="w-full lg:w-auto bg-zinc-100 text-zinc-400 border border-zinc-200 px-4 sm:px-6 py-2.5 rounded-full text-xs font-bold tracking-widest capitalize cursor-not-allowed select-none whitespace-nowrap"
            >
              Unavailable
            </button>
          )}
        </div>
      </div>

      {cheapestPrice && bnplProviders.length > 0 && (
        <div className="hidden lg:block">
          <BnplWidget
            price={effectivePriceNumber!}
            currencyCode={cheapestPrice.currency_code}
            providers={bnplProviders}
            compact
          />
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className={clx("group flex flex-col h-full relative", isComingSoon && "opacity-65 grayscale-[20%]", className)}>
        {isComingSoon ? (
          <div className="flex flex-col h-full cursor-default select-none">
            {imageArea}
            {info}
          </div>
        ) : (
          <LocalizedClientLink href={`/products/${product.handle}`} className="flex flex-col h-full">
            {imageArea}
            {info}
          </LocalizedClientLink>
        )}
      </div>

      {isModalOpen && (
        <QuickViewModal product={product} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  )
}
