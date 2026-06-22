import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Cardle",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="py-24 max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
      <div className="mb-16 border-b border-gray-200 pb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-gray-500 text-lg">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="flex flex-col gap-12 text-gray-700 leading-relaxed text-lg">
        <section>
          <p>
            At Cardle we are committed to protecting the privacy and security of our website users’ personal information. This privacy policy outlines how we collect, use, and protect your data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">Information We Collect</h2>
          <p className="mb-4">
            We may collect personal information such as name, email address, phone number, and address when you sign up for our newsletter, make a purchase or submit an inquiry through our website.
          </p>
          <p>
            We also collect non-personal information such as your device type, browser, IP address, and browsing behavior on our site using cookies and similar technologies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">How We Use Your Information</h2>
          <p className="mb-4">
            We use the information we collect to provide and improve our services, respond to inquiries, process transactions, and send promotional emails.
          </p>
          <p>
            We may also use non-personal information to analyze trends and improve the functionality of our website.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">How We Protect Your Information</h2>
          <p>
            We take reasonable measures to protect your personal information from unauthorized access, disclosure, or destruction. We use industry-standard security protocols, including SSL encryption, to secure your data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">Sharing Your Information</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted third-party service providers who help us operate our website and provide our services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">Your Rights</h2>
          <p>
            You have the right to request access, correction, or deletion of your personal information. You can also unsubscribe from our marketing emails at any time by clicking the unsubscribe link in the email.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">Changes to this Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any material changes by posting the updated policy on our website.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">Contact Us</h2>
          <p>
            If you have any questions or concerns about our privacy policy, please contact us at support@cardle.lk
          </p>
        </section>
      </div>
    </div>
  )
}
