import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import { User, ShoppingBag } from "lucide-react"
import Image from "next/image"

export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <div className="hidden small:flex items-center justify-center bg-zinc-900 text-white text-xs font-medium py-1.5 capitalize tracking-wide">
        10% Off Sitewide | 5% Off for all Card Payments
      </div>
      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                href="/store"
                className="hover:text-ui-fg-base capitalize font-medium"
              >
                Store
              </LocalizedClientLink>
              {/* <LocalizedClientLink
                href="/customize"
                className="hover:text-ui-fg-base capitalize font-medium"
              >
                Customize Your Bag
              </LocalizedClientLink> */}
            </div>
            <div className="small:hidden h-full">
              <SideMenu regions={regions} />
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center justify-center"
              data-testid="nav-store-link"
            >
              <img src="/cardle-premium-cotton-tote-bags-logo.png" alt="Logo" className="h-6 w-auto" />
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              {process.env.NEXT_PUBLIC_FEATURE_SEARCH_ENABLED && (
                <LocalizedClientLink
                  className="hover:text-ui-fg-base"
                  href="/search"
                  scroll={false}
                  data-testid="nav-search-link"
                >
                  Search
                </LocalizedClientLink>
              )}
              <LocalizedClientLink
                className="hover:text-ui-fg-base flex items-center gap-2"
                href="/account"
                data-testid="nav-account-link"
              >
                <User className="h-5 w-5" strokeWidth={1.5} />
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex items-center gap-2 relative"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
