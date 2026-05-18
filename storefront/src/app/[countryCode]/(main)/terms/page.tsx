import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Cardle",
}

export default function TermsPage() {
  return (
    <div className="py-24 max-w-3xl mx-auto px-6">
      <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
      <p className="text-gray-500 mb-12">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="flex flex-col gap-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">1. Overview</h2>
          <p>
            This website is operated by Cardle. Throughout the site, the terms "we", "us" and "our" refer to Cardle. Cardle offers this website, including all information, tools and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies and notices stated here.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">2. Online Store Terms</h2>
          <p>
            By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence. You may not use our products for any illegal or unauthorized purpose nor may you, in the use of the Service, violate any laws in your jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">3. Products or Services</h2>
          <p>
            Certain products or services may be available exclusively online through the website. These products or services may have limited quantities and are subject to return or exchange only according to our Return Policy. We have made every effort to display as accurately as possible the colors and images of our products that appear at the store. We cannot guarantee that your computer monitor's display of any color will be accurate.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-bold mb-4">4. Modifications to the Service and Prices</h2>
          <p>
            Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time. We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.
          </p>
        </section>
      </div>
    </div>
  )
}
