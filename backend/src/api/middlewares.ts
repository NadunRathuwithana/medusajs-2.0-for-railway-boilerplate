import { defineMiddlewares } from "@medusajs/medusa"
import express from "express"

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
      // Koko POSTs its _responseUrl webhook as application/x-www-form-urlencoded.
      // Medusa's default body parser only handles JSON, so we register the
      // urlencoded parser here specifically for this route.
      matcher: "/webhooks/koko",
      middlewares: [
        express.urlencoded({ extended: true }),
      ],
    },
  ],
})
