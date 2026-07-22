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

  const title = `${product.title} | Cardle`
  const description = product.description
    ? product.description.slice(0, 160)
    : `Shop the ${product.title} – a handcrafted canvas tote bag by Cardle, made to order in Sri Lanka.`
  const canonicalUrl = `https://cardle.lk/products/${product.handle}`
  const ogImage = product.thumbnail || "https://cardle.lk/cardle-premium-cotton-totes-coming-soon.jpg"

  return {
    title,
    description,
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
      <ProductJsonLd
        product={pricedProduct}
        countryCode={countryCode}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://cardle.lk" },
          { name: "Shop", url: "https://cardle.lk/store" },
          { name: pricedProduct.title, url: `https://cardle.lk/products/${pricedProduct.handle}` },
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
