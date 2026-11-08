const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * @type {import('next').NextConfig}
 */
const backendHost = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://api.cardle.lk"
const searchHost = process.env.NEXT_PUBLIC_SEARCH_ENDPOINT || ""

// Report-only: browsers log violations to the console but block nothing.
// Review the console on dev.cardle.lk across browse, cart and checkout, add any
// legitimate source that shows up, then switch the header key to
// "Content-Security-Policy" to enforce.
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://www.googletagmanager.com https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://media.cardle.lk https://www.facebook.com https://www.google-analytics.com https://www.googletagmanager.com ${backendHost}`,
  `connect-src 'self' ${backendHost} ${searchHost} https://www.facebook.com https://connect.facebook.net https://www.google-analytics.com https://*.google-analytics.com https://api.stripe.com`,
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.facebook.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ")

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // Was unoptimized:true — Next.js was serving every product photo (raw
    // ~1638x2048 uploads from the Medusa media bucket) at full resolution
    // and original format with no resizing/WebP-AVIF conversion, even
    // though the components already use next/image with a `sizes` prop.
    // This is what the "~6.2MB of oversized images" Lighthouse finding
    // was actually pointing at — flipping it on lets Next's built-in
    // optimizer do the resize/reformat work it was already set up for.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...(process.env.NODE_ENV !== "production"
        ? [{ protocol: "http", hostname: "localhost" }]
        : []),
      ...(process.env.NEXT_PUBLIC_BASE_URL
        ? [{ // Note: needed to serve images from /public folder
            protocol: process.env.NEXT_PUBLIC_BASE_URL.startsWith("https") ? "https" : "http",
            hostname: process.env.NEXT_PUBLIC_BASE_URL.replace(/^https?:\/\//, ""),
          }]
        : []),
      ...(process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
        ? [{ // Note: only needed when using local-file for product media
            protocol: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL.startsWith("https") ? "https" : "http",
            hostname: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL.replace(/^https?:\/\//, ""),
          }]
        : []),
      // Media bucket migration (bucket-uat-5fec.up.railway.app -> media.cardle.lk) is
      // finished and the old host is no longer allowed. Notes from the migration:
      // existing DB rows have the OLD host baked into their absolute image
      // URLs, so both hosts must stay allowed simultaneously through the
      // whole migration — switching NEXT_PUBLIC_MINIO_ENDPOINT alone made
      // the Next.js image optimizer 400 every pre-existing image the moment
      // the old host stopped being an allowed remotePattern. Hardcoded
      // (not just derived from the env var) so this doesn't silently regress
      // again the next time the env var changes.
      // TODO: remove "bucket-uat-5fec.up.railway.app" after 2026-10-01 once
      // the media.cardle.lk migration is confirmed stable.
      {
        protocol: "https",
        hostname: "media.cardle.lk",
      },
      ...(process.env.NEXT_PUBLIC_MINIO_ENDPOINT &&
      process.env.NEXT_PUBLIC_MINIO_ENDPOINT !== "bucket-uat-5fec.up.railway.app" &&
      process.env.NEXT_PUBLIC_MINIO_ENDPOINT !== "media.cardle.lk"
        ? [{ // Note: needed when using MinIO bucket storage for media (e.g. local dev pointing at a different endpoint)
            protocol: "https",
            hostname: process.env.NEXT_PUBLIC_MINIO_ENDPOINT,
          }]
        : []),
    ],
  },
  serverRuntimeConfig: {
    port: process.env.PORT || 3000
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.cardle.lk" }],
        destination: "https://cardle.lk/:path*",
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        // Baseline security headers on every response. A strict CSP is
        // deliberately left out until it has been tested against Stripe,
        // Meta Pixel and GA.
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
        ],
      },
      {
        // Everything except _next/static, _next/image, and favicon.ico —
        // in particular every HTML document (the "/" region-redirect stub
        // included) must never be cached by Cloudflare or the browser, or a
        // stale pre-redirect / pre-deploy response gets served forever.
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
