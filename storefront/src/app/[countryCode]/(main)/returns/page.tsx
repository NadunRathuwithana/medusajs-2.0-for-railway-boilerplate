import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Return/ Refunds and Exchange Policy | Cardle",
  description:
    "Cardle's 7-day return, refund and exchange policy for handcrafted cotton tote bags. Learn how to request an exchange or refund, conditions that apply, and how to reach our team.",
  alternates: {
    canonical: "https://cardle.lk/returns",
  },
}

export default function ReturnsPage() {
  return (
    <div className="py-24 max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
      <div className="mb-16 border-b border-gray-200 pb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Return/ Refunds and Exchange Policy
        </h1>
        <p className="text-gray-500 text-lg">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="flex flex-col gap-12 text-gray-700 leading-relaxed text-lg">
        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">
            1. Eligibility Window
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-base">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left font-semibold py-3 pr-4">Action</th>
                  <th className="text-left font-semibold py-3">Deadline</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4">
                    Report an issue / request exchange
                  </td>
                  <td className="py-3">
                    Within <span className="font-semibold">24 hours</span> of
                    receiving the item
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4">Request an exchange</td>
                  <td className="py-3">
                    Within <span className="font-semibold">7 days</span> of
                    receiving the item
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">
                    Return the item to courier
                  </td>
                  <td className="py-3">
                    Within{" "}
                    <span className="font-semibold">2 working days</span> of
                    approval
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">
            2. How to Request an Exchange
          </h2>
          <p className="mb-4">
            <span className="font-semibold">1. Contact us</span> – Email{" "}
            hello@cardle.lk or call/WhatsApp +94 77 949 7859 with your
            exchange request.
          </p>
          <p className="mb-4">
            <span className="font-semibold">2. Get instructions</span> – Our
            Exchange Team will confirm and provide return instructions
            (Registered Post or Courier Service).
          </p>
          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <p className="mb-2">
              <span className="font-semibold">Ship to</span> – Cardle Online
              Store
              <br />
              Maspotha, Kurunegala
            </p>
            <p>
              <span className="font-semibold">Ship from</span> – Your Name,
              Your Address, Order Number
            </p>
          </div>
          <p className="mb-4">
            Send the package within 2 working days, in original condition,
            with all tags attached. Email or WhatsApp us the courier/postal
            receipt after dispatch.
          </p>
          <p>
            <span className="font-semibold">3. Redemption</span> – Once we
            receive and inspect the return, a Sales Representative will help
            you redeem the exchange value toward your next order.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">
            3. Refunds
          </h2>
          <p className="font-semibold mb-2">Eligibility</p>
          <p className="mb-4">A refund may be approved if:</p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>You received the wrong product</li>
            <li>
              The item is significantly different from the description,
              specs, size, color, or material advertised
            </li>
            <li>
              The product has a manufacturing or shipping defect/damage not
              caused by customer misuse
            </li>
          </ul>
          <p className="font-semibold mb-2">Required Information</p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Order number</li>
            <li>Brief description of the issue</li>
            <li>Clear photos or videos of the product and the problem</li>
          </ul>
          <p className="font-semibold mb-2">Process</p>
          <p className="mb-2">
            Item must reach the courier within 2 working days, in original
            condition with packaging, accessories, and tags intact.
          </p>
          <p>
            Once received and inspected, an approved refund is processed
            within 7 business days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">
            4. Delivery Charges
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-base">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left font-semibold py-3 pr-4">
                    Situation
                  </th>
                  <th className="text-left font-semibold py-3">
                    Who pays return/exchange delivery costs?
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4">
                    Item damaged, defective, or incorrect on arrival
                  </td>
                  <td className="py-3">
                    <span className="font-semibold">
                      Cardle Online Store
                    </span>{" "}
                    covers all costs
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">
                    Change of mind (size, color, style, etc.)
                  </td>
                  <td className="py-3">
                    <span className="font-semibold">Customer</span> covers
                    all costs
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-500 mt-4">
            Delivery charges are non-refundable for change-of-mind exchanges,
            unless required by applicable consumer protection law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">
            5. Key Rules
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Only one active exchange request per order at a time.
            </li>
            <li>
              Items must be unworn, unwashed, unaltered, with original tags
              and packaging.
            </li>
            <li>
              Worn, washed, altered, or customer-damaged items are not
              eligible.
            </li>
            <li>
              Refunds apply only to approved cases: not-as-described,
              defective, damaged on arrival, or wrong item sent.
            </li>
            <li>
              No refunds or free exchanges for change-of-mind requests –
              customer bears delivery costs in these cases.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">
            6. Contact
          </h2>
          <p>
            <span className="font-semibold">Email:</span> hello@cardle.lk
            <br />
            <span className="font-semibold">Call / WhatsApp:</span> +94 77
            949 7859
          </p>
        </section>
      </div>
    </div>
  )
}
