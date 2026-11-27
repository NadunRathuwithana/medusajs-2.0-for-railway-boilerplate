import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "en-US",
}: ConvertToLocaleParams) => {
  return currency_code && !isEmpty(currency_code)
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency_code,
        // One format everywhere: whole rupees show no decimals, anything with
        // cents shows two (2,960 / 2,960.50), never a silently rounded value.
        minimumFractionDigits: minimumFractionDigits ?? (Number.isInteger(Number(amount)) ? 0 : 2),
        maximumFractionDigits: maximumFractionDigits ?? (Number.isInteger(Number(amount)) ? 0 : 2),
      }).format(Number(amount) || 0)
    : amount.toString()
}
