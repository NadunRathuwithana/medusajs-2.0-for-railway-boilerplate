import { MetadataRoute } from "next"

const BASE_URL = "https://cardle.lk"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/checkout/",
          "/account/",
          "/cart",
          "/admin/",
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
        disallow: ["/api/", "/checkout/", "/account/"],
      },
      {
        userAgent: "Claude-Web",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/"],
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
