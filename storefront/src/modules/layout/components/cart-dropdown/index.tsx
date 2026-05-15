"use client"

import { Dialog, Transition } from "@headlessui/react"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState, useTransition } from "react"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { ShoppingBag, X, Lock, FileText, Truck, Tag, ChevronUp, ChevronDown, Minus, Plus } from "lucide-react"
import { updateLineItem } from "@lib/data/cart"
import Spinner from "@modules/common/icons/spinner"
import { getPricesForVariant } from "@lib/util/get-product-price"
import { getPercentageDiff } from "@lib/util/get-precentage-diff"

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const [cartOpen, setCartOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<"note" | "shipping" | "discount" | null>(null)
  
  const open = () => setCartOpen(true)
  const close = () => setCartOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)
  const pathname = usePathname()

  // auto-open cart drawer when adding items
  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart") && totalItems > itemRef.current) {
      open()
    }
    itemRef.current = totalItems
  }, [totalItems, pathname])

  return (
    <div className="h-full z-50">
      <button
        className="hover:text-ui-fg-base flex items-center h-full"
        onClick={open}
        data-testid="nav-cart-link"
      >
        <div className="relative flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-gray-800" strokeWidth={1.5} />
          {totalItems > 0 && (
            <span className="absolute -top-1.5 -right-2 flex min-w-[16px] h-[16px] px-1 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white ring-2 ring-white">
              {totalItems}
            </span>
          )}
        </div>
      </button>

      <Transition.Root show={cartOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={close}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-[480px] bg-white shadow-2xl flex flex-col rounded-l-3xl overflow-hidden relative">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between p-8 pb-6 border-b border-gray-100 relative z-0">
                      <div className="flex items-baseline gap-4">
                        <h2 className="text-[32px] font-bold tracking-tight text-black flex items-start leading-none">
                          Cart
                          <sup className="text-sm font-semibold ml-0.5 text-black">{totalItems}</sup>
                        </h2>
                      </div>
                      <button
                        onClick={close}
                        className="p-2.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar bg-white relative z-0">
                      {cartState && cartState.items?.length ? (
                        <div className="flex flex-col p-8 gap-y-8">
                          {cartState.items
                            .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
                            .map((item) => (
                              <SidebarCartItem key={item.id} item={item} />
                            ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-y-4">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">Your cart is empty</h3>
                          <p className="text-gray-500 text-sm max-w-[250px]">
                            Looks like you haven't added anything to your cart yet.
                          </p>
                          <LocalizedClientLink href="/store" className="mt-4">
                            <button onClick={close} className="px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors">
                              Explore products
                            </button>
                          </LocalizedClientLink>
                        </div>
                      )}
                    </div>

                    {/* Sub-panels (Order note, Shipping, Discount) sliding up over the bottom bar */}
                    <div className={`absolute bottom-0 left-0 right-0 z-30 p-6 bg-white rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.15)] transform transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${activePanel ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none"}`}>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[15px] font-medium text-black">
                          {activePanel === "note" ? "Order special instructions" : activePanel === "shipping" ? "Estimate shipping" : "Discount"}
                        </h3>
                        <button onClick={() => setActivePanel(null)} className="p-1 rounded flex items-center justify-center">
                          <X className="w-4 h-4 text-black" />
                        </button>
                      </div>

                      {activePanel === "note" && (
                        <div className="flex flex-col gap-4">
                          <textarea
                            placeholder="Order note"
                            className="w-full bg-[#f9f9f9] border-none rounded-xl p-4 min-h-[120px] text-sm resize-none focus:ring-1 focus:ring-black outline-none"
                          />
                          <button className="bg-[#111111] text-white px-8 py-3 rounded-full w-fit font-medium text-sm hover:bg-black transition-colors mt-2">
                            Apply
                          </button>
                        </div>
                      )}

                      {activePanel === "shipping" && (
                        <div className="flex flex-col gap-4">
                          <div className="relative">
                            <select className="w-full bg-[#f9f9f9] border-none rounded-xl px-4 pt-6 pb-2 text-sm appearance-none focus:ring-1 focus:ring-black outline-none cursor-pointer">
                              <option>---</option>
                              {/* more countries */}
                            </select>
                            <span className="absolute left-4 top-2 text-[10px] text-gray-500 pointer-events-none">Country/region</span>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                          </div>
                          <input
                            type="text"
                            placeholder="Postal/ZIP code"
                            className="w-full bg-[#f9f9f9] border-none rounded-xl p-4 text-sm focus:ring-1 focus:ring-black outline-none"
                          />
                          <button className="bg-[#111111] text-white px-8 py-3 rounded-full w-fit font-medium text-sm hover:bg-black transition-colors mt-2">
                            Calculate
                          </button>
                        </div>
                      )}

                      {activePanel === "discount" && (
                        <div className="flex flex-col gap-4">
                          <input
                            type="text"
                            placeholder="Discount code"
                            className="w-full bg-[#f9f9f9] border-none rounded-xl p-4 text-sm focus:ring-1 focus:ring-black outline-none"
                          />
                          <button className="bg-[#111111] text-white px-8 py-3 rounded-full w-fit font-medium text-sm hover:bg-black transition-colors mt-2">
                            Apply
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    {cartState && cartState.items && cartState.items.length > 0 && (
                      <div className="border-t border-gray-100 bg-[#fafafa] flex flex-col pb-8 pt-6 px-8 relative z-20">
                        {/* Quick links */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-6">
                          <button onClick={() => setActivePanel(activePanel === "note" ? null : "note")} className={`flex items-center gap-2 text-sm font-medium transition-colors ${activePanel === "note" ? "text-black" : "text-gray-600 hover:text-black"}`}>
                            <FileText className="w-4 h-4" /> Order note
                          </button>
                          <div className="w-px h-4 bg-gray-200" />
                          <button onClick={() => setActivePanel(activePanel === "shipping" ? null : "shipping")} className={`flex items-center gap-2 text-sm font-medium transition-colors ${activePanel === "shipping" ? "text-black" : "text-gray-600 hover:text-black"}`}>
                            <Truck className="w-4 h-4" /> Shipping
                          </button>
                          <div className="w-px h-4 bg-gray-200" />
                          <button onClick={() => setActivePanel(activePanel === "discount" ? null : "discount")} className={`flex items-center gap-2 text-sm font-medium transition-colors ${activePanel === "discount" ? "text-black" : "text-gray-600 hover:text-black"}`}>
                            <Tag className="w-4 h-4" /> Discount
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="flex justify-between items-start mb-6">
                          <p className="text-sm text-gray-600 max-w-[180px] leading-relaxed">
                            Taxes and <span className="underline decoration-gray-300 underline-offset-2 hover:text-black cursor-pointer">shipping</span> calculated at checkout
                          </p>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">Subtotal</p>
                            <p className="text-2xl font-bold text-black tracking-tight">
                              {convertToLocale({
                                amount: subtotal,
                                currency_code: cartState.currency_code,
                              })} {cartState.currency_code.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        {/* Checkout Button */}
                        <LocalizedClientLink href="/checkout" onClick={close} className="w-full block">
                          <button className="w-full h-[60px] bg-[#111111] hover:bg-black text-white rounded-[16px] flex items-center justify-center gap-2 font-medium text-[16px] transition-colors shadow-lg">
                            <Lock className="w-4 h-4" />
                            Check out
                          </button>
                        </LocalizedClientLink>
                      </div>
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  )
}

export default CartDropdown

const SidebarCartItem = ({ item }: { item: any }) => {
  const [optimisticQty, setOptimisticQty] = useState(item.quantity)
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const changeQuantity = (newQty: number) => {
    if (newQty < 1) return
    setOptimisticQty(newQty)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        try {
          await updateLineItem({
            lineId: item.id,
            quantity: newQty,
          })
        } catch (err) {
          setOptimisticQty(item.quantity) // Revert on error
        }
      })
    }, 500)
  }

  const { currency_code, calculated_price_number, original_price_number } = getPricesForVariant(item.variant) ?? {}
  const adjustmentsSum = (item.adjustments || []).reduce((acc: number, adj: any) => adj.amount + acc, 0)
  
  const originalPrice = (original_price_number || 0) * optimisticQty
  const currentPrice = (calculated_price_number || 0) * optimisticQty - adjustmentsSum
  const hasReducedPrice = currentPrice < originalPrice

  const formatPrice = (amount: number) => convertToLocale({ amount, currency_code: currency_code || "USD" })

  return (
    <div className="flex gap-6 w-full">
      {/* Thumbnail */}
      <LocalizedClientLink
        href={`/products/${item.variant?.product?.handle}`}
        className="w-[100px] h-[100px] bg-gray-100 rounded-xl overflow-hidden relative flex-shrink-0"
      >
        <Thumbnail
          thumbnail={item.variant?.product?.thumbnail}
          images={item.variant?.product?.images}
          size="full"
        />
      </LocalizedClientLink>
      
      {/* Item Details */}
      <div className="flex flex-col flex-1 justify-between min-w-0">
        <div>
          <h3 className="text-[15px] font-medium text-gray-900 leading-tight mb-1 truncate pr-8">
            {item.title}
          </h3>
          <LineItemOptions variant={item.variant} className="text-[13px] text-gray-500" />
          
          <div className="flex flex-col items-start gap-1.5 mt-1">
            <div className="flex items-center gap-2 text-[14px]">
              {hasReducedPrice ? (
                <>
                  <span className="text-gray-500 line-through relative">
                    {formatPrice(originalPrice)}
                  </span>
                  <span className="text-[#e11d48] font-medium">{formatPrice(currentPrice)}</span>
                </>
              ) : (
                <span className="text-black font-medium">{formatPrice(currentPrice)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions / Quantity */}
        <div className="flex items-center justify-between mt-2">
          {/* Quantity Pill */}
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-full px-1 py-1 w-[90px] shadow-sm">
            <button
              onClick={() => changeQuantity(optimisticQty - 1)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition-all disabled:opacity-40"
              disabled={optimisticQty <= 1}
            >
              <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
            <span className={`text-[13px] font-bold text-gray-900 w-5 text-center select-none transition-opacity ${isPending ? 'opacity-40' : ''}`}>
              {optimisticQty}
            </span>
            <button
              onClick={() => changeQuantity(optimisticQty + 1)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition-all"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>
          
          <DeleteButton
            id={item.id}
            className="text-[13px] text-gray-400 hover:text-[#e11d48] transition-colors"
          >
            Remove
          </DeleteButton>
        </div>
      </div>
    </div>
  )
}
