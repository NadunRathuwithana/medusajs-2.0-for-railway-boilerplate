import { convertToLocale } from "@lib/util/money"

type Meta = Record<string, any> | null | undefined

/** Shows the chosen add-ons (or the packing choice) under a cart / order line. */
export default function LineItemAddons({
  metadata,
  currencyCode,
  className = "",
}: {
  metadata: Meta
  currencyCode?: string
  className?: string
}) {
  if (metadata?.packing) {
    return (
      <p className={`text-[13px] text-gray-500 ${className}`}>{metadata.packing_name}</p>
    )
  }
  const addons: Array<{ id: string; name: string; price: number }> = Array.isArray(metadata?.addons)
    ? metadata!.addons
    : []
  if (!addons.length) return null
  return (
    <ul className={`mt-1 space-y-0.5 ${className}`} data-testid="line-item-addons">
      {addons.map((a) => (
        <li key={a.id} className="text-[12px] text-gray-500">
          + {a.name}
          {a.price > 0 && currencyCode
            ? ` (${convertToLocale({ amount: a.price, currency_code: currencyCode, maximumFractionDigits: 0 })})`
            : ""}
        </li>
      ))}
    </ul>
  )
}
