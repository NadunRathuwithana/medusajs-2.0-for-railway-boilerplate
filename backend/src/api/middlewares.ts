import { defineMiddlewares } from "@medusajs/medusa"
import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { rateLimit } from "../lib/rate-limit"
import { readPackingSettings } from "../modules/addons/lib"

async function blockInternalPackingVariant(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const vid = (req.body as any)?.variant_id
    if (vid) {
      const settings: any = await readPackingSettings(req.scope)
      if (settings?.variant_id && settings.variant_id === vid) {
        res.status(400).json({ message: "This item can't be added to the cart" })
        return
      }
    }
  } catch {}
  next()
}

/**
 * Parses application/x-www-form-urlencoded bodies for the Koko webhook route.
 * Koko POSTs form data (not JSON) to _responseUrl. Medusa's default body parser
 * only handles JSON, so we use Node's built-in URLSearchParams to parse the
 * rawBody that Medusa preserves on every request.
 *
 * No extra npm packages needed — URLSearchParams is a Node.js global since v10.
 */
function parseKokoWebhookBody(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
): void {
  const contentType = req.headers["content-type"] ?? ""
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const rawBody = (req as any).rawBody
    if (rawBody) {
      const str = typeof rawBody === "string" ? rawBody : rawBody.toString("utf-8")
      const params = new URLSearchParams(str)
      ;(req as any).body = Object.fromEntries(params.entries())
    }
  }
  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/my-orders",
      middlewares: [
        (req, res, next) => {
          const { authenticate } = require("@medusajs/medusa")
          return authenticate("customer", ["session", "bearer"])(req, res, next)
        }
      ],
    },
    {
      matcher: "/webhooks/koko",
      middlewares: [
        parseKokoWebhookBody,
        // Generous limit — this is server-to-server gateway traffic, possibly
        // sharing a source IP across many merchants, not end-user traffic.
        // The real trust boundary is the RSA signature check inside
        // getWebhookActionAndData, this just guards against junk-request floods.
        rateLimit({ windowMs: 60_000, max: 60, keyPrefix: "webhook-koko" }),
      ],
    },
    {
      matcher: "/webhooks/onepay",
      middlewares: [
        rateLimit({ windowMs: 60_000, max: 60, keyPrefix: "webhook-onepay" }),
      ],
    },
    {
      matcher: "/store/onepay/*",
      middlewares: [
        rateLimit({
          windowMs: 60_000,
          max: 60,
          keyPrefix: "onepay-js",
          // The storefront server makes these calls, so the client IP is not
          // available: bucket per cart/txn so customers never share a limit.
          keyFn: (req) => {
            const b: any = req.body || {}
            const q: any = req.query || {}
            return String(b.cart_id || q.cart_id || b.transaction_id || q.transaction_id || b.txn_id || "shared")
          },
        }),
      ],
    },
    {
      matcher: "/store/contact",
      middlewares: [
        rateLimit({ windowMs: 15 * 60_000, max: 5, keyPrefix: "contact" }),
      ],
    },
    {
      // Payment callbacks/webhooks: generous per-IP cap so junk traffic can't
      // hammer Onepay's status API or the DB (real providers send a handful).
      matcher: "/hooks/payment/*",
      middlewares: [rateLimit({ windowMs: 60_000, max: 120, keyPrefix: "hooks-payment" })],
    },
    {
      matcher: "/collect",
      middlewares: [rateLimit({ windowMs: 60_000, max: 60, keyPrefix: "collect" })],
    },
    {
      matcher: "/api/collect",
      middlewares: [rateLimit({ windowMs: 60_000, max: 60, keyPrefix: "collect" })],
    },
    {
      matcher: "/webhooks/onepay",
      middlewares: [rateLimit({ windowMs: 60_000, max: 120, keyPrefix: "onepay-webhook" })],
    },
    {
      // The packing product is internal: it is only added by /packing at its
      // configured price, never through the generic line-items endpoint.
      matcher: "/store/carts/:id/line-items",
      method: ["POST"],
      middlewares: [blockInternalPackingVariant],
    },
    {
      matcher: "/store/carts/:id/addon-items",
      middlewares: [rateLimit({ windowMs: 60_000, max: 30, keyPrefix: "addon-items", keyFn: (req) => String((req.params as any)?.id || "shared") })],
    },
    {
      matcher: "/store/carts/:id/reprice-extras",
      middlewares: [rateLimit({ windowMs: 60_000, max: 30, keyPrefix: "reprice-extras", keyFn: (req) => String((req.params as any)?.id || "shared") })],
    },
    {
      matcher: "/store/carts/:id/promotions",
      middlewares: [rateLimit({ windowMs: 60_000, max: 20, keyPrefix: "promo-apply", keyFn: (req) => String((req.params as any)?.id || "shared") })],
    },
    {
      // Login / register / reset: keyed by the email being tried, so one
      // account can't be brute-forced (storefront calls come from one IP).
      matcher: "/auth/customer/emailpass*",
      middlewares: [rateLimit({ windowMs: 15 * 60_000, max: 10, keyPrefix: "auth", keyFn: (req) => String(((req.body as any)?.email || (req.body as any)?.identifier || "shared")).toLowerCase().slice(0, 120) })],
    },
    {
      matcher: "/store/customers",
      method: ["POST"],
      middlewares: [rateLimit({ windowMs: 15 * 60_000, max: 10, keyPrefix: "register", keyFn: (req) => String((req.body as any)?.email || "shared").toLowerCase().slice(0, 120) })],
    },
    {
      matcher: "/store/carts/:id/complete",
      middlewares: [
        rateLimit({ windowMs: 60_000, max: 10, keyPrefix: "cart-complete", keyFn: (req) => String((req.params as any)?.id || "shared") }),
      ],
    },
    {
      // Public, unauthenticated, and cached — this limit is just a backstop
      // against abuse/scraping, not something Meta's normal polling cadence
      // should ever come close to.
      matcher: "/feed/meta-catalog.xml",
      middlewares: [
        rateLimit({ windowMs: 60_000, max: 30, keyPrefix: "meta-catalog-feed" }),
      ],
    },
    {
      matcher: "/feed/google-merchant.xml",
      middlewares: [
        rateLimit({ windowMs: 60_000, max: 30, keyPrefix: "google-merchant-feed" }),
      ],
    },
  ],
})
