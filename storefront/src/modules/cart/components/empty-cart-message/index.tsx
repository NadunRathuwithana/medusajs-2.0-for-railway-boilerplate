import { Heading, Text } from "@medusajs/ui"
import { ShoppingBag } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const EmptyCartMessage = () => {
  return (
    <div className="py-32 px-4 flex flex-col justify-center items-center text-center" data-testid="empty-cart-message">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
        <ShoppingBag className="w-8 h-8 text-gray-400" />
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Your cart is empty
      </h1>
      
      <p className="text-gray-500 text-base max-w-[32rem] mb-8">
        Looks like you haven't added anything to your cart yet. Let's change that, use the link below to start browsing our products.
      </p>
      
      <LocalizedClientLink href="/store">
        <button className="px-8 py-4 bg-[#111111] text-white rounded-full font-medium hover:bg-black transition-colors shadow-md">
          Explore products
        </button>
      </LocalizedClientLink>
    </div>
  )
}

export default EmptyCartMessage
