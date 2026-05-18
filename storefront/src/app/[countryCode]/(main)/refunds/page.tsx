import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund Policy for Cardle",
}

export default function RefundsPage() {
  return (
    <div className="py-24 max-w-3xl mx-auto px-6">
      <h1 className="text-4xl font-bold tracking-tight mb-4">Refund Policy</h1>
      <p className="text-gray-500 mb-12">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="flex flex-col gap-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">1. Returns</h2>
          <p>
            Our policy lasts 30 days. If 30 days have gone by since your purchase, unfortunately we can't offer you a refund or exchange. To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">2. Refunds</h2>
          <p>
            Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund. If you are approved, then your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">3. Late or Missing Refunds</h2>
          <p>
            If you haven't received a refund yet, first check your bank account again. Then contact your credit card company, it may take some time before your refund is officially posted. Next contact your bank. There is often some processing time before a refund is posted. If you've done all of this and you still have not received your refund yet, please contact us at support@cardle.com.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">4. Shipping for Returns</h2>
          <p>
            To return your product, you should mail your product to the address provided by our support team. You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.
          </p>
        </section>
      </div>
    </div>
  )
}
