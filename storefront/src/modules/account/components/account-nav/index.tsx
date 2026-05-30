"use client"

import { clx, Button, Heading } from "@medusajs/ui"
import { ArrowRightOnRectangle } from "@medusajs/icons"
import { useParams, usePathname } from "next/navigation"
import { useState } from "react"

import ChevronDown from "@modules/common/icons/chevron-down"
import User from "@modules/common/icons/user"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Modal from "@modules/common/components/modal"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"

const HomeIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
)

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }
  const [showLogout, setShowLogout] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signout(countryCode)
  }

  return (
    <>
      <div>
      <div className="small:hidden bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8" data-testid="mobile-account-nav">
        {route !== `/${countryCode}/account` ? (
          <LocalizedClientLink
            href="/account"
            className="flex items-center gap-x-2 text-small-regular py-2 text-gray-700 hover:text-gray-900 transition-colors"
            data-testid="account-main-link"
          >
            <>
              <ChevronDown className="transform rotate-90" />
              <span className="font-medium">Account Dashboard</span>
            </>
          </LocalizedClientLink>
        ) : (
          <>
            <div className="text-xl-semi mb-6 px-4 pt-2">
              Hello, <span className="font-semibold">{customer?.first_name}</span>
            </div>
            <div className="text-base-regular">
              <ul className="flex flex-col gap-y-2">
                <li>
                  <LocalizedClientLink
                    href="/account/profile"
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
                    data-testid="profile-link"
                  >
                    <>
                      <div className="flex items-center gap-x-3 text-gray-700">
                        <User size={20} />
                        <span className="font-medium">Profile</span>
                      </div>
                      <ChevronDown className="transform -rotate-90 text-gray-400" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/addresses"
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
                    data-testid="addresses-link"
                  >
                    <>
                      <div className="flex items-center gap-x-3 text-gray-700">
                        <MapPin size={20} />
                        <span className="font-medium">Addresses</span>
                      </div>
                      <ChevronDown className="transform -rotate-90 text-gray-400" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/orders"
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
                    data-testid="orders-link"
                  >
                    <div className="flex items-center gap-x-3 text-gray-700">
                      <Package size={20} />
                      <span className="font-medium">Orders</span>
                    </div>
                    <ChevronDown className="transform -rotate-90 text-gray-400" />
                  </LocalizedClientLink>
                </li>
                <li className="mt-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-red-50 text-red-600 transition-colors w-full"
                    onClick={() => setShowLogout(true)}
                    data-testid="logout-button"
                  >
                    <div className="flex items-center gap-x-3">
                      <ArrowRightOnRectangle />
                      <span className="font-medium">Log out</span>
                    </div>
                    <ChevronDown className="transform -rotate-90 text-red-300" />
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
      
      <div className="hidden small:block" data-testid="account-nav">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="pb-6 mb-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Account</h3>
            <p className="text-sm text-gray-500 mt-1">Manage your details & orders</p>
          </div>
          <div className="text-base-regular">
            <ul className="flex mb-0 justify-start items-start flex-col gap-y-2">
              <li className="w-full">
                <AccountNavLink
                  href="/account"
                  route={route!}
                  data-testid="overview-link"
                  icon={<HomeIcon size={20} />}
                >
                  Overview
                </AccountNavLink>
              </li>
              <li className="w-full">
                <AccountNavLink
                  href="/account/orders"
                  route={route!}
                  data-testid="orders-link"
                  icon={<Package size={20} />}
                >
                  Orders
                </AccountNavLink>
              </li>
              <li className="w-full">
                <AccountNavLink
                  href="/account/addresses"
                  route={route!}
                  data-testid="addresses-link"
                  icon={<MapPin size={20} />}
                >
                  Addresses
                </AccountNavLink>
              </li>
              <li className="w-full">
                <AccountNavLink
                  href="/account/profile"
                  route={route!}
                  data-testid="profile-link"
                  icon={<User size={20} />}
                >
                  Profile
                </AccountNavLink>
              </li>
              <li className="w-full mt-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  className="flex items-center gap-x-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out text-base-regular text-gray-500 hover:bg-red-50 hover:text-red-600 font-medium w-full"
                  onClick={() => setShowLogout(true)}
                  data-testid="logout-button"
                >
                  <ArrowRightOnRectangle />
                  <span>Log out</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    <Modal isOpen={showLogout} close={() => setShowLogout(false)}>
      <Modal.Title>Confirm Log Out</Modal.Title>
      <Modal.Body>
        <p className="text-gray-600 text-base mb-2">
          Are you sure you want to log out of your account? 
        </p>
        <p className="text-gray-500 text-sm">
          You will need to sign back in to access your orders and profile.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => setShowLogout(false)}
          className="rounded-full px-6 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 font-medium transition-colors"
        >
          Cancel
        </Button>
        <Button
          onClick={handleLogout}
          isLoading={isLoggingOut}
          className="rounded-full px-6 py-2 bg-red-600 text-white hover:bg-red-700 border border-red-600 font-medium transition-colors"
        >
          Log Out
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  children: React.ReactNode
  "data-testid"?: string
  icon?: React.ReactNode
}

const AccountNavLink = ({
  href,
  route,
  children,
  "data-testid": dataTestId,
  icon
}: AccountNavLinkProps) => {
  const { countryCode }: { countryCode: string } = useParams()

  const active = route.split(countryCode)[1] === href
  return (
    <LocalizedClientLink
      href={href}
      className={clx(
        "flex items-center gap-x-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out text-base-regular w-full group",
        {
          "bg-gray-100 text-gray-900 font-semibold shadow-sm": active,
          "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium": !active,
        }
      )}
      data-testid={dataTestId}
    >
      <div className={clx("transition-transform duration-300", {
        "text-gray-900": active,
        "text-gray-400 group-hover:text-gray-700": !active,
      })}>
        {icon}
      </div>
      <span>{children}</span>
    </LocalizedClientLink>
  )
}

export default AccountNav
