import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"

import AccountNav from "../components/account-nav"
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
    <div className="flex-1 bg-gray-50/50 py-8 small:py-12" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-7xl mx-auto flex flex-col px-4 small:px-8">
        <div className="grid grid-cols-1 small:grid-cols-[280px_1fr] gap-8 small:gap-12 py-6 small:py-8">
          <div className="sticky top-24 self-start">
            {customer && <AccountNav customer={customer} />}
          </div>
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 small:p-10 min-h-[600px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
