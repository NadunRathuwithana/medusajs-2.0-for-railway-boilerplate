/**
 * Ask the storefront to drop cached data for these tags (CMS edits show at
 * once instead of after 1-2 minutes). Off unless STOREFRONT_REVALIDATE_URL and
 * REVALIDATE_SECRET are set. Never throws.
 */
export async function revalidateStorefront(tags: string[]) {
  const url = process.env.STOREFRONT_REVALIDATE_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!url || !secret) return
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(3000),
    })
  } catch {}
}
