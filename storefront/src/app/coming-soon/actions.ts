"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { accessToken } from "@lib/util/access-token"

export async function submitLogin(formData: FormData) {
  const username = String(formData.get("username") || "")
  const password = String(formData.get("password") || "")
  const wantUser = process.env.COMING_SOON_USERNAME || "admin"
  const wantPass = process.env.COMING_SOON_PASSWORD

  if (wantPass && username === wantUser && password === wantPass) {
    const cookieStore = await cookies()
    cookieStore.set("storefront_access", await accessToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    redirect("/")
  } else {
    return { error: "Invalid credentials. Please try again." }
  }
}
