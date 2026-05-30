"use client"

import { Popover, Transition } from "@headlessui/react"
import { XMark } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { Fragment } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const SideMenuItems = {
  Home: "/",
  Store: "/store",
  Cart: "/cart",
  Account: "/account",
}

const SideMenu = ({ regions }: { regions: HttpTypes.StoreRegion[] | null }) => {
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
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 animate-in fade-in" 
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
                <Popover.Panel className="fixed inset-y-0 left-0 w-full sm:max-w-[320px] bg-[#111111] text-white z-[101] shadow-2xl flex flex-col justify-between p-8">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full justify-between"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
                      <div>
                        <img src="/LogoLight.png" alt="Cardle Logo" className="h-6 w-auto mb-2" />
                        <p className="text-[9px] font-bold tracking-[0.2em] text-gray-500 capitalize mt-0.5">
                          Everyday Carry
                        </p>
                      </div>
                      <button
                        data-testid="close-menu-button"
                        onClick={close}
                        className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-transform duration-300 hover:rotate-90"
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

                    {/* Footer */}
                    <div className="flex flex-col gap-y-6 border-t border-zinc-800 pt-6">
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
