import { defineMiddlewares } from "@medusajs/medusa"
import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"

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
      middlewares: [parseKokoWebhookBody],
    },
  ],
})
