import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Cardle",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="py-24 max-w-3xl mx-auto px-6">
      <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
      <p className="text-gray-500 mb-12">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="flex flex-col gap-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">1. Information We Collect</h2>
          <p>
            When you visit the Site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device. Additionally, as you browse the Site, we collect information about the individual web pages or products that you view, what websites or search terms referred you to the Site, and information about how you interact with the Site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">2. How We Use Your Information</h2>
          <p>
            We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations). Additionally, we use this Order Information to communicate with you, screen our orders for potential risk or fraud, and when in line with the preferences you have shared with us, provide you with information or advertising relating to our products or services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">3. Sharing Your Personal Information</h2>
          <p>
            We share your Personal Information with third parties to help us use your Personal Information, as described above. We may also share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">4. Your Rights</h2>
          <p>
            If you are a European resident, you have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. If you would like to exercise this right, please contact us through the contact information below.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">5. Contact Us</h2>
          <p>
            For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at support@cardle.com.
          </p>
        </section>
      </div>
    </div>
  )
}
