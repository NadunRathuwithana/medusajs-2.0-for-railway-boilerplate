"use client"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"
import { Percent, Package, CalendarDays, Truck } from "lucide-react"

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
      component: <ShippingInfoTab />,
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

const ShippingInfoTab = () => {
  return (
    <div className="py-6">
      <div className="grid grid-cols-2 gap-y-8 gap-x-4">
        {/* Discount */}
        <div className="flex items-start gap-x-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
            <Percent className="w-5 h-5 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium">Discount</span>
            <span className="text-sm font-semibold text-black mt-0.5">Disc 50%</span>
          </div>
        </div>

        {/* Package */}
        <div className="flex items-start gap-x-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium">Package</span>
            <span className="text-sm font-semibold text-black mt-0.5">Regular Package</span>
          </div>
        </div>

        {/* Delivery Time */}
        <div className="flex items-start gap-x-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium">Delivery Time</span>
            <span className="text-sm font-semibold text-black mt-0.5">3-4 Working Days</span>
          </div>
        </div>

        {/* Estimation Arrive */}
        <div className="flex items-start gap-x-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium">Estimation Arrive</span>
            <span className="text-sm font-semibold text-black mt-0.5">10 - 12 October 2024</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
