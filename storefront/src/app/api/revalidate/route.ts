import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { isRateLimited } from "@lib/util/rate-limit"

const VALID_TAGS = new Set([
  "products",
  "collections",
  "categories",
  "regions",
])

/**
 * On-demand revalidation endpoint, called by the Medusa backend whenever
 * product/collection/category data changes (see backend/src/subscribers
 * /storefront-revalidate.ts). Replaces relying solely on the infinite
 * fetch-cache lifetime + manual revalidateTag calls that only covered the
 * storefront's own cart/customer mutations — admin-side edits previously had
 * no trigger to invalidate the Next.js cache at all.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"

  // Guards against brute-forcing the secret; legitimate callers (the backend
  // subscriber) fire at most a handful of times per minute even during a
  // bulk product import.
  if (isRateLimited(`revalidate:${ip}`, { windowMs: 60_000, max: 30 })) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 })
  }

  const secret = request.headers.get("x-revalidate-secret")

  if (!process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { message: "Revalidation is not configured (REVALIDATE_SECRET unset)" },
      { status: 503 }
    )
  }

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
  }

  let body: { tags?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 })
  }

  const tags = Array.isArray(body.tags) ? body.tags : []
  const validTags = tags.filter(
    (tag): tag is string => typeof tag === "string" && VALID_TAGS.has(tag)
  )

  if (validTags.length === 0) {
    return NextResponse.json(
      { message: `No valid tags provided. Valid tags: ${[...VALID_TAGS].join(", ")}` },
      { status: 400 }
    )
  }

  for (const tag of validTags) {
    revalidateTag(tag)
  }

  return NextResponse.json({ revalidated: validTags, now: Date.now() })
}
