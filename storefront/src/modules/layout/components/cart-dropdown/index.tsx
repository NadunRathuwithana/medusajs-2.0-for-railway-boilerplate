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
import {
  ShoppingBag,
  X,
  Lock,
  Minus,
  Plus,
} from "lucide-react"
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
    if (
      itemRef.current !== totalItems &&
      !pathname.includes("/cart") &&
      totalItems > itemRef.current
    ) {
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
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full sm:pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-full sm:max-w-[480px] bg-white shadow-2xl flex flex-col rounded-none sm:rounded-l-3xl overflow-hidden relative">
                    {/* Header */}
                    <div className="flex items-center justify-between p-8 pb-6 border-b border-gray-100 relative z-0">
                      <div className="flex items-baseline gap-4">
                        <h2 className="text-[32px] font-bold tracking-tight text-bold flex items-start leading-none">
                          Cart
                          <sup className="text-sm font-semibold ml-0.5 text-bold">
                            {totalItems}
                          </sup>
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
                            .sort((a, b) =>
                              (a.created_at ?? "") > (b.created_at ?? "")
                                ? -1
                                : 1
                            )
                            .map((item) => (
                              <SidebarCartItem key={item.id} item={item} close={close} />
                            ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-y-4">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Your cart is empty
                          </h3>
                          <p className="text-gray-500 text-sm max-w-[250px]">
                            Looks like you haven't added anything to your cart
                            yet.
                          </p>
                          <LocalizedClientLink href="/store" className="mt-4">
                            <button
                              onClick={close}
                              className="px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
                            >
                              Explore products
                            </button>
                          </LocalizedClientLink>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    {cartState &&
                      cartState.items &&
                      cartState.items.length > 0 && (
                        <div className="border-t border-gray-100 bg-[#fafafa] flex flex-col pb-8 pt-6 px-8 relative z-20">
                          {/* Subtotal */}
                          <div className="flex justify-between items-start mb-6">
                            <p className="text-sm text-gray-600 max-w-[180px] leading-relaxed">
                              Shipping calculated at checkout
                            </p>
                            <div className="text-right">
                              <p className="text-sm text-gray-500 mb-1">
                                Subtotal
                              </p>
                              <p className="text-2xl font-bold text-bold tracking-tight">
                                {convertToLocale({
                                  amount: subtotal,
                                  currency_code: cartState.currency_code,
                                })}{" "}
                                {cartState.currency_code.toUpperCase()}
                              </p>
                            </div>
                          </div>

                          {/* Checkout Button */}
                          <LocalizedClientLink
                            href="/checkout"
                            onClick={close}
                            className="w-full block"
                          >
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

const SidebarCartItem = ({ item, close }: { item: any; close: () => void }) => {
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

  const { currency_code, calculated_price_number, original_price_number } =
    getPricesForVariant(item.variant) ?? {}
  const adjustmentsSum = (item.adjustments || []).reduce(
    (acc: number, adj: any) => adj.amount + acc,
    0
  )

  const originalPrice = (original_price_number || 0) * optimisticQty
  const currentPrice =
    (calculated_price_number || 0) * optimisticQty - adjustmentsSum
  const hasReducedPrice = currentPrice < originalPrice

  const formatPrice = (amount: number) =>
    convertToLocale({ amount, currency_code: currency_code || "USD" })

  return (
    <div className="flex gap-6 w-full">
      {/* Thumbnail */}
      <LocalizedClientLink
        href={`/products/${item.variant?.product?.handle}`}
        onClick={close}
        className="w-[100px] h-[100px] bg-gray-100 rounded-xl overflow-hidden relative flex-shrink-0"
      >
        <Thumbnail
          thumbnail={item.thumbnail}
          size="square"
          className="absolute inset-0 w-full h-full p-0 shadow-none border-none rounded-none [&_img]:!object-cover [&_img]:!object-center"
        />
      </LocalizedClientLink>

      {/* Item Details */}
      <div className="flex flex-col flex-1 justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between mb-1">
            <LocalizedClientLink
              href={`/products/${item.variant?.product?.handle}`}
              onClick={close}
            >
              <h3 className="text-[15px] font-medium text-gray-900 hover:text-gray-600 leading-tight truncate pr-4 transition-colors">
                {item.title}
              </h3>
            </LocalizedClientLink>
            <DeleteButton
              id={item.id}
              className="text-gray-400 transition-colors -mt-1 -mr-1 p-1 hover:text-[#e11d48]"
            />
          </div>
          <LineItemOptions
            variant={item.variant}
            className="text-[13px] text-gray-500 mb-2"
          />
        </div>

        {/* Price & Quantity */}
        <div className="flex items-center justify-between mt-auto">
          {/* Price */}
          <div className="flex items-center gap-2 text-[14px]">
            {hasReducedPrice ? (
              <>
                <span className="text-gray-500 line-through relative">
                  {formatPrice(originalPrice)}
                </span>
                <span className="text-[#e11d48] font-medium">
                  {formatPrice(currentPrice)}
                </span>
              </>
            ) : (
              <span className="text-bold font-medium">
                {formatPrice(currentPrice)}
              </span>
            )}
          </div>

          {/* Quantity Pill */}
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-full px-1 py-1 w-[90px] shadow-sm">
            <button
              onClick={() => changeQuantity(optimisticQty - 1)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-bold transition-all disabled:opacity-40"
              disabled={optimisticQty <= 1}
            >
              <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
            <span
              className={`text-[13px] font-bold text-gray-900 w-5 text-center select-none transition-opacity ${
                isPending ? "opacity-40" : ""
              }`}
            >
              {optimisticQty}
            </span>
            <button
              onClick={() => changeQuantity(optimisticQty + 1)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
