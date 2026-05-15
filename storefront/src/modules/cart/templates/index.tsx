import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="py-12 md:py-24 bg-[#fafafa] min-h-screen">
      <div className="content-container max-w-[1140px] mx-auto" data-testid="cart-container">
        {cart?.items?.length ? (
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex flex-col flex-1 gap-y-8">
              {!customer && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <SignInPrompt />
                </div>
              )}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <ItemsTemplate items={cart?.items} />
              </div>
            </div>
            
            <div className="relative w-full lg:w-[400px] flex-shrink-0">
              <div className="sticky top-24 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                {cart && cart.region && (
                  <Summary cart={cart as any} />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100">
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
