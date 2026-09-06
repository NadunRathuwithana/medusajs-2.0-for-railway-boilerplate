import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Buy Cotton Tote Bags Online Sri Lanka | Cardle Store",
  description: "Browse the Cardle collection. Premium handcrafted cotton tote bags made to order in Sri Lanka.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage({ searchParams, params }: Params) {
  // Next.js 15 made these Promises — destructuring them directly (as this
  // used to) still worked via a deprecation-warned compatibility shim, but
  // that shim is going away, so it was one Next.js upgrade away from every
  // sortBy value silently coming back undefined.
  const { sortBy } = await searchParams
  const { countryCode } = await params

  return <StoreTemplate sortBy={sortBy} countryCode={countryCode} />
}
