import { defineMiddlewares } from "@medusajs/medusa"

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
  ],
})
