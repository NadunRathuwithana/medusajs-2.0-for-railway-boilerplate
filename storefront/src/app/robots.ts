import { MetadataRoute } from "next"

const BASE_URL = "https://cardle.lk"

export default function robots(): MetadataRoute.Robots {
  if (/\/\/(dev|staging)\./.test(process.env.NEXT_PUBLIC_BASE_URL || "")) {
    return { rules: [{ userAgent: "*", disallow: "/" }] }
  }
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
          "/lk/checkout",
          "/lk/account",
          "/lk/cart",
          "/lk/search",
          "/lk/results/",
          "/lk/order/",
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
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout", "/lk/account", "/lk/cart", "/lk/search", "/lk/results/", "/lk/order/"],
      },
      // "Claude-Web" is a retired user-agent string — Anthropic's current
      // crawlers are ClaudeBot (bulk/training crawl) and Claude-User
      // (real-time fetches on a user's behalf). Targeting the live names
      // instead of a name that matches neither.
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout", "/lk/account", "/lk/cart", "/lk/search", "/lk/results/", "/lk/order/"],
      },
      {
        userAgent: "Claude-User",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout", "/lk/account", "/lk/cart", "/lk/search", "/lk/results/", "/lk/order/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout", "/lk/account", "/lk/cart", "/lk/search", "/lk/results/", "/lk/order/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout", "/lk/account", "/lk/cart", "/lk/search", "/lk/results/", "/lk/order/"],
      },
      {
        userAgent: "Applebot-Extended",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout", "/lk/account", "/lk/cart", "/lk/search", "/lk/results/", "/lk/order/"],
      },
      {
        userAgent: "Amazonbot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout", "/lk/account", "/lk/cart", "/lk/search", "/lk/results/", "/lk/order/"],
      },
      {
        userAgent: "Bytespider",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout", "/lk/account", "/lk/cart", "/lk/search", "/lk/results/", "/lk/order/"],
      },
      // Common Crawl feeds many LLM pretraining datasets — allowing it
      // (with the same path restrictions as the other AI crawlers) improves
      // the site's visibility in models trained on Common Crawl snapshots.
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/lk/checkout", "/lk/account", "/lk/cart", "/lk/search", "/lk/results/", "/lk/order/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
