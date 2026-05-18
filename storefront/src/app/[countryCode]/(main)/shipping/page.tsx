import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shipping Policy",
  description: "Shipping Policy for Cardle",
}

export default function ShippingPage() {
  return (
    <div className="py-24 max-w-3xl mx-auto px-6">
      <h1 className="text-4xl font-bold tracking-tight mb-4">Shipping Policy</h1>
      <p className="text-gray-500 mb-12">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="flex flex-col gap-8 text-gray-700 leading-relaxed">
        <section>
          <p className="mb-4">
            We are committed to delivering your Cardle bag with speed and reliability.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse mt-4">
              <thead>
                <tr>
                  <th className="border-b-2 border-gray-200 py-3 font-semibold text-bold">Order Type</th>
                  <th className="border-b-2 border-gray-200 py-3 font-semibold text-bold">Estimated Delivery</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 border-b border-gray-100">Standard Delivery</td>
                  <td className="py-3 border-b border-gray-100">2 – 5 working days</td>
                </tr>
                <tr>
                  <td className="py-3 border-b border-gray-100">Customized Orders</td>
                  <td className="py-3 border-b border-gray-100">7 – 10 working days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mt-4">
          <h2 className="text-xl font-bold text-bold mb-2 flex items-center gap-2">
            Transparent Shipping Rates
          </h2>
          <p className="text-gray-600 font-medium">
            No hidden fees. Your precise shipping rate is automatically calculated and clearly displayed at checkout based on your delivery location.
          </p>
        </section>
      </div>
    </div>
  )
}
