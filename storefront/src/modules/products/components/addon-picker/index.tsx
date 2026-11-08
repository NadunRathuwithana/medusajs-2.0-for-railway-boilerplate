"use client"

import { useEffect, useRef, useState } from "react"
import { clx } from "@medusajs/ui"
import { Addon } from "@lib/data/addons"
import { convertToLocale } from "@lib/util/money"
import { Lightbox } from "@modules/common/components/image-lightbox"

/**
 * Add-ons as a compact horizontal slider (scales to 10+ items).
 * Card styling follows the colour swatches: black border + tick when selected.
 */
export default function AddonPicker({
  addons,
  selected,
  onToggle,
  currencyCode,
  disabled,
}: {
  addons: Addon[]
  selected: string[]
  onToggle: (id: string) => void
  currencyCode: string
  disabled?: boolean
}) {
  const track = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })
  const [zoom, setZoom] = useState<Addon | null>(null)

  const update = () => {
    const el = track.current
    if (!el) return
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 })
  }
  useEffect(() => {
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [addons.length])

  if (!addons.length) return null

  const scroll = (dir: 1 | -1) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" })
  const price = (n: number) =>
    n > 0 ? `+${convertToLocale({ amount: n, currency_code: currencyCode, maximumFractionDigits: 0 })}` : "Free"

  return (
    <div className="flex flex-col gap-y-3" data-testid="addon-picker">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-sm font-medium text-gray-900">Customise your bag</span>
          <span className="ml-2 text-xs text-gray-500">
            {selected.length ? `${selected.length} selected` : "Optional"}
          </span>
        </div>
        {!(edges.start && edges.end) && (
          <div className="hidden small:flex gap-x-1.5">
            {([-1, 1] as const).map((d) => (
              <button key={d} type="button" onClick={() => scroll(d)}
                disabled={d === -1 ? edges.start : edges.end}
                aria-label={d === -1 ? "Previous add-ons" : "Next add-ons"}
                className="h-8 w-8 rounded-full border border-gray-200 text-gray-700 hover:border-gray-300 disabled:opacity-30">
                {d === -1 ? "‹" : "›"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={track} onScroll={update}
        className="-mx-1 flex gap-x-3 overflow-x-auto px-1 pb-1 pt-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {addons.map((a) => {
          const on = selected.includes(a.id)
          return (
            <div key={a.id} className="w-[104px] shrink-0 snap-start">
              <button type="button" onClick={() => onToggle(a.id)} disabled={disabled}
                aria-pressed={on} aria-label={`${on ? "Remove" : "Add"} ${a.name}`}
                className={clx("relative block h-[104px] w-[104px] overflow-hidden rounded-lg bg-gray-50 transition-all duration-200", {
                  "border-2 border-black shadow-md": on,
                  "border border-gray-200 hover:border-gray-300": !on,
                })}>
                {a.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image} alt={a.name} className="h-full w-full object-cover" loading="lazy" />
                )}
                <span className={clx("absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] transition-colors", {
                  "bg-black text-white": on,
                  "bg-white/90 border border-gray-300 text-transparent": !on,
                })}>✓</span>
              </button>
              <p className={clx("mt-1.5 text-xs font-medium leading-tight line-clamp-2", on ? "text-black" : "text-gray-700")}>{a.name}</p>
              <p className="text-xs text-gray-500">{price(a.price)}</p>
              {a.image && (
                <button type="button" onClick={() => setZoom(a)}
                  className="text-[11px] text-gray-400 underline-offset-2 hover:text-gray-700 hover:underline">
                  View
                </button>
              )}
            </div>
          )
        })}
      </div>

      {zoom?.image && (
        <Lightbox
          src={zoom.image}
          alt={zoom.name}
          onClose={() => setZoom(null)}
          caption={
            <div>
              <div className="flex items-baseline justify-between gap-x-3">
                <p className="text-base font-semibold text-gray-900">{zoom.name}</p>
                <p className="text-sm font-medium text-gray-900">{price(zoom.price)}</p>
              </div>
              {zoom.description && <p className="mt-1 text-sm text-gray-500">{zoom.description}</p>}
            </div>
          }
          footer={
            <button type="button" disabled={disabled}
              onClick={() => { onToggle(zoom.id); setZoom(null) }}
              className={clx("h-12 w-full rounded-full text-sm font-medium transition-colors",
                selected.includes(zoom.id) ? "border border-gray-300 text-gray-900 hover:bg-gray-50" : "bg-black text-white hover:bg-gray-800")}>
              {selected.includes(zoom.id) ? "Remove add-on" : "Add to my bag"}
            </button>
          }
        />
      )}
    </div>
  )
}
