"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

// In-memory sliding-window limiter. This gate is a single low-traffic splash
// page on one storefront instance — if the storefront ever scales to multiple
// instances, this needs to move to a shared store (e.g. Redis) like the
// backend's rate limiting does.
const attempts = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  attempts.set(ip, recent)

  // Bound memory growth from distinct IPs hammering the endpoint.
  if (attempts.size > 10000) {
    attempts.clear()
  }

  return recent.length > MAX_ATTEMPTS
}

export async function submitLogin(formData: FormData) {
  const headersList = await headers()
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
    headersList.get("x-real-ip") ||
    "unknown"

  if (isRateLimited(ip)) {
    return { error: "Too many attempts. Please try again later." }
  }

  const username = formData.get("username")
  const password = formData.get("password")

  const expectedUsername = process.env.COMING_SOON_USERNAME
  const expectedPassword = process.env.COMING_SOON_PASSWORD

  if (!expectedUsername || !expectedPassword) {
    // Fail closed — never fall back to a hardcoded default.
    return { error: "Access is not configured. Contact the site administrator." }
  }

  if (username === expectedUsername && password === expectedPassword) {
    const cookieStore = await cookies()
    cookieStore.set("storefront_access", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    redirect("/")
  } else {
    return { error: "Invalid credentials. Please try again." }
  }
}
