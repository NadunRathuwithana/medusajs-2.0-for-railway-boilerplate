"use client"

import { useParams, usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

const MobileAccountBack = () => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  if (route === `/${countryCode}/account`) return null

  return (
    <div className="small:hidden mb-2" data-testid="mobile-account-back">
      <LocalizedClientLink
        href="/account"
        className="inline-flex items-center gap-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors py-2"
        data-testid="account-main-link"
      >
        <ChevronDown className="transform rotate-90" />
        <span>Account Dashboard</span>
      </LocalizedClientLink>
    </div>
  )
}

export default MobileAccountBack
