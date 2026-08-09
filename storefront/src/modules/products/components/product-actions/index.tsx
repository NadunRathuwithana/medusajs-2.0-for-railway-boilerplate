"use client"

import { Button } from "@medusajs/ui"
import { isEqual } from "lodash"
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { useIntersection } from "@lib/hooks/use-in-view"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"

import MobileActions from "./mobile-actions"
import ProductPrice from "../product-price"
import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice, isVariantInStock } from "@lib/util/get-product-price"
import BnplWidget from "./bnpl-widget"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  isKokoEnabled?: boolean
  isMintpayEnabled?: boolean
}

const optionsAsKeymap = (variantOptions: any) => {
  return variantOptions?.reduce((acc: Record<string, string | undefined>, varopt: any) => {
    if (varopt.option && varopt.value !== null && varopt.value !== undefined) {
      acc[varopt.option.title] = varopt.value
    }
    return acc
  }, {})
}

import { trackAddToCart, trackViewContent } from "@lib/analytics/track"

export default function ProductActions({
  product,
  region,
  disabled,
  isKokoEnabled,
  isMintpayEnabled,
}: ProductActionsProps) {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Track ViewContent on mount. Keyed on product.id (not the whole `product`
  // object) so URL-driven re-renders that hand down a new object reference for
  // the same product (e.g. syncing a variant/color choice to the URL) don't
  // re-fire a duplicate ViewContent.
  useEffect(() => {
    const { cheapestPrice } = getProductPrice({ product })
    trackViewContent({
      id: product.id!,
      name: product.title!,
      price: cheapestPrice?.calculated_price_number || 0,
      currency: (cheapestPrice?.currency_code || region.currency_code).toUpperCase(),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, region.currency_code])

  // Initialize options from URL or default to 1 variant
  useEffect(() => {
    // An option with only one possible value isn't a real choice — nothing
    // for the user to click. Pre-select those, otherwise selectedVariant
    // (which requires an exact match on every option key) can never
    // resolve until the user redundantly clicks through options that don't
    // actually offer alternatives — silently blocking add-to-cart.
    const singleValueOptions: Record<string, string> = {}
    product.options?.forEach((opt) => {
      if (opt.title && opt.values?.length === 1 && opt.values[0].value) {
        singleValueOptions[opt.title] = opt.values[0].value
      }
    })
    if (Object.keys(singleValueOptions).length > 0) {
      setOptions((prev) => ({ ...singleValueOptions, ...prev }))
    }

    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    } else if (searchParams) {
      const initialOptions: Record<string, string> = {}
      let hasParams = false
      product.options?.forEach((opt) => {
        const title = opt.title?.toLowerCase()
        const value = searchParams.get(title || "")
        if (value) {
          initialOptions[opt.title!] = value
          hasParams = true
        }
      })
      if (hasParams) {
        setOptions((prev) => ({ ...prev, ...initialOptions }))
      }
    }
  }, [product.variants, product.options, searchParams])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (title: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [title]: value,
    }))

    // Sync to URL
    if (title.toLowerCase() === "color") {
      window.dispatchEvent(new CustomEvent("variantChange", { detail: { color: value } }))
      const current = new URLSearchParams(Array.from(searchParams?.entries() || []))
      current.set(title.toLowerCase(), value)
      router.replace(`${pathname}?${current.toString()}`, { scroll: false })
    }
  }

  // update main image when variant changes
  useEffect(() => {
    if (selectedVariant) {
      const imageUrl = selectedVariant.thumbnail || (selectedVariant.images?.[0]?.url)
      if (imageUrl) {
        window.dispatchEvent(new CustomEvent("updateImage", { detail: imageUrl }))
      }
    }
  }, [selectedVariant])

  // Tell the Description tab which variant is selected, so it can show that
  // variant's own weight/dimensions instead of always falling back to the
  // product-level static values. `detail: null` on deselect (or a field
  // being unset on the variant) lets the listener fall back per-field.
  //
  // Medusa's native weight/length/height/width admin fields only accept
  // whole numbers, so a `display_*` metadata override (set via the
  // "Precise Display Dimensions" admin widget) takes priority when present,
  // falling back to the native field otherwise.
  useEffect(() => {
    const variantMetadata = (selectedVariant?.metadata ?? {}) as Record<string, unknown>

    const pickDimension = (metaKey: string, nativeValue: number | null | undefined) => {
      const override = variantMetadata[metaKey]
      if (override != null && override !== "" && !Number.isNaN(Number(override))) {
        return Number(override)
      }
      return nativeValue ?? null
    }

    window.dispatchEvent(
      new CustomEvent("variantDimensionsChange", {
        detail: selectedVariant
          ? {
              weight: pickDimension("display_weight", selectedVariant.weight),
              length: pickDimension("display_length", selectedVariant.length),
              height: pickDimension("display_height", selectedVariant.height),
              width: pickDimension("display_width", selectedVariant.width),
            }
          : null,
      })
    )
  }, [selectedVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => isVariantInStock(selectedVariant), [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })

      // Only track AddToCart once the item has actually been added — tracking
      // beforehand would record a conversion even if the cart mutation fails
      // (out of stock, network error, etc.).
      const { cheapestPrice, variantPrice } = getProductPrice({
        product,
        variantId: selectedVariant?.id,
      })
      const selectedPrice = selectedVariant ? variantPrice : cheapestPrice
      trackAddToCart({
        id: selectedVariant.id,
        name: `${product.title} - ${selectedVariant.title}`,
        price: selectedPrice?.calculated_price_number || 0,
        quantity: 1,
        currency: (selectedPrice?.currency_code || region.currency_code).toUpperCase(),
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-y-6" ref={actionsRef}>

        {/* Price at the top */}
        <div className="-mt-4">
          <ProductPrice product={product} variant={selectedVariant} />
        </div>

        {/* BNPL (Koko / Mintpay) installment widget */}
        {(() => {
          const bnplProviders: Array<"koko" | "mintpay"> = []
          if (isKokoEnabled) bnplProviders.push("koko")
          if (isMintpayEnabled) bnplProviders.push("mintpay")
          if (bnplProviders.length === 0) return null

          const { cheapestPrice, variantPrice } = getProductPrice({
            product,
            variantId: selectedVariant?.id,
          })
          const selectedPrice = selectedVariant ? variantPrice : cheapestPrice

          if (selectedPrice?.calculated_price_number) {
            return (
              <BnplWidget
                price={selectedPrice.calculated_price_number}
                currencyCode={selectedPrice.currency_code}
                providers={bnplProviders}
              />
            )
          }
          return null
        })()}

        {/* Options */}
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-6">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.title ?? ""]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                      variants={product.variants ?? undefined}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add to Cart */}
        <div className="flex items-center w-full mt-2">
          <Button
            onClick={handleAddToCart}
            disabled={!inStock || !selectedVariant || !!disabled || isAdding}
            className="w-full h-14 rounded-full bg-black hover:bg-gray-800 text-white text-base font-medium shadow-none transition-colors border-none"
            isLoading={isAdding}
            data-testid="add-product-button"
          >
            {!selectedVariant
              ? "Select variant"
              : !inStock
                ? "Out of stock"
                : "Add to Cart"}
          </Button>
        </div>

        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
