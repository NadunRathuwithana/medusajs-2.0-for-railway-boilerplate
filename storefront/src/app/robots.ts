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
      // "Claude-Web" is a retired user-agent string — Anthropic's current
      // crawlers are ClaudeBot (bulk/training crawl) and Claude-User
      // (real-time fetches on a user's behalf). Targeting the live names
      // instead of a name that matches neither.
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout/", "/lk/account/"],
      },
      {
        userAgent: "Claude-User",
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
      {
        userAgent: "Applebot-Extended",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout/", "/lk/account/"],
      },
      {
        userAgent: "Amazonbot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout/", "/lk/account/"],
      },
      {
        userAgent: "Bytespider",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout/", "/lk/account/"],
      },
      // Common Crawl feeds many LLM pretraining datasets — allowing it
      // (with the same path restrictions as the other AI crawlers) improves
      // the site's visibility in models trained on Common Crawl snapshots.
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout/", "/lk/account/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
