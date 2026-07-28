import Medusa from "@medusajs/js-sdk"

// Same-origin + session auth: the admin dashboard and its API are served by
// this same Medusa backend, so there's no separate admin base-URL to
// configure. Only ever imported from client-rendered widget code.
export const sdk = new Medusa({
  baseUrl: typeof window !== "undefined" ? window.location.origin : "",
  auth: { type: "session" },
})
