import { Metadata } from "next"
import MintpayReturnClient from "./client"
import { getCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Mintpay Payment | Cardle",
  description: "Processing your Mintpay payment",
}

type Props = {
  params: Promise<{ countryCode: string }>
}

/**
 * Mintpay redirects the customer back here (success_url) after payment.
 */
export default async function MintpayReturnPage({ params }: Props) {
  const resolvedParams = await params
  const customer = await getCustomer()

  return (
    <MintpayReturnClient
      countryCode={resolvedParams.countryCode}
      isLoggedIn={!!customer}
    />
  )
}
