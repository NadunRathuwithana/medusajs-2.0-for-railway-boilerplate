import { NOINDEX } from "@lib/util/site"
import { Metadata } from "next"

import SearchResultsTemplate from "@modules/search/templates/search-results-template"

import { search } from "@modules/search/actions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export const metadata: Metadata = {
  robots: NOINDEX,
  title: "Search",
  description: "Explore all of our products.",
}

type Params = {
  params: Promise<{ query: string; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export default async function SearchResults(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams

  let query = params.query
  try { query = decodeURIComponent(params.query) } catch {}
  const { sortBy } = searchParams
  const page = String(Math.max(1, parseInt(searchParams.page || "1") || 1))

  const hits = await search(query).catch(() => [] as any[])

  const ids = hits
    .map((h) => h.objectID || h.id)
    .filter((id): id is string => {
      return typeof id === "string"
    })

  return (
    <SearchResultsTemplate
      query={query}
      ids={ids}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
    />
  )
}
