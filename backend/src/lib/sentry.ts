import * as Sentry from "@sentry/node"

/**
 * Backend error tracking — no-ops safely if SENTRY_DSN isn't set. Imported
 * for its side effect at the top of medusa-config.js so it initializes as
 * early as possible in the process lifecycle.
 *
 * Payment webhook handlers and the koko/onepay payment services call
 * Sentry.captureException directly (see api/webhooks/*, modules/koko-payment,
 * modules/onepay-payment) in addition to their existing console logging, so
 * webhook/payment failures show up here instead of only in Railway's log
 * tail.
 */
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    // SENTRY_ENVIRONMENT (e.g. "dev" / "production") tells dev and live apart.
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
  })
}

export { Sentry }
