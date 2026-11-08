"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { HttpTypes } from "@medusajs/types"
import { Packing as PackingData } from "@lib/data/addons"
import { setPacking } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import ZoomableImage from "@modules/common/components/image-lightbox"

/**
 * Packing choice at checkout. The default option is preselected and included,
 * so customers can ignore this section and carry on.
 */
export default function Packing({
  cart,
  packing,
}: {
  cart: HttpTypes.StoreCart
  packing: PackingData
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [optimistic, setOptimistic] = useState<string | null>(null)

  if (!packing.enabled || packing.options.length === 0) return null

  const saved = (cart.metadata as any)?.packing_id as string | null | undefined
  const known = packing.options.some((o) => o.id === saved)
  const selectedId = known ? (saved as string) : packing.default_id ?? packing.options[0].id
  const current = optimistic ?? selectedId

  const choose = (id: string) => {
    if (id === current || isPending) return
    setError(null)
    setOptimistic(id)
    startTransition(async () => {
      try {
        await setPacking(id)
        router.refresh()
      } catch (e: any) {
        setOptimistic(null)
        setError(e?.message || "Could not change packing")
      }
    })
  }

  const money = (n: number) =>
    n > 0
      ? `+ ${convertToLocale({ amount: n, currency_code: cart.currency_code, maximumFractionDigits: 0 })}`
      : "Included"

  return (
    <section className="bg-white" data-testid="packing-step">
      <div className="flex flex-col gap-y-1 pb-4">
        <h2 className="text-2xl-regular font-semibold text-gray-900">Packing</h2>
        <p className="text-sm text-gray-500">
          Your order is packed as standard. Pick an upgrade if you like, it is optional.
        </p>
      </div>
      <ul className="flex flex-col gap-y-2" role="radiogroup" aria-label="Packing">
        {packing.options.map((o) => {
          const on = o.id === current
          return (
            <li
              key={o.id}
              className={`flex items-center gap-x-3 rounded-xl border p-2.5 transition-colors ${
                on ? "border-black bg-gray-50" : "border-gray-200"
              } ${isPending ? "opacity-70" : ""}`}
            >
              {o.image ? (
                <ZoomableImage src={o.image} alt={o.name} className="h-20 w-20" />
              ) : (
                <div className="h-20 w-20 shrink-0 rounded-lg bg-gray-100" />
              )}
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-x-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-gray-900">
                    {o.name}
                    {o.is_default && (
                      <span className="ml-2 rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Standard
                      </span>
                    )}
                  </span>
                  {o.description && <span className="block text-xs text-gray-500 line-clamp-2">{o.description}</span>}
                  <span className="mt-0.5 block text-xs font-semibold text-gray-900">{money(o.is_default ? 0 : o.price)}</span>
                </span>
                <input
                  type="radio"
                  name="packing"
                  checked={on}
                  onChange={() => choose(o.id)}
                  className="h-5 w-5 shrink-0 accent-black"
                  aria-label={o.name}
                />
              </label>
            </li>
          )
        })}
      </ul>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-8 h-px w-full bg-gray-200" />
    </section>
  )
}
