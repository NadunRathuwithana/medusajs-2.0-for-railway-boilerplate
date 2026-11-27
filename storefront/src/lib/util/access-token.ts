/**
 * Value of the coming-soon / maintenance access cookie: an HMAC of a server
 * secret, so it can't be forged by setting the cookie by hand. Works in the
 * Edge middleware (Web Crypto).
 */
export async function accessToken(): Promise<string> {
  const secret = process.env.COMING_SOON_SECRET || process.env.COMING_SOON_PASSWORD || ""
  if (!secret) return "disabled"
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("storefront_access"))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("")
}
