import { getCategoriesList } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import { Text, clx } from "@medusajs/ui"
import { Headset, Package, ShieldCheck } from "lucide-react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
)

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
)

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
)

const TrustSection = () => {
  return (
    <div className="w-full bg-white border-t border-gray-200">
      <div className="max-w-[1440px] mx-auto px-6 md:px-16 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          
          {/* Customer Service */}
          <div className="flex flex-col items-center text-center px-4 md:px-8 pt-8 md:pt-0">
            <Headset className="w-6 h-6 mb-4 text-black" />
            <h4 className="text-base font-bold text-black mb-2">Customer service</h4>
            <p className="text-xs text-gray-500 font-medium">It's not actually free we just price it into the products.</p>
          </div>

          {/* Estimated Delivery */}
          <div className="flex flex-col items-center text-center px-4 md:px-8 pt-8 md:pt-0">
            <Package className="w-6 h-6 mb-4 text-black" />
            <h4 className="text-base font-bold text-black mb-2">Estimated delivery</h4>
            <p className="text-xs text-gray-500 font-medium">Within 5-7 business days during promotional periods</p>
          </div>

          {/* Secure Payment */}
          <div className="flex flex-col items-center text-center px-4 md:px-8 pt-8 md:pt-0">
            <ShieldCheck className="w-6 h-6 mb-4 text-black" />
            <h4 className="text-base font-bold text-black mb-2">Secure payment</h4>
            <p className="text-xs text-gray-500 font-medium">Your payment information is processed securely</p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default async function Footer() {
  const { collections } = await getCollectionsList(0, 6)

  return (
    <footer className="w-full">
      <TrustSection />
      
      <div className="w-full bg-[#1c1c1c] text-white pt-16 pb-8">
        <div className="max-w-[1440px] mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            
            {/* Brand & Socials */}
            <div className="flex flex-col">
              <LocalizedClientLink href="/" className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
                <img src="/LogoLight.png" alt="Libera" className="h-10 w-auto object-contain" />
              </LocalizedClientLink>
              <div className="flex items-center gap-4">
                <a href="#" className="text-white hover:text-gray-400 transition-colors">
                  <FacebookIcon className="w-5 h-5" />
                </a>
                <a href="#" className="text-white hover:text-gray-400 transition-colors">
                  <InstagramIcon className="w-5 h-5" />
                </a>
                <a href="#" className="text-white hover:text-gray-400 transition-colors">
                  <TikTokIcon className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Shop Now */}
            <div className="flex flex-col">
              <h4 className="text-base font-bold mb-4">Shop Now</h4>
              <ul className="flex flex-col gap-3 text-sm text-gray-400">
                {collections && collections.length > 0 ? (
                  collections.slice(0, 4).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink href={`/collections/${c.handle}`} className="hover:text-white transition-colors">
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))
                ) : (
                  <>
                    <li><LocalizedClientLink href="/store" className="hover:text-white transition-colors">Men</LocalizedClientLink></li>
                    <li><LocalizedClientLink href="/store" className="hover:text-white transition-colors">Junior</LocalizedClientLink></li>
                    <li><LocalizedClientLink href="/store" className="hover:text-white transition-colors">Leather Collection</LocalizedClientLink></li>
                  </>
                )}
              </ul>
            </div>

            {/* Information */}
            <div className="flex flex-col">
              <h4 className="text-base font-bold mb-4">Information</h4>
              <ul className="flex flex-col gap-3 text-sm text-gray-400">
                <li><LocalizedClientLink href="/contact" className="hover:text-white transition-colors">Contact</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/corporate-sales" className="hover:text-white transition-colors">Corporate Sales</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/loyalty" className="hover:text-white transition-colors">Loyalty</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/faq" className="hover:text-white transition-colors">FAQ</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/shipping" className="hover:text-white transition-colors">Shipping Policy</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/returns" className="hover:text-white transition-colors">Return Policy</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/terms" className="hover:text-white transition-colors">Terms and Conditions</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/privacy" className="hover:text-white transition-colors">Privacy Policy</LocalizedClientLink></li>
              </ul>
            </div>

            {/* Contact Information */}
            <div className="flex flex-col">
              <h4 className="text-base font-bold mb-4">Contact Information</h4>
              <ul className="flex flex-col gap-3 text-sm text-gray-400">
                <li>
                  <span className="text-gray-400">Email: </span>
                  <a href="mailto:onlinesales@libera.lk" className="text-white hover:text-gray-300 font-medium">onlinesales@libera.lk</a>
                </li>
                <li>
                  <span className="text-gray-400">Phone: </span>
                  <a href="tel:0777993883" className="text-white hover:text-gray-300 font-medium">0777 993 883</a>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="border-t border-[#333] pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} LiberaLK. Powered by Medusa</p>
            <div className="flex items-center gap-4">
              <LocalizedClientLink href="/privacy" className="hover:text-white transition-colors">Privacy policy</LocalizedClientLink>
              <LocalizedClientLink href="/terms" className="hover:text-white transition-colors">Terms of service</LocalizedClientLink>
              <LocalizedClientLink href="/refunds" className="hover:text-white transition-colors">Refund policy</LocalizedClientLink>
              <LocalizedClientLink href="/shipping" className="hover:text-white transition-colors">Shipping policy</LocalizedClientLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
