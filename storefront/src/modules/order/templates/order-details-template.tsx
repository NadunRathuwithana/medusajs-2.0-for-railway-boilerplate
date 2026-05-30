"use client"

import React from "react"
import { ArrowLeft } from "lucide-react"

import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import OrderSummary from "@modules/order/components/order-summary"
import ShippingDetails from "@modules/order/components/shipping-details"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  return (
    <div className="flex flex-col gap-y-6 max-w-3xl mx-auto w-full">
      {/* Back link */}
      <LocalizedClientLink
        href="/account/orders"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors w-fit"
        data-testid="back-to-overview-button"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to orders
      </LocalizedClientLink>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Order Details</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date(order.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Order Number</p>
          <p className="text-lg font-bold text-gray-900">#{order.display_id}</p>
        </div>
      </div>

      {/* Main content */}
      <div
        className="flex flex-col gap-5"
        data-testid="order-details-container"
      >
        <OrderDetails order={order} showStatus />
        <Items items={order.items} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ShippingDetails order={order} />
          <OrderSummary order={order} />
        </div>
        <Help />
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
