import CookieNotice from "@components/cookie-notice"
import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { IS_INDEXABLE, SITE_URL } from "@lib/util/site"
import "styles/globals.css"

// Static metadata: no headers() here, so pages are not forced to render
// dynamically just for a canonical. Each indexable page sets its own
// alternates.canonical (see lib/util/site.ts).
const CANONICAL_SITE_URL = SITE_URL

export async function generateMetadata(): Promise<Metadata> {
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
    openGraph: {
      images: [{ url: "/cardle-cotton-tote-bags-sri-lanka-preview.jpg", alt: "Cardle cotton tote bags" }],
      type: "website",
      locale: "en_LK",
      url: CANONICAL_SITE_URL,
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
    robots: !IS_INDEXABLE ? { index: false, follow: false } : {
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
    other: {
      "facebook-domain-verification": "yvanftcs05s6tpmywdo6psw2l97vz7",
    },
  }
}

import MetaPixel from "@components/analytics/MetaPixel"
import MetaParamSync from "@components/analytics/MetaParamSync"
import GoogleAnalytics from "@components/analytics/GoogleAnalytics"
import { Suspense } from "react"

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body suppressHydrationWarning>
        <Suspense fallback={null}>
          <MetaPixel />
          <MetaParamSync />
          <GoogleAnalytics />
        </Suspense>
        <main className="relative">{props.children}</main>
        <CookieNotice />
      </body>
    </html>
  )
}
