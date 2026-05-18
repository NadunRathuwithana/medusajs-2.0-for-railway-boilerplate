import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import PopularProducts from "@modules/home/components/popular-products"
import FeatureGrid from "@modules/home/components/feature-grid"
import AllProducts from "@modules/home/components/all-products"
import PromoBanner from "@modules/home/components/promo-banner"
import { getCollectionsWithProducts } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Medusa Next.js Starter Template",
  description:
    "A performant frontend ecommerce starter template with Next.js 14 and Medusa.",
}

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { countryCode } = await params
  const { page } = await searchParams
  const pageNumber = page ? parseInt(page) : 1

  const collections = await getCollectionsWithProducts(countryCode)
  const region = await getRegion(countryCode)

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <div className="flex flex-col gap-16 small:gap-24 py-16 small:py-24">
        <PopularProducts countryCode={countryCode} collectionHandle="popular" />
        <PopularProducts countryCode={countryCode} title="New Arrivals" collectionHandle="new-arrivals" />
        <FeatureGrid />
        <AllProducts countryCode={countryCode} page={pageNumber} />
        <PromoBanner />
      </div>
    </>
  )
}
