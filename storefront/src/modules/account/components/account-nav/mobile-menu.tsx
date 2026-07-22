"use client"

import { useParams, usePathname } from "next/navigation"
import { useState } from "react"
import { ArrowRightOnRectangle } from "@medusajs/icons"
import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import User from "@modules/common/icons/user"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import Modal from "@modules/common/components/modal"
import { signout } from "@lib/data/customer"

const MobileAccountMenu = ({
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

  // Only show the bottom menu on the main account page
  if (route !== `/${countryCode}/account`) return null

  return (
    <>
      <div
        className="small:hidden bg-white rounded-xl shadow-sm border border-gray-100"
        data-testid="mobile-account-nav"
      >
        <div className="text-base-regular">
          <ul className="flex flex-col gap-y-1 p-2">
            <li>
              <LocalizedClientLink
                href="/account/profile"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                data-testid="profile-link"
              >
                <div className="flex items-center gap-x-3 text-gray-700">
                  <User size={20} />
                  <span className="font-medium">Profile</span>
                </div>
                <ChevronDown className="transform -rotate-90 text-gray-400" />
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink
                href="/account/addresses"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                data-testid="addresses-link"
              >
                <div className="flex items-center gap-x-3 text-gray-700">
                  <MapPin size={20} />
                  <span className="font-medium">Addresses</span>
                </div>
                <ChevronDown className="transform -rotate-90 text-gray-400" />
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink
                href="/account/orders"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                data-testid="orders-link"
              >
                <div className="flex items-center gap-x-3 text-gray-700">
                  <Package size={20} />
                  <span className="font-medium">Orders</span>
                </div>
                <ChevronDown className="transform -rotate-90 text-gray-400" />
              </LocalizedClientLink>
            </li>
            <li className="pt-1 border-t border-gray-100">
              <button
                type="button"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors w-full"
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

export default MobileAccountMenu
