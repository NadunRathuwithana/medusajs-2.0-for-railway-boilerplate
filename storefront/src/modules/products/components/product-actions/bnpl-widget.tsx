import { convertToLocale } from "@lib/util/money"
import { clx } from "@medusajs/ui"

type BnplProviderKey = "koko" | "mintpay"

const PROVIDER_LOGOS: Record<BnplProviderKey, { src: string; alt: string }> = {
  koko: { src: "/payment/koko-pay-sri-lanka-accepted.png", alt: "Koko Pay Sri Lanka" },
  mintpay: { src: "/payment/mintpay-no-bg.png", alt: "Mintpay" },
}

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

  const installment = price / 3

  return (
    <div
      className={clx("flex flex-wrap items-center gap-1 font-medium", {
        "text-[15px] mt-[-10px] mb-4": !compact,
        "text-[11px] mt-0.5": compact,
      })}
    >
      <span className="text-[#888888]">
        or 3 X <span className="font-bold">{convertToLocale({ amount: installment, currency_code: currencyCode })}</span> with
      </span>
      {providers.map((key) => {
        const logo = PROVIDER_LOGOS[key]
        return (
          <img
            key={key}
            src={logo.src}
            alt={logo.alt}
            title={logo.alt}
            className={clx("object-contain ml-1", compact ? "h-3.5" : "h-6 translate-y-[-1px]")}
          />
        )
      })}
    </div>
  )
}
