"use client"

import { Dialog, Transition } from "@headlessui/react"
import { addToCart } from "@lib/data/cart"
import { Fragment, useState } from "react"
import type { FreeOption } from "./options"

export default function FreeThirdDialog({
  open,
  options,
  countryCode,
  onClose,
  onSkip,
}: {
  open: boolean
  options: FreeOption[]
  countryCode: string
  onClose: () => void
  onSkip: () => void
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const add = async (variantId: string) => {
    setBusy(variantId)
    setError(null)
    try {
      await addToCart({ variantId, quantity: 1, countryCode })
      onClose()
    } catch {
      setError("Could not add that one. Please try again.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-4">
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95">
            <Dialog.Panel className="w-full sm:max-w-[640px] bg-white rounded-t-3xl sm:rounded-3xl shadow-xl p-5 sm:p-7 max-h-[90vh] overflow-y-auto" data-testid="free-third-dialog">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Buy 2 get 1 free</p>
              <Dialog.Title className="text-lg sm:text-xl font-semibold text-gray-900 mt-1">
                Wait, your 3rd tote is free
              </Dialog.Title>
              <p className="text-[13px] text-gray-500 mt-1">Pick one below and we'll add it at no cost.</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                {options.map((o) => (
                  <div key={o.variantId} className="flex flex-col gap-2">
                    <div className="aspect-square rounded-xl bg-gray-50 overflow-hidden">
                      {o.thumbnail && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.thumbnail} alt={o.title} className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[13px] font-medium text-gray-900 line-clamp-1">{o.title}</p>
                      <p className="text-[11px] text-gray-400 line-through shrink-0">{o.price}</p>
                    </div>
                    <button
                      onClick={() => add(o.variantId)}
                      disabled={!!busy}
                      className="h-9 rounded-lg bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {busy === o.variantId ? "Adding..." : "Add free"}
                    </button>
                  </div>
                ))}
              </div>

              {error && <p className="text-[13px] text-rose-600 mt-3">{error}</p>}

              <button
                onClick={onSkip}
                disabled={!!busy}
                className="w-full mt-5 h-11 rounded-xl text-[14px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                data-testid="free-third-skip"
              >
                No thanks, continue to checkout
              </button>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
