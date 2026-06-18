import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  // listCartPaymentMethods now always returns an array (never null).
  // An empty array means the fetch failed or no providers are configured —
  // the <Payment> component renders its own retry UI in that case.
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  return (
    <div className="flex flex-col">
      <Addresses cart={cart} customer={customer} />
      <Shipping cart={cart} availableShippingMethods={shippingMethods} />
      <Payment cart={cart} availablePaymentMethods={paymentMethods ?? []} />
      <Review cart={cart} />
    </div>
  )
}
