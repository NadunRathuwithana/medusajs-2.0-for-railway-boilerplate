const checkEnvVariables = require("./check-env-variables")
const { withSentryConfig } = require("@sentry/nextjs")
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
  },
  async headers() {
    // CSP is shipped as Report-Only: the checkout flow depends on Stripe
    // Elements/PayPal iframes and a Koko hidden-form POST to a gateway domain
    // that can change between QA/prod, and this can't be verified against a
    // live payment sandbox from here. Report-Only logs violations to the
    // console without blocking anything, so it's safe to ship now — flip
    // reportOnly to false only after confirming a real checkout (all 3
    // payment methods) shows no CSP violations in the browser console.
    const cspDirectives = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net https://js.stripe.com https://www.paypal.com https://www.paypalobjects.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https: http://localhost:*",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
    ]

    const securityHeaders = [
      {
        key: "Content-Security-Policy-Report-Only",
        value: cspDirectives.join("; "),
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ]

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = withSentryConfig(withBundleAnalyzer(nextConfig), {
  // Scaffolding — sourcemap upload silently no-ops without these until set:
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: false,
  },
  // We already have our own CSP; Sentry's tunnel route would need adding to
  // connect-src if enabled later (not needed while ad-blocker evasion isn't a
  // priority for a payment gateway's own outbound calls).
  tunnelRoute: undefined,
})
