"use client"

import { Popover, Transition } from "@headlessui/react"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { Fragment } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import { HttpTypes } from "@medusajs/types"

const SideMenuItems = {
  Home: "/",
  Store: "/store",
  Search: "/search",
  Account: "/account",
  Cart: "/cart",
}

const SideMenu = ({ regions }: { regions: HttpTypes.StoreRegion[] | null }) => {
  const toggleState = useToggleState()

  return (
    <div className="h-full">
      <style>{`
        @keyframes mobileLinkReveal {
          from {
            opacity: 0;
            transform: translateX(-16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-mobile-link {
          opacity: 0;
          animation: mobileLinkReveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              {/* Asymmetrical Hamburger Button */}
              <div className="relative flex h-full items-center">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative h-full flex flex-col justify-center items-start gap-1.5 focus:outline-none py-2 group cursor-pointer"
                >
                  <span className="w-6 h-0.5 bg-black rounded-full transition-all duration-300 group-hover:w-4" />
                  <span className="w-4 h-0.5 bg-black rounded-full transition-all duration-300 group-hover:w-6" />
                </Popover.Button>
              </div>

              {/* Backdrop Overlay with Blur */}
              {open && (
                <div 
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 animate-in fade-in" 
                  onClick={close} 
                />
              )}

              {/* Drawer Slide-In Panel */}
              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in duration-200 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Popover.Panel className="fixed inset-y-0 left-0 w-full sm:max-w-[320px] bg-[#111111] text-white z-50 shadow-2xl flex flex-col justify-between p-8">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full justify-between"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
                      <div>
                        <span className="text-xl font-black capitalize tracking-widest text-white">
                          Cardle
                        </span>
                        <p className="text-[9px] font-bold tracking-[0.2em] text-gray-500 capitalize mt-0.5">
                          Everyday Carry
                        </p>
                      </div>
                      <button
                        data-testid="close-menu-button"
                        onClick={close}
                        className="w-8 h-8 rounded-full bg-white text-bold flex items-center justify-center hover:bg-gray-200 transition-transform duration-300 hover:rotate-90"
                      >
                        <XMark />
                      </button>
                    </div>

                    {/* Staggered Navigation Links */}
                    <ul className="flex flex-col gap-6 items-start justify-start my-8">
                      {Object.entries(SideMenuItems).map(([name, href], index) => {
                        return (
                          <li
                            key={name}
                            className="animate-mobile-link"
                            style={{ animationDelay: `${120 + index * 30}ms` }}
                          >
                            <LocalizedClientLink
                              href={href}
                              className="text-2xl font-bold capitalize tracking-tight text-white hover:text-gray-400 transition-colors"
                              onClick={close}
                              data-testid={`${name.toLowerCase()}-link`}
                            >
                              {name}
                            </LocalizedClientLink>
                          </li>
                        )
                      })}
                    </ul>

                    {/* Footer / Region Selector */}
                    <div className="flex flex-col gap-y-6 border-t border-zinc-800 pt-6">
                      <div
                        className="flex justify-between items-center text-gray-300 hover:text-white transition-colors cursor-pointer"
                        onMouseEnter={toggleState.open}
                        onMouseLeave={toggleState.close}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={toggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150 text-white",
                            toggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="flex justify-between text-[11px] font-semibold text-gray-500 tracking-wider capitalize">
                        © {new Date().getFullYear()} Cardle. All rights
                        reserved.
                      </Text>
                    </div>
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
