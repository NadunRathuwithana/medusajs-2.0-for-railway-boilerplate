import { convertToLocale } from "@lib/util/money"

type BnplProviderKey = "koko" | "mintpay"

const PROVIDER_LOGOS: Record<BnplProviderKey, { src: string; alt: string }> = {
  koko: { src: "/payment/koko-pay-sri-lanka-accepted.png", alt: "Koko Pay Sri Lanka" },
  mintpay: { src: "/payment/mintpay-no-bg.png", alt: "Mintpay" },
}

export default function BnplWidget({
  price,
  currencyCode = "LKR",
  providers,
}: {
  price: number
  currencyCode?: string
  providers: BnplProviderKey[]
}) {
  if (!price || providers.length === 0) return null

  const installment = price / 3

  return (
    <div className="flex flex-wrap items-center gap-1 mt-[-10px] mb-4 text-[15px] font-medium">
      <span className="text-[#888888]">
        or 3 X <span className="font-bold">{convertToLocale({ amount: installment, currency_code: currencyCode })}</span> with
      </span>
      {providers.map((key, i) => {
        const logo = PROVIDER_LOGOS[key]
        return (
          <span key={key} className="flex items-center gap-1">
            {i > 0 && <span className="text-[#888888]">or</span>}
            <img
              src={logo.src}
              alt={logo.alt}
              title={logo.alt}
              className="h-6 object-contain ml-1 translate-y-[-1px]"
            />
          </span>
        )
      })}
    </div>
  )
}
