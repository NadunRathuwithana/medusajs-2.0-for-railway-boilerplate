import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

const ALLOWED = new Set(["cms", "products", "addons", "packing", "collections", "categories"])

/**
 * POST /api/revalidate  { tags: ["cms"] }  header x-revalidate-secret
 * Lets the backend refresh cached pages right after an admin change.
 * Off unless REVALIDATE_SECRET is set.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const tags: string[] = (Array.isArray(body?.tags) ? body.tags : []).map(String).filter((t: string) => ALLOWED.has(t))
  tags.forEach((t) => revalidateTag(t))
  return NextResponse.json({ ok: true, tags })
}
