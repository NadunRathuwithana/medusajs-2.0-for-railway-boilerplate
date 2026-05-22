import { Container } from "@medusajs/ui"

import ChevronDown from "@modules/common/icons/chevron-down"
import User from "@modules/common/icons/user"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
  const profileCompletion = getProfileCompletion(customer)
  
  return (
    <div data-testid="overview-page-wrapper">
      <div className="hidden small:block">
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" data-testid="welcome-message" data-value={customer?.first_name}>
              Welcome back, {customer?.first_name}
            </h1>
            <p className="text-gray-500">
              Manage your account details and view your recent orders.
            </p>
          </div>
          <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
            Signed in as:{" "}
            <span
              className="font-medium text-gray-900"
              data-testid="customer-email"
              data-value={customer?.email}
            >
              {customer?.email}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center gap-x-6 hover:bg-gray-100 transition-colors">
            <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <User size={28} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Profile</h3>
              <div className="flex items-end gap-x-2">
                <span
                  className="text-2xl font-bold text-gray-900 leading-none"
                  data-testid="customer-profile-completion"
                  data-value={profileCompletion}
                >
                  {profileCompletion}%
                </span>
                <span className="text-sm text-gray-500 font-medium">
                  Completed
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center gap-x-6 hover:bg-gray-100 transition-colors">
            <div className="h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <MapPin size={28} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Addresses</h3>
              <div className="flex items-end gap-x-2">
                <span
                  className="text-2xl font-bold text-gray-900 leading-none"
                  data-testid="addresses-count"
                  data-value={customer?.addresses?.length || 0}
                >
                  {customer?.addresses?.length || 0}
                </span>
                <span className="text-sm text-gray-500 font-medium">
                  Saved
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-x-2">
              <Package size={24} className="text-gray-400" />
              <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
            </div>
            <LocalizedClientLink href="/account/orders" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all
            </LocalizedClientLink>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <ul
              className="flex flex-col"
              data-testid="orders-wrapper"
            >
              {orders && orders.length > 0 ? (
                orders.slice(0, 5).map((order, index) => {
                  return (
                    <li
                      key={order.id}
                      data-testid="order-wrapper"
                      data-value={order.id}
                      className={`hover:bg-gray-50 transition-colors ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                    >
                      <LocalizedClientLink
                        href={`/account/orders/details/${order.id}`}
                        className="block p-5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="grid grid-cols-3 gap-x-8 flex-1">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date placed</p>
                              <p className="font-medium text-gray-900" data-testid="order-created-date">
                                {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Order number</p>
                              <p className="font-medium text-gray-900" data-testid="order-id" data-value={order.display_id}>
                                #{order.display_id}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total amount</p>
                              <p className="font-medium text-gray-900" data-testid="order-amount">
                                {convertToLocale({
                                  amount: order.total,
                                  currency_code: order.currency_code,
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 group-hover:bg-gray-50 transition-colors">
                            <ChevronDown className="-rotate-90" />
                          </div>
                        </div>
                      </LocalizedClientLink>
                    </li>
                  )
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Package size={48} className="mx-auto mb-4 text-gray-300" />
                  <p data-testid="no-orders-message" className="text-lg font-medium text-gray-900 mb-1">No recent orders</p>
                  <p>You haven't placed any orders yet.</p>
                </div>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
