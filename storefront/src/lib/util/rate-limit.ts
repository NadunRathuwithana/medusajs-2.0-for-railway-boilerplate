import "server-only"

/**
 * In-memory sliding-window limiter for storefront-side endpoints (server
 * actions, route handlers). Fine for a single storefront instance — if this
 * ever runs across multiple instances, move to a shared store (e.g. Redis,
 * as the backend's rate limiting already does).
 */
const buckets = new Map<string, number[]>()

export function isRateLimited(
  key: string,
  { windowMs, max }: { windowMs: number; max: number }
): boolean {
  const now = Date.now()
  const recent = (buckets.get(key) || []).filter((t) => now - t < windowMs)
  recent.push(now)
  buckets.set(key, recent)

  // Bound memory growth from distinct keys hammering the process.
  if (buckets.size > 10000) {
    buckets.clear()
  }

  return recent.length > max
}
