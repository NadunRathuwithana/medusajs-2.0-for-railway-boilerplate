import Package from "@modules/common/icons/package"
import MapPin from "@modules/common/icons/map-pin"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
  const orderCount = orders?.length ?? 0
  const addressCount = customer?.addresses?.length ?? 0
  const firstName = customer?.first_name ?? "there"

  const totalSpent = orders?.reduce((acc, o) => acc + (o.total ?? 0), 0) ?? 0
  const currency = orders?.[0]?.currency_code

  return (
    <div data-testid="overview-page-wrapper" className="flex flex-col gap-8">

      {/* Hero greeting */}
      <div className="relative rounded-3xl bg-[#111111] text-white px-8 py-10 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 right-20 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Dashboard</p>
        <h1
          className="text-3xl font-bold tracking-tight mb-1"
          data-testid="welcome-message"
          data-value={customer?.first_name}
        >
          Hey, {firstName}
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          Here's what's happening with your account.
        </p>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-3">
          <div className="bg-white/10 rounded-2xl px-5 py-3 flex flex-col gap-0.5 min-w-[120px]">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Orders</span>
            <span
              className="text-2xl font-bold leading-none"
              data-testid="orders-count"
              data-value={orderCount}
            >
              {orderCount}
            </span>
          </div>

          <div className="bg-white/10 rounded-2xl px-5 py-3 flex flex-col gap-0.5 min-w-[120px]">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Addresses</span>
            <span
              className="text-2xl font-bold leading-none"
              data-testid="addresses-count"
              data-value={addressCount}
            >
              {addressCount}
            </span>
          </div>

          {currency && totalSpent > 0 && (
            <div className="bg-white/10 rounded-2xl px-5 py-3 flex flex-col gap-0.5 min-w-[160px]">
              <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Spent</span>
              <span className="text-2xl font-bold leading-none">
                {convertToLocale({ amount: totalSpent, currency_code: currency })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <LocalizedClientLink
          href="/account/profile"
          className="group flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
        >
          <div className="h-11 w-11 rounded-xl bg-gray-100 group-hover:bg-black group-hover:text-white text-gray-600 flex items-center justify-center transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">Profile</p>
            <p className="text-xs text-gray-400 mt-0.5">Edit your details</p>
          </div>
        </LocalizedClientLink>

        <LocalizedClientLink
          href="/account/addresses"
          className="group flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
        >
          <div className="h-11 w-11 rounded-xl bg-gray-100 group-hover:bg-black group-hover:text-white text-gray-600 flex items-center justify-center transition-colors duration-300">
            <MapPin size={20} />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">Addresses</p>
            <p className="text-xs text-gray-400 mt-0.5">{addressCount} saved</p>
          </div>
        </LocalizedClientLink>
      </div>

      {/* Recent Orders */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-gray-900">Recent Orders</h2>
          {orderCount > 0 && (
            <LocalizedClientLink
              href="/account/orders"
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider"
            >
              View all →
            </LocalizedClientLink>
          )}
        </div>

        {orders && orders.length > 0 ? (
          <ul className="flex flex-col gap-3" data-testid="orders-wrapper">
            {orders.slice(0, 5).map((order) => {
              const thumb = order.items?.[0]?.thumbnail
              const itemCount = order.items?.reduce((a, i) => a + i.quantity, 0) ?? 0
              return (
                <li key={order.id} data-testid="order-wrapper" data-value={order.id}>
                  <LocalizedClientLink
                    href={`/account/orders/details/${order.id}`}
                    className="group flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                      {thumb ? (
                        <img src={thumb} alt="Order item" className="w-full h-full object-cover object-center" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package size={22} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900" data-testid="order-id" data-value={order.display_id}>
                        Order #{order.display_id}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span data-testid="order-created-date">
                          {new Date(order.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span>·</span>
                        <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
                      </div>
                    </div>

                    {/* Amount + arrow */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="font-semibold text-sm text-gray-900" data-testid="order-amount">
                        {convertToLocale({ amount: order.total, currency_code: order.currency_code })}
                      </p>
                      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </div>
                  </LocalizedClientLink>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4 text-gray-300">
              <Package size={32} />
            </div>
            <p className="font-semibold text-gray-900 mb-1" data-testid="no-orders-message">No orders yet</p>
            <p className="text-sm text-gray-400 mb-6">Start shopping and your orders will appear here.</p>
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center gap-2 bg-black text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
            >
              Shop Now
            </LocalizedClientLink>
          </div>
        )}
      </div>

    </div>
  )
}

export default Overview
