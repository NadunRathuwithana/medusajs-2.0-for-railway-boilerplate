import { HttpTypes } from "@medusajs/types"
import {
  getCheapestVariant,
  getPricesForVariant,
  isVariantInStock,
} from "@lib/util/get-product-price"

type ProductJsonLdProps = {
  product: HttpTypes.StoreProduct
}

export default function ProductJsonLd({ product }: ProductJsonLdProps) {
  // Must match the real, canonical (sitemap-listed) URL — the bare
  // /products/... path 30x-redirects to /lk/products/..., which structured
  // data validators and crawlers treat as a weaker signal than a direct
  // match. Hardcoded "/lk" matches this single-region site's existing
  // convention (see BreadcrumbJsonLd's usage on the same page).
  const productUrl = `https://cardle.lk/lk/products/${product.handle}`
  const images = product.images?.map((img) => img.url) || []
  if (product.thumbnail && !images.includes(product.thumbnail)) {
    images.unshift(product.thumbnail)
  }

  // Priced/valued off the same variant the storefront shows as "the" price
  // for this product (cheapest sellable variant) — keeps this in lockstep
  // with what ProductPrice/ProductActions actually render.
  const cheapestVariant = getCheapestVariant(product)
  const priceInfo = getPricesForVariant(cheapestVariant)
  const sku = cheapestVariant?.sku || product.variants?.[0]?.sku || product.id

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description:
      product.description ||
      `${product.title} – handmade canvas tote bag by Cardle, made to order in Sri Lanka.`,
    url: productUrl,
    image: images,
    brand: {
      "@type": "Brand",
      name: "Cardle",
    },
    sku,
    mpn: sku,
    ...(priceInfo
      ? {
          offers: {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: priceInfo.currency_code.toUpperCase(),
            price: priceInfo.calculated_price_number.toFixed(2),
            priceValidUntil: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1)
            )
              .toISOString()
              .split("T")[0],
            availability: isVariantInStock(cheapestVariant)
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: {
              "@type": "Organization",
              name: "Cardle",
            },
            // Mirrors /shipping (LKR 300 island-wide, 2-7 business days) and
            // /returns (7-day returns). Update these if either page changes.
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: {
                "@type": "MonetaryAmount",
                value: "300",
                currency: "LKR",
              },
              shippingDestination: {
                "@type": "DefinedRegion",
                addressCountry: "LK",
              },
              deliveryTime: {
                "@type": "ShippingDeliveryTime",
                handlingTime: {
                  "@type": "QuantitativeValue",
                  minValue: 0,
                  maxValue: 2,
                  unitCode: "DAY",
                },
                transitTime: {
                  "@type": "QuantitativeValue",
                  minValue: 2,
                  maxValue: 7,
                  unitCode: "DAY",
                },
              },
            },
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: "LK",
              returnPolicyCategory:
                "https://schema.org/MerchantReturnFiniteReturnWindow",
              merchantReturnDays: 7,
              returnMethod: "https://schema.org/ReturnByMail",
              url: "https://cardle.lk/lk/returns",
            },
          },
        }
      : {}),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
