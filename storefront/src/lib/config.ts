import Medusa from "@medusajs/js-sdk"

// Defaults to standard port for Medusa server
let MEDUSA_BACKEND_URL = "http://localhost:9000"

if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
}

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

// Medusa SDK treats the 3rd arg of list()/retrieve() as request headers, so
// `next: { revalidate }` never reached fetch() and every page view hit the
// backend. Hoist it into the fetch init so Next's data cache actually applies.
const __origFetch = sdk.client.fetch.bind(sdk.client)
;(sdk.client as any).fetch = (input: any, init?: any) => {
  const h = init?.headers
  if (h && typeof h === "object" && h.next && typeof h.next === "object") {
    const { next, ...rest } = h
    return (__origFetch as any)(input, { ...init, headers: rest, next })
  }
  return (__origFetch as any)(input, init)
}
