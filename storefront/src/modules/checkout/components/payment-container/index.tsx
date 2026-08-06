import { RadioGroup } from "@headlessui/react"
import { InformationCircleSolid } from "@medusajs/icons"
import { Text, Tooltip, clx } from "@medusajs/ui"
import React from "react"

import Radio from "@modules/common/components/radio"

import PaymentTest from "../payment-test"
import { isManual, isKoko, getPaymentPromoInfo } from "@lib/constants"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; shortTitle?: string; icon: JSX.Element }>
  cart?: any
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  cart,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"
  const isSelected = selectedPaymentOptionId === paymentProviderId
  const promoInfo = getPaymentPromoInfo(paymentProviderId)

  return (
    <>
      <RadioGroup.Option
        key={paymentProviderId}
        value={paymentProviderId}
        disabled={disabled}
        className={clx(
          "flex flex-col justify-center gap-y-2 cursor-pointer p-4 border rounded-2xl transition-colors hover:bg-gray-50 focus:outline-none focus:ring-0 min-h-[64px]",
          {
            "border-black bg-gray-50": isSelected,
            "border-gray-200 bg-white": !isSelected,
          }
        )}
      >
        <div className="flex items-center justify-between gap-x-2">
          <div className="flex items-center gap-x-4 min-w-0">
            <Radio checked={isSelected} />
            <span className="text-[15px] font-medium text-gray-900 truncate">
              <span className="sm:hidden">
                {paymentInfoMap[paymentProviderId]?.shortTitle ||
                  paymentInfoMap[paymentProviderId]?.title ||
                  paymentProviderId}
              </span>
              <span className="hidden sm:inline">
                {paymentInfoMap[paymentProviderId]?.title || paymentProviderId}
              </span>
            </span>
            {isManual(paymentProviderId) && isDevelopment && (
              <PaymentTest className="hidden small:block" />
            )}
          </div>
          <span className="justify-self-end text-ui-fg-base shrink-0">
            {paymentInfoMap[paymentProviderId]?.icon}
          </span>
        </div>
        {promoInfo.tag && (
          <div className="pl-9 flex items-center gap-x-2 flex-wrap">
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
              {promoInfo.tag}
            </span>
            <span className="text-xs text-gray-500">
              Instant discount applied at checkout
            </span>
          </div>
        )}
        {isManual(paymentProviderId) && isDevelopment && (
          <PaymentTest className="small:hidden text-[10px]" />
        )}
      </RadioGroup.Option>
    </>
  )
}

export default PaymentContainer
