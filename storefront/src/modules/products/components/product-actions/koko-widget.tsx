import { convertToLocale } from "@lib/util/money"

export default function KokoWidget({ 
  price, 
  currencyCode = "LKR" 
}: { 
  price: number
  currencyCode?: string 
}) {
  if (!price) return null;

  // Simulate Koko's Pay in Full instant discount (e.g., ~2% or fixed amount based on their campaign)
  // For the sake of the widget UI, we calculate a small discount.
  const discountAmount = Math.max(1, Math.floor(price * 0.02)); 
  const discountedPrice = price - discountAmount;
  
  const installment = price / 3;

  return (
    <div className="w-full border border-gray-200 rounded-[8px] p-4 flex flex-col gap-4 my-2 bg-white">
      {/* Pay in Full Section */}
      <div className="flex items-start justify-between">
         <div className="flex flex-col">
            <span className="font-semibold text-sm text-black">Pay in full</span>
            <span className="text-xs text-gray-500 mt-0.5">Get an instant discount</span>
         </div>
         <div className="flex flex-col items-end text-right">
            <span className="text-xs text-gray-400 line-through">
              {convertToLocale({ amount: price, currency_code: currencyCode })}
            </span>
            <span className="font-semibold text-sm text-black">
              {convertToLocale({ amount: discountedPrice, currency_code: currencyCode })}
            </span>
         </div>
      </div>
      
      <div className="flex items-center justify-between bg-gray-50 p-2 rounded-[6px]">
        <span className="text-xs text-gray-600">
          You're saving <span className="font-semibold text-black">{convertToLocale({ amount: discountAmount, currency_code: currencyCode })}</span> with Pay Now.
        </span>
      </div>

      <div className="h-[1px] w-full bg-gray-100" />
      
      {/* BNPL Section */}
      <div className="flex flex-col gap-2">
         <div className="flex justify-between items-center text-xs">
           <span className="text-gray-500">Or pay in 3 interest-free installments of</span>
           <span className="font-semibold text-black">{convertToLocale({ amount: installment, currency_code: currencyCode })}</span>
         </div>
         <div className="flex justify-between items-center text-xs mt-2">
           <button className="text-gray-500 underline cursor-pointer hover:text-black transition-colors focus:outline-none">
             See more info
           </button>
           <span className="font-bold uppercase tracking-widest text-[9px] bg-black text-white px-2 py-1 rounded-[4px]">
             Koko Pay
           </span>
         </div>
      </div>
    </div>
  )
}
