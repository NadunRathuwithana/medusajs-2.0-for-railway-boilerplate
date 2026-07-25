import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { headers } from "next/headers"
import "styles/globals.css"

// Canonical host is always the non-www apex domain, regardless of which
// host (www.cardle.lk or cardle.lk) actually served the request.
const CANONICAL_SITE_URL = "https://cardle.lk"

// Locale-prefixed routes (e.g. /lk, /lk/store) canonicalize to the
// un-prefixed path, matching the convention already used by pages that set
// their own canonical (faq, products/[handle], etc).
function toCanonicalPath(pathname: string) {
  const stripped = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "")
  return stripped === "" ? "/" : stripped
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || "/"
  const canonicalPath = toCanonicalPath(pathname)
  const canonicalUrl = `${CANONICAL_SITE_URL}${
    canonicalPath === "/" ? "" : canonicalPath
  }`

  return {
    metadataBase: new URL(getBaseURL()),
    title: {
      default: "Cardle – Premium Cotton Tote Bags Sri Lanka",
      template: "%s | Cardle Sri Lanka",
    },
    description:
      "Shop handcrafted, make-to-order cotton tote bags in Sri Lanka. Premium quality, sustainable materials. Order online at cardle.lk",
    keywords: [
      "tote bag sri lanka",
      "cotton tote bag",
      "buy tote bag online sri lanka",
      "premium bags lk",
      "cardle",
      "cardle bags",
      "sustainable bags sri lanka",
    ],
    authors: [{ name: "Cardle", url: CANONICAL_SITE_URL }],
    creator: "Cardle",
    publisher: "Cardle",
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: "en_LK",
      url: canonicalUrl,
      siteName: "Cardle",
      title: "Cardle – Premium Cotton Tote Bags Sri Lanka",
      description:
        "Handcrafted, make-to-order cotton tote bags. Shop the Cardle collection online.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Cardle – Premium Cotton Tote Bags Sri Lanka",
      description: "Handcrafted make-to-order cotton tote bags. Shop online at cardle.lk",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  }
}

import MetaPixel from "@components/analytics/MetaPixel"
import GoogleAnalytics from "@components/analytics/GoogleAnalytics"
import { Suspense } from "react"

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body suppressHydrationWarning>
        <Suspense fallback={null}>
          <MetaPixel />
          <GoogleAnalytics />
        </Suspense>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
