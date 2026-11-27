import ItemsTemplate from "./items"
import { convertToLocale } from "@lib/util/money"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"
import BackButton from "@modules/common/components/back-button"
import { getFreeThirdOptions } from "../components/free-third/options"

const CartTemplate = async ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const freeOptions = await getFreeThirdOptions(cart)
  return (
    <div className="py-4 sm:py-12 md:py-24 bg-[#fafafa] min-h-screen">
      <div className="content-container !px-4 sm:!px-6 max-w-[1140px] mx-auto" data-testid="cart-container">
        <div className="mb-4 sm:mb-6">
          <BackButton />
        </div>
        {cart?.items?.some((i: any) => !i?.metadata?.packing) ? (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
            <div className="flex flex-col flex-1 min-w-0 gap-y-4 sm:gap-y-8">
              {!customer && (
                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100">
                  <SignInPrompt />
                </div>
              )}
              <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100">
                <ItemsTemplate items={cart?.items?.filter((i: any) => !i?.metadata?.packing)} />
                {(cart?.items ?? []).some((i: any) => i?.metadata?.packing) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-700" data-testid="cart-packing-row">
                    <span>
                      Packing: {(cart?.items ?? []).filter((i: any) => i?.metadata?.packing).map((i: any) => i.metadata?.packing_name || "Extra").join(", ")}
                    </span>
                    <span className="font-medium">
                      {convertToLocale({
                        amount: (cart?.items ?? []).filter((i: any) => i?.metadata?.packing).reduce((n: number, i: any) => n + Number(i.total ?? i.unit_price * i.quantity), 0),
                        currency_code: cart!.currency_code,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative w-full lg:w-[400px] flex-shrink-0">
              <div className="sticky top-24 bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100">
                {cart && cart.region && (
                  <Summary cart={cart as any} freeOptions={freeOptions} />
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
