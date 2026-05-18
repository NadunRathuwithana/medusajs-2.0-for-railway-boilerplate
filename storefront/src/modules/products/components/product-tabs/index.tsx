"use client"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"
import { CalendarDays, Truck } from "lucide-react"
import { useMemo } from "react"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Description & Fit",
      component: <DescriptionTab product={product} />,
    },
    {
      label: "Shipping",
      component: <ShippingInfoTab product={product} />,
    },
  ]

  return (
    <div className="w-full mt-4">
      <Accordion type="multiple" defaultValue={["Description & Fit"]}>
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const DescriptionTab = ({ product }: ProductTabsProps) => {
  return (
    <div className="text-sm text-gray-500 py-6 whitespace-pre-line leading-relaxed">
      {product.description || "No description available for this product."}
    </div>
  )
}

const ShippingInfoTab = ({ product }: ProductTabsProps) => {

  const { minDate, maxDate } = useMemo(() => {
    const today = new Date()
    const addWorkingDays = (date: Date, days: number) => {
      const result = new Date(date)
      let addedDays = 0
      while (addedDays < days) {
        result.setDate(result.getDate() + 1)
        if (result.getDay() !== 0 && result.getDay() !== 6) {
          addedDays++
        }
      }
      return result
    }
    return {
      minDate: addWorkingDays(today, 2),
      maxDate: addWorkingDays(today, 5),
    }
  }, [])

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const minDay = minDate.getDate()
  const maxDay = maxDate.getDate()
  const minMonth = monthNames[minDate.getMonth()]
  const maxMonth = monthNames[maxDate.getMonth()]
  const maxYear = maxDate.getFullYear()

  const estimatedArrival = minDate.getMonth() === maxDate.getMonth()
    ? `${minDay} - ${maxDay} ${minMonth} ${maxYear}`
    : `${minDay} ${minMonth} - ${maxDay} ${maxMonth} ${maxYear}`

  return (
    <div className="py-6">
      <div className="grid grid-cols-2 gap-y-8 gap-x-4">

        {/* Delivery Time */}
        <div className="flex items-start gap-x-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5 text-bold" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium">Delivery Time</span>
            <span className="text-sm font-semibold text-bold mt-0.5">2-5 Working Days</span>
          </div>
        </div>

        {/* Estimation Arrive */}
        <div className="flex items-start gap-x-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5 text-bold" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium">Estimation Arrive</span>
            <span className="text-sm font-semibold text-bold mt-0.5">{estimatedArrival}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
