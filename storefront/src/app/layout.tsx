import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
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
  authors: [{ name: "Cardle", url: "https://cardle.lk" }],
  creator: "Cardle",
  publisher: "Cardle",
  alternates: {
    canonical: "https://cardle.lk",
  },
  openGraph: {
    type: "website",
    locale: "en_LK",
    url: "https://cardle.lk",
    siteName: "Cardle",
    title: "Cardle – Premium Cotton Tote Bags Sri Lanka",
    description:
      "Handcrafted, make-to-order cotton tote bags. Shop the Cardle collection online.",
    images: [
      {
        url: "https://cardle.lk/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cardle Premium Cotton Tote Bags Sri Lanka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cardle – Premium Cotton Tote Bags Sri Lanka",
    description: "Handcrafted make-to-order cotton tote bags. Shop online at cardle.lk",
    images: ["https://cardle.lk/og-image.jpg"],
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

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body suppressHydrationWarning>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
