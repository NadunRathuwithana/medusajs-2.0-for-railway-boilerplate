import { Metadata } from "next"
import OnepayReturnClient from "./client"

export const metadata: Metadata = {
  title: "OnePay Payment",
  description: "Processing your OnePay payment",
}

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

/**
 * OnePay redirects the customer back here after payment.
 */
export default async function OnepayReturnPage({ params, searchParams }: Props) {
  const resolvedParams = await params
  const sp = await searchParams

  return <OnepayReturnClient searchParams={sp} countryCode={resolvedParams.countryCode} />
}
