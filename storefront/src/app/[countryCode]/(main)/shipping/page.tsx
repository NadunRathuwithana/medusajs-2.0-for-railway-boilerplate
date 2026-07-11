import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shipping Policy – Cardle Sri Lanka",
  description:
    "Cardle delivers island-wide across Sri Lanka in 2–7 business days for LKR 300. Learn about our dispatch process, tracking, order cancellations and delivery terms.",
  alternates: {
    canonical: "https://cardle.lk/shipping",
  },
}

export default function ShippingPolicyPage() {
  return (
    <div className="py-24 max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
      <div className="mb-16 border-b border-gray-200 pb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Shipping Policy
        </h1>
        <p className="text-gray-500 text-lg">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="flex flex-col gap-12 text-gray-700 leading-relaxed text-lg">
        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4 uppercase">
            We Deliver Island Wide
          </h2>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4 uppercase">
            Delivery Time
          </h2>
          <p className="mb-4">
            Our team diligently strives to dispatch your package as quickly as
            possible. Deliveries are usually completed within 5–7 working days,
            excluding mercantile and public holidays. Once we receive your
            order, our dedicated in-house staff and courier partners work hard
            to ensure delivery within the specified timeframe. However, please
            note that during promotional periods or due to unforeseen
            circumstances, such as inclement weather, there may be slight delays
            beyond the estimated delivery timeframe.
          </p>
          <p className="mb-4">
            Orders placed on Saturday and Sunday will be processed on the
            following Monday. You will receive an email notification when your
            order is dispatched from our warehouse, complete with package
            tracking details. It’s important to note that shipping time is an
            estimate starting from the date of shipping, not the order date, and
            may be prolonged due to issues like an invalid address or contact
            number.
          </p>
          <p className="mb-4">
            Items will be packed and dispatched based on their availability.
            Should a product be unavailable, our representative will reach out
            to you for confirmation before proceeding. Unfortunately, store
            pick-ups and one-day delivery services are not offered; we strictly
            adhere to our standard delivery procedure.
          </p>
          <p>
            Prior to delivery, our courier partner will contact you to provide
            information about the delivery.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4 uppercase">
            Delivery Cost
          </h2>
          <p className="mb-4">Island wide LKR 300</p>
          <p>
            Delivery charges for your order will be calculated and displayed at
            the website checkout.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4 uppercase">
            Contact Amends
          </h2>
          <p className="mb-4">
            Shipments will exclusively be directed to the address and contact
            numbers specified in the order. In the event of unavoidable
            circumstances necessitating a change, please contact our hotline or
            send us a message via Messenger/WhatsApp.
          </p>
          <p className="mb-4">
            Modifying delivery addresses may result in shipping delays, but we
            assure you that we will make every effort to minimize any
            inconvenience caused.
          </p>
          <p className="mb-4">
            Please note that product changes cannot be accommodated at the time
            of delivery. However, adjustments to an order can be made before it
            is dispatched.
          </p>
          <p>
            After three unsuccessful delivery attempts, the parcel will be
            returned to us.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4 uppercase">
            Order Cancellation
          </h2>
          <p className="mb-4">
            To initiate the cancellation of an order, please reach out to us via
            our hotline or send a message on our Messenger/WhatsApp within an
            8-hour window from the time of placing the order. Cancellations can
            only be processed before the order is dispatched.
          </p>
          <p className="mb-4">
            For any additional questions or concerns, our dedicated team is
            ready to assist you!
          </p>
          <p>
            Feel free to contact us via email at hello@cardle.lk or call us on
            +94 77 949 7859
          </p>
        </section>
      </div>
    </div>
  )
}
