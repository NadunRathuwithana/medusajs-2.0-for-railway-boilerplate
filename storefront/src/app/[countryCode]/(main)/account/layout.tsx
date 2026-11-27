import type { Metadata } from "next"
import { NOINDEX } from "@lib/util/site"
import { getCustomer } from "@lib/data/customer"
import AccountLayout from "@modules/account/templates/account-layout"

export const metadata: Metadata = { robots: NOINDEX }

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await getCustomer().catch(() => null)

  return (
    <AccountLayout customer={customer}>
      {customer ? dashboard : login}
    </AccountLayout>
  )
}
