import { getCollectionsList } from "@lib/data/collections"
import { Text } from "@medusajs/ui"
import { Headset, Package, ShieldCheck } from "lucide-react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
)

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
)

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
  </svg>
)

const TrustSection = () => {
  return (
    <div className="w-full bg-white border-t border-gray-150">
      <div className="max-w-[1440px] mx-auto px-6 md:px-16 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-150">
          {/* Customer Service */}
          <div className="flex flex-col items-center text-center px-4 md:px-8 pt-8 md:pt-0">
            <Headset className="w-6 h-6 mb-4 text-bold" strokeWidth={1.5} />
            <h4 className="text-sm font-bold capitalize tracking-wider text-bold mb-2">
              Customer Care
            </h4>
            <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[280px]">
              Available 24/7 via live support or email to guide your everyday
              carry.
            </p>
          </div>

          {/* Estimated Delivery */}
          <div className="flex flex-col items-center text-center px-4 md:px-8 pt-8 md:pt-0">
            <Package className="w-6 h-6 mb-4 text-bold" strokeWidth={1.5} />
            <h4 className="text-sm font-bold capitalize tracking-wider text-bold mb-2">
              Fast Delivery
            </h4>
            <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[280px]">
              Standard delivery in 2-5 days. Transparent shipping rates with no
              hidden fees.
            </p>
          </div>

          {/* Secure Payment */}
          <div className="flex flex-col items-center text-center px-4 md:px-8 pt-8 md:pt-0">
            <ShieldCheck className="w-6 h-6 mb-4 text-bold" strokeWidth={1.5} />
            <h4 className="text-sm font-bold capitalize tracking-wider text-bold mb-2">
              Flexible Payments
            </h4>
            <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[280px]">
              Secure processing for Visa, Mastercard, Koko Pay & Cash on
              Delivery.
            </p>
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

      <div className="w-full bg-[#0c0c0c] text-white pt-16 pb-8 border-t border-zinc-900">
        <div className="max-w-[1440px] mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            {/* Brand, Socials & Newsletter */}
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-2xl font-bold capitalize tracking-widest text-white leading-none">
                  Cardle
                </span>
                <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 capitalize mt-0.5">
                  Elevating the Everyday Carry
                </p>
              </div>

              {/* Newsletter form */}
              {/* <div className="flex flex-col gap-2.5">
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  Join our exclusive inner circle to get early notifications of
                  product drops and personalization releases.
                </p>
                <form className="relative flex w-full mt-1">
                  <input
                    type="email"
                    placeholder="ENTER YOUR EMAIL"
                    className="w-full bg-[#161616] border border-zinc-800 rounded-full py-2.5 px-4 text-[11px] text-white placeholder:text-gray-500 tracking-wider focus:outline-none focus:border-zinc-500 transition-colors capitalize"
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-white text-bold px-4 py-1.5 rounded-full text-[10px] font-bold capitalize hover:bg-gray-200 transition-colors"
                  >
                    Join
                  </button>
                </form>
              </div> */}

              {/* Social Icons */}
              <div className="flex items-center gap-2 mt-2">
                <a
                  href="https://www.facebook.com/people/Cardlelk/61585796349137/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img
                    src="/social/facebook.png"
                    alt="Facebook"
                    className="w-8 h-8 object-contain"
                  />
                </a>
                <a
                  href="https://www.instagram.com/cardle_lk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img
                    src="/social/instagram.png"
                    alt="Instagram"
                    className="w-8 h-8 object-contain"
                  />
                </a>
                <a
                  href="https://www.tiktok.com/@cardle.srilanka/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img
                    src="/social/tiktok.png"
                    alt="TikTok"
                    className="w-8 h-8 object-contain"
                  />
                </a>
                <a
                  href="https://wa.me/94779497859"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img
                    src="/social/whatsapp.png"
                    alt="WhatsApp"
                    className="w-8 h-8 object-contain"
                  />
                </a>
              </div>
            </div>

            {/* Shop Now */}
            <div className="flex flex-col">
              <h4 className="text-xs font-bold tracking-[0.15em] text-gray-300 capitalize mb-4">
                Shop Collections
              </h4>
              <ul className="flex flex-col gap-3 text-[13px] text-gray-400 font-medium">
                {collections && collections.length > 0 ? (
                  collections.slice(0, 5).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        href={`/collections/${c.handle}`}
                        className="hover:text-white transition-colors"
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))
                ) : (
                  <>
                    <li>
                      <LocalizedClientLink
                        href="/store"
                        className="hover:text-white transition-colors"
                      >
                        Totes & Bags
                      </LocalizedClientLink>
                    </li>
                    <li>
                      <LocalizedClientLink
                        href="/store"
                        className="hover:text-white transition-colors"
                      >
                        Backpacks
                      </LocalizedClientLink>
                    </li>
                    <li>
                      <LocalizedClientLink
                        href="/store"
                        className="hover:text-white transition-colors"
                      >
                        Custom Personalisation
                      </LocalizedClientLink>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Information */}
            <div className="flex flex-col">
              <h4 className="text-xs font-bold tracking-[0.15em] text-gray-300 capitalize mb-4">
                Information
              </h4>
              <ul className="flex flex-col gap-3 text-[13px] text-gray-400 font-medium">
                {/* <li>
                  <LocalizedClientLink
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    About Us
                  </LocalizedClientLink>
                </li> */}
                <li>
                  <LocalizedClientLink
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/faq"
                    className="hover:text-white transition-colors"
                  >
                    FAQ
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div className="flex flex-col">
              <h4 className="text-xs font-bold tracking-[0.15em] text-gray-300 capitalize mb-4">
                Contact Information
              </h4>
              <ul className="flex flex-col gap-3 text-[13px] text-gray-400 font-medium">
                <li>
                  <span className="text-gray-500">Email: </span>
                  <a
                    href="mailto:support@cardle.com"
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    support@cardle.com
                  </a>
                </li>
                <li>
                  <span className="text-gray-500">Phone: </span>
                  <a
                    href="tel:+94777993883"
                    className="text-white hover:text-gray-300 transition-colors font-medium"
                  >
                    +94 777 993 883
                  </a>
                </li>
                <li className="mt-4 pt-4 border-t border-zinc-900">
                  <span className="block text-[11px] font-bold text-gray-500 tracking-wider capitalize mb-1">
                    Office Hours
                  </span>
                  <span className="text-xs text-gray-400 block">
                    Mon - Fri: 9:00 AM - 6:00 PM
                  </span>
                  <span className="text-xs text-gray-400 block">
                    Sat: 10:00 AM - 4:00 PM
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-zinc-900 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Cardle . All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 font-medium">
              <LocalizedClientLink
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy policy
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Terms of service
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/refunds"
                className="hover:text-white transition-colors"
              >
                Refund policy
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/returns"
                className="hover:text-white transition-colors"
              >
                Return & Exchange policy
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/shipping"
                className="hover:text-white transition-colors"
              >
                Shipping policy
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
