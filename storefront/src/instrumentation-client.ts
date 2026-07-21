import * as Sentry from "@sentry/nextjs"

/**
 * Client-side error tracking. Next.js (15.3+) auto-loads this file on the
 * client — no manual import needed. No-ops safely if the DSN isn't set.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
