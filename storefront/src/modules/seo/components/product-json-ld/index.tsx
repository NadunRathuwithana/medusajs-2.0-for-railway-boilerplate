import { HttpTypes } from "@medusajs/types"

type ProductJsonLdProps = {
  product: HttpTypes.StoreProduct
  price?: string
  currencyCode?: string
  countryCode: string
}

export default function ProductJsonLd({
  product,
  price,
  currencyCode = "LKR",
  countryCode,
}: ProductJsonLdProps) {
  const productUrl = `https://cardle.lk/products/${product.handle}`
  const images = product.images?.map((img) => img.url) || []
  if (product.thumbnail && !images.includes(product.thumbnail)) {
    images.unshift(product.thumbnail)
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description:
      product.description ||
      `${product.title} – handcrafted canvas tote bag by Cardle, made to order in Sri Lanka.`,
    url: productUrl,
    image: images,
    brand: {
      "@type": "Brand",
      name: "Cardle",
    },
    sku: product.id,
    mpn: product.id,
    ...(price
      ? {
          offers: {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: currencyCode,
            price: price,
            priceValidUntil: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1)
            )
              .toISOString()
              .split("T")[0],
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: {
              "@type": "Organization",
              name: "Cardle",
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
