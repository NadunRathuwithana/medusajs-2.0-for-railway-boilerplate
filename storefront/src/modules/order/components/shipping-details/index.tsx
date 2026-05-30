import { HttpTypes } from "@medusajs/types"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Delivery</h2>

      <div className="flex flex-col gap-1" data-testid="shipping-address-summary">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Shipping Address</p>
        <p className="text-sm font-medium text-gray-900">
          {order.shipping_address?.first_name} {order.shipping_address?.last_name}
        </p>
        <p className="text-sm text-gray-500">
          {order.shipping_address?.address_1}{order.shipping_address?.address_2 ? `, ${order.shipping_address.address_2}` : ""}
        </p>
        <p className="text-sm text-gray-500">
          {order.shipping_address?.postal_code}, {order.shipping_address?.city}
        </p>
        <p className="text-sm text-gray-500">
          {order.shipping_address?.country_code?.toUpperCase()}
        </p>
      </div>

      <div className="h-px bg-gray-100" />

      <div className="flex flex-col gap-1" data-testid="shipping-contact-summary">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact</p>
        {order.shipping_address?.phone && (
          <p className="text-sm text-gray-900">{order.shipping_address.phone}</p>
        )}
        <p className="text-sm text-gray-500">{order.email}</p>
      </div>
    </div>
  )
}

export default ShippingDetails
