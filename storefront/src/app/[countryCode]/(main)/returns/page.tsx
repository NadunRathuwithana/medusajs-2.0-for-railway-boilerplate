import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Return & Exchange Policy",
  description: "Return and Exchange Policy for Cardle",
}

export default function ReturnsPage() {
  return (
    <div className="py-24 max-w-3xl mx-auto px-6">
      <h1 className="text-4xl font-bold tracking-tight mb-4">Return & Exchange Policy</h1>
      <p className="text-gray-500 mb-12">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="flex flex-col gap-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">1. General Return Policy</h2>
          <p>
            We want you to be completely satisfied with your purchase. If you are not entirely happy with your order, we're here to help. Our standard return policy lasts 30 days from the date of delivery. If 30 days have passed since you received your purchase, unfortunately, we cannot offer you a refund or exchange.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">2. Eligibility for Returns</h2>
          <p>
            To be eligible for a return, your item must be unused, unwashed, and in the exact same condition that you received it. It must also be in the original packaging with all tags still attached. Any items that show signs of wear, damage, or alteration will not be accepted for return.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">3. Exchanges</h2>
          <p>
            If you need to exchange a product for a different size or color, please return the original item for a refund and place a new order for the desired item. We only replace items free of charge if they are defective or damaged upon arrival. If you received a defective item, please contact our support team immediately.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">4. Non-Returnable Items</h2>
          <p>
            Certain types of items cannot be returned for hygiene and safety reasons. This includes gift cards, final sale items, personalized products, and intimate apparel. Please check the product description carefully before making a purchase to see if the item is final sale.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">5. How to Initiate a Return</h2>
          <p>
            To initiate a return or exchange, please contact our customer support team with your order number and the reason for the return. We will provide you with a return authorization and instructions on how and where to send your package. Please note that you will be responsible for the return shipping costs, unless the return is due to our error.
          </p>
        </section>
      </div>
    </div>
  )
}
