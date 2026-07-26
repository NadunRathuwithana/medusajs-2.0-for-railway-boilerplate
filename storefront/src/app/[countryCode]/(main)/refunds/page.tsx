import { Metadata } from "next"

import ObfuscatedEmail from "@modules/common/components/obfuscated-email"

export const metadata: Metadata = {
  title: "Refund Policy | Cardle",
  description:
    "Cardle's refund policy for handcrafted cotton tote bags. Learn the conditions for receiving a full refund and how to initiate a request.",
  alternates: {
    canonical: "https://cardle.lk/refunds",
  },
}

export default function RefundsPage() {
  return (
    <div className="py-24 max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
      <div className="mb-16 border-b border-gray-200 pb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Refund Policy
        </h1>
        <p className="text-gray-500 text-lg">
          Last updated: July 15, 2026
        </p>
      </div>

      <div className="flex flex-col gap-12 text-gray-700 leading-relaxed text-lg">
        <section>
          <p className="mb-4">
            You have 7 days after receiving an item to request an exchange. You
            have to inform us via email or over the phone within 24 hours after
            receiving the item to get an exchange.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">
            Option 01: Exchange through Courier
          </h2>
          <p className="mb-4">
            <span className="font-semibold">Step 01:</span> You can inform us
            through email at{" "}
            <ObfuscatedEmail user="hello" domain="cardle.lk" className="underline" /> or call us at +94 77 949 7859. Let
            us know your need to exchange your particular item.
          </p>
          <p className="mb-4">
            <span className="font-semibold">Step 02:</span> After analyzing, our
            Exchange Team will get back to you stating the procedure where you
            have to send the package back through Registered Post or a Courier
            Service along with the following details.
          </p>
          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <p className="mb-2">
              <span className="font-semibold">To</span> – Cardle Online Store
              <br />
              Maspotha, Kurunegala
            </p>
            <p>
              <span className="font-semibold">From</span> – (Your Details with
              the order number)
            </p>
          </div>
          <p className="mb-4">
            Post it back to us within 2 working days with the original condition
            along with the price tags, Please Email/WhatsApp us the
            Courier/Postal receipt of your exchange package.
          </p>
          <p>
            <span className="font-semibold">Step 03:</span> Once we have
            received the package, one of our Sales Representatives will contact
            you and give you the specific instructions so you can simply redeem
            the exchange product value from your next order.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">
            Money Back Guarantee – Exchange Policy Terms & Conditions
          </h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>
              If the product is unsatisfactory, it must be reported within 24
              hours of receipt via email or WhatsApp to the provided number.
            </li>
            <li>
              The item must be handed over to the courier within 2 working days
              in its original condition, along with the price tags.
            </li>
            <li>
              Once the goods are received and inspected, and if they are in
              their original condition, a full refund will be processed within 7
              days of receipt.
            </li>
            <li>
              You can inform us via email at{" "}
              <ObfuscatedEmail user="hello" domain="cardle.lk" className="underline" /> or call/WhatsApp us
              at +94 77 949 7859.
            </li>
          </ul>
          <p className="font-semibold mb-2">Please remember…</p>
          <p>
            You can not make more than one exchange request simultaneously for
            the same order also the price tag should be intact.
          </p>
        </section>
      </div>
    </div>
  )
}
