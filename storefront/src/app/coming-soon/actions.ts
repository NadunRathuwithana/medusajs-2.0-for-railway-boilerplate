"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { isRateLimited } from "@lib/util/rate-limit"

export async function submitLogin(formData: FormData) {
  const headersList = await headers()
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
    headersList.get("x-real-ip") ||
    "unknown"

  if (isRateLimited(`coming-soon-login:${ip}`, { windowMs: 15 * 60 * 1000, max: 5 })) {
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
