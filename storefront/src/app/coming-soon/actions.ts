"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function submitLogin(formData: FormData) {
  const username = formData.get("username")
  const password = formData.get("password")

  // Hardcoded credentials for the coming soon page
  if (username === "admin" && password === "cardle2026") {
    const cookieStore = await cookies()
    cookieStore.set("storefront_access", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })
    
    redirect("/")
  } else {
    return { error: "Invalid credentials. Please try again." }
  }
}
