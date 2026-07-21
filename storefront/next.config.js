const checkEnvVariables = require("./check-env-variables")
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

checkEnvVariables()

// Next's remotePatterns matches `hostname` and `port` as separate fields, so a bare
// string split on the URL (e.g. "localhost:8000") must not be passed as `hostname` —
// that silently never matched once real (non-unoptimized) image checking is enabled.
function toRemotePattern(url) {
  try {
    const { protocol, hostname, port } = new URL(url)
    return {
      protocol: protocol.replace(":", ""),
      hostname,
      ...(port ? { port } : {}),
    }
  } catch {
    return null
  }
}

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
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      { // Note: covers Medusa backend / bucket / storefront services on Railway,
        // whose hostnames are per-deploy subdomains of up.railway.app
        protocol: "https",
        hostname: "**.up.railway.app",
      },
      ...(process.env.NEXT_PUBLIC_BASE_URL // Note: needed to serve images from /public folder
        ? [toRemotePattern(process.env.NEXT_PUBLIC_BASE_URL)].filter(Boolean)
        : []),
      ...(process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL // Note: only needed when using local-file for product media
        ? [toRemotePattern(process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL)].filter(Boolean)
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
  }
}

module.exports = withBundleAnalyzer(nextConfig)
