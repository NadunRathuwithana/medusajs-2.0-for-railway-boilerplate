import React from "react"
import { CreditCard } from "@medusajs/icons"

import Ideal from "@modules/common/icons/ideal"
import Bancontact from "@modules/common/icons/bancontact"
import PayPal from "@modules/common/icons/paypal"
import { Truck } from "lucide-react"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_stripe-ideal_stripe": {
    title: "iDeal",
    icon: <Ideal />,
  },
  "pp_stripe-bancontact_stripe": {
    title: "Bancontact",
    icon: <Bancontact />,
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <PayPal />,
  },
  pp_system_default: {
    title: "Cash on delivery",
    icon: <Truck className="w-5 h-5 text-gray-500" strokeWidth={1.5} />,
  },
  pp_onepay_onepay: {
    title: "Credit/ Debit Card",
    icon: <img src="/payment/visa-mastercard-accepted.png" alt="Visa Mastercard accepted" title="Visa Mastercard accepted" className="h-6 object-contain" />,
  },
  pp_koko_koko: {
    title: "Koko: Buy Now Pay Later",
    icon: <img src="/payment/koko-pay-sri-lanka-accepted.png" alt="Koko Pay Sri Lanka accepted" title="Koko Pay Sri Lanka accepted" className="h-6 object-contain" />,
  },
  pp_mintpay_mintpay: {
    title: "Mintpay: Buy Now Pay Later",
    icon: <img src="/payment/mintpay.png" alt="Mintpay accepted" title="Mintpay accepted" className="h-6 object-contain" />,
  },
  // Add more payment providers here
}

// This only checks if it is native stripe for card payments, it ignores the other stripe-based providers
export const isStripe = (providerId?: string) => {
  return providerId?.startsWith("pp_stripe_")
}
export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}
export const isOnepay = (providerId?: string) => {
  return providerId?.startsWith("pp_onepay")
}
export const isKoko = (providerId?: string) => {
  return providerId?.startsWith("pp_koko")
}
export const isMintpay = (providerId?: string) => {
  return providerId?.startsWith("pp_mintpay")
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]

export const getPaymentPromoInfo = (providerId: string) => {
  if (providerId?.startsWith("pp_stripe_")) {
    return {
      code: process.env.NEXT_PUBLIC_PROMO_STRIPE_CODE,
      tag: process.env.NEXT_PUBLIC_PROMO_STRIPE_TAG
    }
  }
  if (providerId?.startsWith("pp_onepay")) {
    return {
      code: process.env.NEXT_PUBLIC_PROMO_ONEPAY_CODE,
      tag: process.env.NEXT_PUBLIC_PROMO_ONEPAY_TAG
    }
  }
  if (providerId?.startsWith("pp_koko")) {
    return {
      code: process.env.NEXT_PUBLIC_PROMO_KOKO_CODE,
      tag: process.env.NEXT_PUBLIC_PROMO_KOKO_TAG
    }
  }
  if (providerId?.startsWith("pp_mintpay")) {
    return {
      code: process.env.NEXT_PUBLIC_PROMO_MINTPAY_CODE,
      tag: process.env.NEXT_PUBLIC_PROMO_MINTPAY_TAG
    }
  }
  if (providerId?.startsWith("pp_system_default")) {
    return {
      code: process.env.NEXT_PUBLIC_PROMO_MANUAL_CODE,
      tag: process.env.NEXT_PUBLIC_PROMO_MANUAL_TAG
    }
  }
  return { code: undefined, tag: undefined }
}

export const getAllPaymentPromoCodes = () => {
  return [
    process.env.NEXT_PUBLIC_PROMO_STRIPE_CODE,
    process.env.NEXT_PUBLIC_PROMO_ONEPAY_CODE,
    process.env.NEXT_PUBLIC_PROMO_KOKO_CODE,
    process.env.NEXT_PUBLIC_PROMO_MINTPAY_CODE,
    process.env.NEXT_PUBLIC_PROMO_MANUAL_CODE
  ].filter(Boolean) as string[]
}
