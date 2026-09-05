/**
 * Wraps a server-side fetch/SDK call with a hard timeout and retry-with-backoff.
 *
 * @medusajs/js-sdk's client has no built-in timeout or retry — a slow backend
 * response just hangs the RSC render indefinitely (bounded only by whatever
 * upstream proxy eventually kills the connection, which is what was likely
 * surfacing as intermittent 503s under load), and a single transient 5xx/
 * network blip has no chance to self-heal on the next attempt.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  {
    retries = 2,
    timeoutMs = 8000,
    baseDelayMs = 300,
  }: { retries?: number; timeoutMs?: number; baseDelayMs?: number } = {}
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error(`Request timed out after ${timeoutMs}ms`)),
            timeoutMs
          )
        }),
      ])
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        // Exponential backoff: 300ms, 600ms, 1200ms, ...
        await new Promise((resolve) =>
          setTimeout(resolve, baseDelayMs * 2 ** attempt)
        )
      }
    }
  }

  throw lastError
}

/**
 * @medusajs/js-sdk's request config type (`ClientHeaders`) only declares
 * `next: { tags: string[] }` — no `revalidate` — even though the SDK just
 * spreads this object straight into the underlying `fetch()` call
 * (see normalizeRequest() in @medusajs/js-sdk/dist/client.js), which DOES
 * support `next.revalidate`. The cast here is deliberate: it's a gap in the
 * SDK's types, not an actual runtime restriction.
 */
export function nextFetchOptions(tags: string[], revalidateSeconds: number) {
  return { next: { tags, revalidate: revalidateSeconds } } as { next: { tags: string[] } }
}
