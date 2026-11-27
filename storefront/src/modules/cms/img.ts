/**
 * srcSet through Next's image optimizer (resized + AVIF/WebP) for CMS images
 * that are art-directed with <picture>. Hosts not allowed in next.config
 * images.remotePatterns get the original URL back (no 400s).
 */
// Must be in Next's default deviceSizes, or /_next/image answers 400.
const WIDTHS = [640, 828, 1080, 1200, 1920, 2048]

const host = (u?: string) => (u || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "")
const ALLOWED = new Set(
  ["media.cardle.lk", process.env.NEXT_PUBLIC_MINIO_ENDPOINT, host(process.env.NEXT_PUBLIC_BASE_URL)].filter(Boolean) as string[]
)

export function optimizedSrcSet(url?: string | null, quality = 75): string | undefined {
  if (!url) return undefined
  const ok = url.startsWith("/") ? !url.startsWith("//") : ALLOWED.has(host(url))
  if (!ok) return url
  return WIDTHS.map((w) => `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=${quality} ${w}w`).join(", ")
}
