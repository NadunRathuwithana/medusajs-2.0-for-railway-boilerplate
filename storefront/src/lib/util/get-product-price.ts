import { HttpTypes } from "@medusajs/types"
import { getPercentageDiff } from "./get-precentage-diff"
import { convertToLocale } from "./money"

export const getPricesForVariant = (variant: any) => {
  if (!variant?.calculated_price?.calculated_amount) {
    return null
  }

  return {
    calculated_price_number: variant.calculated_price.calculated_amount,
    calculated_price: convertToLocale({
      amount: variant.calculated_price.calculated_amount,
      currency_code: variant.calculated_price.currency_code,
    }),
    original_price_number: variant.calculated_price.original_amount,
    original_price: convertToLocale({
      amount: variant.calculated_price.original_amount,
      currency_code: variant.calculated_price.currency_code,
    }),
    currency_code: variant.calculated_price.currency_code,
    price_type: variant.calculated_price.calculated_price.price_list_type,
    percentage_diff: getPercentageDiff(
      variant.calculated_price.original_amount,
      variant.calculated_price.calculated_amount
    ),
  }
}

export function getCheapestVariant(product?: HttpTypes.StoreProduct | null) {
  if (!product?.variants?.length) {
    return null
  }

  const priced: any[] = product.variants.filter((v: any) => !!v.calculated_price)

  if (!priced.length) {
    return null
  }

  return priced.sort((a, b) => {
    return (
      a.calculated_price.calculated_amount - b.calculated_price.calculated_amount
    )
  })[0]
}

// Mirrors the availability rule used by the add-to-cart button: a variant is
// sellable if inventory isn't tracked, backorders are allowed, or there's
// stock on hand. Shared so JSON-LD/the merchant feed can't drift from what
// the storefront actually lets customers buy.
export function isVariantInStock(
  variant?: {
    manage_inventory?: boolean | null
    allow_backorder?: boolean | null
    inventory_quantity?: number | null
  } | null
): boolean {
  if (!variant) {
    return false
  }

  if (!variant.manage_inventory) {
    return true
  }

  if (variant.allow_backorder) {
    return true
  }

  return (variant.inventory_quantity || 0) > 0
}

export function getProductPrice({
  product,
  variantId,
}: {
  product: HttpTypes.StoreProduct
  variantId?: string
}) {
  if (!product || !product.id) {
    throw new Error("No product provided")
  }

  const cheapestPrice = () => {
    return getPricesForVariant(getCheapestVariant(product))
  }

  const variantPrice = () => {
    if (!product || !variantId) {
      return null
    }

    const variant: any = product.variants?.find(
      (v) => v.id === variantId || v.sku === variantId
    )

    if (!variant) {
      return null
    }

    return getPricesForVariant(variant)
  }

  return {
    product,
    cheapestPrice: cheapestPrice(),
    variantPrice: variantPrice(),
  }
}
