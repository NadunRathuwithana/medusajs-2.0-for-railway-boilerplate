import React from "react"

import AccountNav from "../components/account-nav"
import MobileAccountBack from "../components/account-nav/mobile-back"
import MobileAccountMenu from "../components/account-nav/mobile-menu"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  if (!customer) {
    return (
      <div className="flex-1 min-h-[calc(100vh-64px)] flex flex-col bg-white" data-testid="account-page">
        {children}
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gray-50/50 py-4 small:py-12" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-7xl mx-auto flex flex-col px-4 small:px-8">

        {/* Mobile only: back button — shown only on sub-pages, always at very top */}
        <MobileAccountBack />

        <div className="grid grid-cols-1 small:grid-cols-[280px_1fr] gap-4 small:gap-12 py-3 small:py-8">
          {/* Desktop sidebar — hidden on mobile */}
          <div className="hidden small:block small:sticky small:top-24 small:self-start">
            {customer && <AccountNav customer={customer} />}
          </div>

          {/* Main content */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 small:p-10 min-h-[400px] small:min-h-[600px]">
            {children}
          </div>
        </div>

        {/* Mobile only: bottom menu — shown only on main account page */}
        <MobileAccountMenu customer={customer} />

      </div>
    </div>
  )
}

export default AccountLayout
