"use client"

import { useReportWebVitals } from "next/web-vitals"

/**
 * Real User Monitoring for Core Web Vitals — sends field data (real visitor
 * measurements) to GA4, complementing Lighthouse's lab-only scores. Not
 * hosted on Vercel, so Vercel Analytics isn't an option here; GA4 is already
 * wired up, so this reuses it instead of adding another vendor.
 */
export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (typeof window === "undefined" || !window.gtag) return

    window.gtag("event", metric.name, {
      event_category: "Web Vitals",
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_delta: metric.delta,
      non_interaction: true,
    })
  })

  return null
}
