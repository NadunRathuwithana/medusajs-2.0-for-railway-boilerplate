"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { clx } from "@medusajs/ui"
import { Packing as PackingData, PackingOption } from "@lib/data/addons"
import { setPacking } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { Lightbox } from "@modules/common/components/image-lightbox"
import { setOptimisticPacking, usePackingSelection } from "./packing-store"

/**
 * Order-summary packing block. Standard packing is always included (free);
 * extras like a gift box or bag are optional checkboxes.
 */
export default function Packing({ cart, packing }: { cart: any; packing: PackingData }) {
  const router = useRouter()
  const [zoom, setZoom] = useState<PackingOption | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { current, synced } = usePackingSelection(cart, packing)
  const latest = useRef<string[]>(current)
  const running = useRef(false)

  // Once the server cart matches what the user picked, drop the optimistic copy.
  useEffect(() => {
    if (synced && !running.current) setOptimisticPacking(null)
  }, [synced])

  if (!packing?.enabled) return null

  // Show first, sync later: update the UI instantly, send the latest choice in the background.
  const flush = async () => {
    if (running.current) return
    running.current = true
    try {
      let sent: string[]
      do {
        sent = latest.current
        await setPacking(sent)
      } while (sent.join() !== latest.current.join())
      router.refresh()
    } catch (e: any) {
      setOptimisticPacking(null)
      setError(e?.message || "Could not update packing")
    } finally {
      running.current = false
    }
  }

  const toggle = (id: string) => {
    const base = running.current ? latest.current : current
    const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id]
    latest.current = next
    setError(null)
    setOptimisticPacking(next)
    flush()
  }

  const money = (n: number) =>
    n > 0 ? `+${convertToLocale({ amount: n, currency_code: cart.currency_code, maximumFractionDigits: 0 })}` : "Free"

  return (
    <div className="mb-4" data-testid="packing-summary">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[14px] font-semibold text-gray-900">Packing</span>
        <span className="text-[12px] text-gray-400">{packing.default_name || "Standard packing"} included</span>
      </div>

      {packing.options.length > 0 && (
        <ul className="flex flex-col gap-y-2">
          {packing.options.map((o) => {
            const on = current.includes(o.id)
            return (
              <li key={o.id}>
                <div className={clx("flex items-center gap-x-3 rounded-xl border px-2.5 py-2 transition-colors",
                  on ? "border-black bg-white" : "border-gray-200 bg-white hover:border-gray-300")}>
                  <button type="button" onClick={() => o.image && setZoom(o)} disabled={!o.image}
                    aria-label={`View ${o.name}`}
                    className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 cursor-zoom-in">
                    {o.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.image} alt={o.name} className="h-full w-full object-cover" />
                    )}
                  </button>
                  <button type="button" onClick={() => toggle(o.id)} aria-pressed={on}
                    className="flex min-w-0 flex-1 items-center gap-x-3 text-left">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-gray-900 truncate">{o.name}</span>
                      <span className="block text-[12px] text-gray-500">{money(o.price)}</span>
                    </span>
                    <span className={clx("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] transition-colors",
                      on ? "bg-black text-white" : "border border-gray-300 text-transparent")}>✓</span>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}

      {zoom?.image && (
        <Lightbox src={zoom.image} alt={zoom.name} onClose={() => setZoom(null)}
          caption={
            <div>
              <div className="flex items-baseline justify-between gap-x-3">
                <p className="text-base font-semibold text-gray-900">{zoom.name}</p>
                <p className="text-sm font-medium text-gray-900">{money(zoom.price)}</p>
              </div>
              {zoom.description && <p className="mt-1 text-sm text-gray-500">{zoom.description}</p>}
            </div>
          }
          footer={
            <button type="button" onClick={() => { toggle(zoom.id); setZoom(null) }}
              className={clx("h-12 w-full rounded-full text-sm font-medium transition-colors",
                current.includes(zoom.id) ? "border border-gray-300 text-gray-900 hover:bg-gray-50" : "bg-black text-white hover:bg-gray-800")}>
              {current.includes(zoom.id) ? "Remove" : "Add to order"}
            </button>
          }
        />
      )}
    </div>
  )
}
