import type { Metadata } from "next"
import { NOINDEX } from "@lib/util/site"
import Nav from "@modules/layout/templates/nav"
import Footer from "@modules/layout/templates/footer"

export const metadata: Metadata = { robots: NOINDEX }

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-white relative small:min-h-screen">
      <Nav />
      <div className="relative" data-testid="checkout-container">{children}</div>
      <Footer />
    </div>
  )
}
