import * as Sentry from "@sentry/nextjs"

/**
 * Server/edge-side error tracking. No-ops safely if SENTRY_DSN isn't set —
 * this is scaffolding until real Sentry project credentials are provided.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      // Checkout/payment code paths call Sentry.captureException directly
      // with extra context (see payment-wrapper, checkout actions) — this
      // base config just needs to be initialized for those calls to send.
    })
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
    })
  }
}

export const onRequestError = Sentry.captureRequestError
