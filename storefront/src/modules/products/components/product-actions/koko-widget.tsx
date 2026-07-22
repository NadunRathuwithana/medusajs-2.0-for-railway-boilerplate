import { convertToLocale } from "@lib/util/money"

export default function KokoWidget({ 
  price, 
  currencyCode = "LKR" 
}: { 
  price: number
  currencyCode?: string 
}) {
  if (!price) return null;

  const installment = price / 3;

  return (
    <div className="flex flex-wrap items-center gap-1 mt-[-10px] mb-4 text-[15px] font-medium">
      <span className="text-[#888888]">
        or 3 X <span className="font-bold">{convertToLocale({ amount: installment, currency_code: currencyCode })}</span> with
      </span>
      <img 
        src="/payment/koko-pay-sri-lanka-accepted.png" 
        alt="Koko Pay Sri Lanka" 
        title="Koko Pay Sri Lanka"
        className="h-6 object-contain ml-1 translate-y-[-1px]"
      />
    </div>
  )
}
