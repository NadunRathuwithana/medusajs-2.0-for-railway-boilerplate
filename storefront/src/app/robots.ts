import { MetadataRoute } from "next"

const BASE_URL = "https://cardle.lk"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Real pages live under the /lk region prefix (checkout/account/cart
        // are route groups inside app/[countryCode], not bare top-level
        // routes) — disallowing only the bare, non-prefixed paths left the
        // actual /lk/checkout, /lk/account and /lk/cart pages fully
        // crawlable. Both forms are blocked here so it holds regardless.
        disallow: [
          "/api/",
          "/checkout/",
          "/account/",
          "/cart",
          "/admin/",
          "/lk/checkout/",
          "/lk/account/",
          "/lk/cart",
        ],
      },
      // Allow image crawler explicitly (important for image SEO)
      {
        userAgent: "Googlebot-Image",
        allow: "/",
      },
      // Allow AI crawlers explicitly (AEO — Answer Engine Optimisation)
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout/", "/lk/account/"],
      },
      {
        userAgent: "Claude-Web",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout/", "/lk/account/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout/", "/lk/account/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout/", "/lk/account/"],
      },
      // Block common scraper bots that aren't useful
      {
        userAgent: "CCBot",
        disallow: "/",
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
