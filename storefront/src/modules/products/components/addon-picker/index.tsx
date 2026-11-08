"use client"

import { Addon } from "@lib/data/addons"
import { convertToLocale } from "@lib/util/money"
import ZoomableImage from "@modules/common/components/image-lightbox"

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
  if (!addons.length) return null
  const money = (n: number) =>
    n > 0 ? `+ ${convertToLocale({ amount: n, currency_code: currencyCode, maximumFractionDigits: 0 })}` : "Free"

  return (
    <div className="flex flex-col gap-y-3" data-testid="addon-picker">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Customise your bag</h3>
        <p className="text-xs text-gray-500">Optional extras, added when the bag is made.</p>
      </div>
      <ul className="flex flex-col gap-y-2">
        {addons.map((a) => {
          const on = selected.includes(a.id)
          return (
            <li
              key={a.id}
              className={`flex items-center gap-x-3 rounded-xl border p-2.5 transition-colors ${
                on ? "border-black bg-gray-50" : "border-gray-200"
              }`}
            >
              {a.image ? (
                <ZoomableImage src={a.image} alt={a.name} className="h-16 w-16" />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-100" />
              )}
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-x-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-gray-900">{a.name}</span>
                  {a.description && <span className="block text-xs text-gray-500 line-clamp-2">{a.description}</span>}
                  <span className="mt-0.5 block text-xs font-semibold text-gray-900">{money(a.price)}</span>
                </span>
                <input
                  type="checkbox"
                  checked={on}
                  disabled={disabled}
                  onChange={() => onToggle(a.id)}
                  className="h-5 w-5 shrink-0 accent-black"
                  aria-label={`Add ${a.name}`}
                />
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
