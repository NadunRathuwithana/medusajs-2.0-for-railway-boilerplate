import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Packing from "@modules/checkout/components/packing"
import Payment from "@modules/checkout/components/payment"
import { getPacking } from "@lib/data/addons"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"
import { LiveCheckoutProvider } from "@modules/checkout/context/live-checkout-context"
import { isCartAddressesComplete } from "@lib/util/checkout-validation"

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
  const packing = await getPacking()

  return (
    <LiveCheckoutProvider initialComplete={isCartAddressesComplete(cart)}>
      <div className="flex flex-col">
        <Addresses cart={cart} customer={customer} />
        <Shipping cart={cart} availableShippingMethods={shippingMethods} />
        <Packing cart={cart} packing={packing} />
        <Payment cart={cart} availablePaymentMethods={paymentMethods ?? []} />
        <Review cart={cart} />
      </div>
    </LiveCheckoutProvider>
  )
}
