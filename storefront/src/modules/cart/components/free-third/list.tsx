"use client"

import { addToCart } from "@lib/data/cart"
import { useState } from "react"

type Option = { variantId: string; title: string; thumbnail?: string; price: string }

export default function FreeThirdList({ options, countryCode }: { options: Option[]; countryCode: string }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const add = async (variantId: string) => {
    setBusy(variantId)
    setError(null)
    try {
      await addToCart({ variantId, quantity: 1, countryCode })
    } catch {
      setError("Could not add that one. Please try again.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 min-w-0 overflow-hidden" data-testid="free-third">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Buy 2 get 1 free</p>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Pick your 3rd tote, it's on us</h3>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {options.map((o) => (
          <div key={o.variantId} className="snap-start shrink-0 w-[140px] sm:w-[160px] flex flex-col gap-2">
            <div className="aspect-square rounded-xl bg-gray-50 overflow-hidden">
              {o.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.thumbnail} alt={o.title} className="w-full h-full object-cover" loading="lazy" />
              )}
            </div>
            <p className="text-[13px] font-medium text-gray-900 line-clamp-1">{o.title}</p>
            <p className="text-[12px] text-gray-400 line-through -mt-1.5">{o.price}</p>
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
    </div>
  )
}
