const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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
      {
        protocol: "http",
        hostname: "localhost",
      },
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
      { // Note: can be removed after deleting demo products
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      { // Note: can be removed after deleting demo products
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      { // Note: can be removed after deleting demo products
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      ...(process.env.NEXT_PUBLIC_MINIO_ENDPOINT ? [{ // Note: needed when using MinIO bucket storage for media
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_MINIO_ENDPOINT,
      }] : []),
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
