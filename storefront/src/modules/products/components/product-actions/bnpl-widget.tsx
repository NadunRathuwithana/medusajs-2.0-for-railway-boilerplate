import { convertToLocale } from "@lib/util/money"
import { clx } from "@medusajs/ui"

type BnplProviderKey = "koko" | "mintpay"

const PROVIDER_LOGOS: Record<BnplProviderKey, { src: string; alt: string }> = {
  koko: { src: "/payment/koko-pay-sri-lanka-accepted.png", alt: "Koko Pay Sri Lanka" },
  mintpay: { src: "/payment/mintpay-no-bg.png", alt: "Mintpay" },
}

// Fixed display order (Mintpay first, then Koko) regardless of the order
// `providers` was computed in.
const DISPLAY_ORDER: BnplProviderKey[] = ["mintpay", "koko"]

export default function BnplWidget({
  price,
  currencyCode = "LKR",
  providers,
  compact = false,
}: {
  price: number
  currencyCode?: string
  providers: BnplProviderKey[]
  // Smaller text/logos for tight contexts like the product-card grid, as
  // opposed to the more spacious PDP.
  compact?: boolean
}) {
  if (!price || providers.length === 0) return null

  const installment = convertToLocale({ amount: price / 3, currency_code: currencyCode })

  return (
    <div
      className={clx("flex flex-col font-medium", {
        "gap-1 text-base mt-1 mb-4": !compact,
        "gap-0.5 text-[13px] mt-1": compact,
      })}
    >
      {DISPLAY_ORDER.filter((key) => providers.includes(key)).map((key) => {
        const logo = PROVIDER_LOGOS[key]
        return (
          <div key={key} className="flex flex-wrap items-center gap-1">
            <span className="text-[#888888]">
              or 3 X <span className="font-bold">{installment}</span>
              {key === "mintpay" && " or 2.5% cashback"} with
            </span>
            <img
              src={logo.src}
              alt={logo.alt}
              title={logo.alt}
              className={clx("object-contain ml-1", compact ? "h-4" : "h-7")}
            />
          </div>
        )
      })}
    </div>
  )
}
