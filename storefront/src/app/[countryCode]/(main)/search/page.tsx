import type { Metadata } from "next"
import { NOINDEX } from "@lib/util/site"
import SearchModal from "@modules/search/templates/search-modal"

export const metadata: Metadata = { title: "Search", robots: NOINDEX }

export default function SearchModalRoute() {
  return <SearchModal />
}
