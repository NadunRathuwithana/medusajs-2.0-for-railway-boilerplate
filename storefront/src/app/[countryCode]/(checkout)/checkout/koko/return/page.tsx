import { Metadata } from "next"
import KokoReturnClient from "./client"

export const metadata: Metadata = {
  title: "Koko Payment | Cardle",
  description: "Processing your Koko payment",
}

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

/**
 * Koko redirects the customer back here after payment.
 */
import { getCustomer } from "@lib/data/customer"

export default async function KokoReturnPage({ params, searchParams }: Props) {
  const resolvedParams = await params
  const sp = await searchParams
  const customer = await getCustomer()

  return <KokoReturnClient searchParams={sp} countryCode={resolvedParams.countryCode} isLoggedIn={!!customer} />
}
