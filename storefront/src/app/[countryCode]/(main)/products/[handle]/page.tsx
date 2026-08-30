import { Metadata } from "next"
import { notFound } from "next/navigation"

import ProductTemplate from "@modules/products/templates"
import { getRegion, listRegions } from "@lib/data/regions"
import { getProductByHandle, getProductsList } from "@lib/data/products"
import ProductJsonLd from "@modules/seo/components/product-json-ld"
import BreadcrumbJsonLd from "@modules/seo/components/breadcrumb-json-ld"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

// Cuts at the last whitespace before the limit so meta descriptions never
// end mid-word — a fixed-index slice() previously cut sentences like
// "...daily essentia" (from "essentials").
function truncateAtWordBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  const sliced = text.slice(0, maxLength)
  const lastSpace = sliced.lastIndexOf(" ")
  return (lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced).trimEnd() + "…"
}

export async function generateStaticParams() {
  const countryCodes = await listRegions().then(
    (regions) =>
      regions
        ?.map((r) => r.countries?.map((c) => c.iso_2))
        .flat()
        .filter(Boolean) as string[]
  )

  if (!countryCodes) {
    return null
  }

  const products = await Promise.all(
    countryCodes.map((countryCode) => {
      return getProductsList({ countryCode })
    })
  ).then((responses) =>
    responses.map(({ response }) => response.products).flat()
  )

  const staticParams = countryCodes
    ?.map((countryCode) =>
      products.map((product) => ({
        countryCode,
        handle: product.handle,
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, countryCode } = await params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  const product = await getProductByHandle(handle, region.id)

  if (!product) {
    notFound()
  }

  // Absolute title: bypasses the root layout's `%s | Cardle Sri Lanka`
  // template. This string already carries full branding — letting the
  // template apply on top would render "{title} | Cardle | Cardle Sri Lanka".
  const title = `${product.title} – Handmade Canvas Tote Bag | Sri Lanka`

  const KEYWORD_SUFFIX = "Handmade canvas tote bag, Sri Lanka."
  const MAX_META_DESCRIPTION_LENGTH = 155
  const baseDescription = product.description?.trim()
  const description = baseDescription
    ? `${truncateAtWordBoundary(baseDescription, MAX_META_DESCRIPTION_LENGTH - KEYWORD_SUFFIX.length - 1)} ${KEYWORD_SUFFIX}`
    : `Shop the ${product.title} – a handmade canvas tote bag by Cardle, made to order in Sri Lanka.`

  const canonicalUrl = `https://cardle.lk/lk/products/${product.handle}`
  const ogImage = product.thumbnail || "https://cardle.lk/cardle-premium-cotton-totes-coming-soon.jpg"

  return {
    title: { absolute: title },
    description,
    keywords: [
      product.title!,
      `${product.title} canvas tote bag`,
      "handmade tote bag Sri Lanka",
      "canvas tote bag Sri Lanka",
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
      siteName: "Cardle",
      images: [
        {
          url: ogImage,
          width: 800,
          height: 1000,
          alt: `${product.title} – Cardle handcrafted canvas tote bag`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { countryCode, handle } = await params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  const pricedProduct = await getProductByHandle(handle, region.id)
  if (!pricedProduct) {
    notFound()
  }

  return (
    <>
      <ProductJsonLd product={pricedProduct} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://cardle.lk/lk" },
          { name: "Shop", url: "https://cardle.lk/lk/store" },
          { name: pricedProduct.title, url: `https://cardle.lk/lk/products/${pricedProduct.handle}` },
        ]}
      />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={countryCode}
      />
    </>
  )
}
