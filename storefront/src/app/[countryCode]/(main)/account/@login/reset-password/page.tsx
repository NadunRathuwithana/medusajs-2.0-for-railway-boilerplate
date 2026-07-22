import { Metadata } from "next"
import ResetPassword from "@modules/account/components/reset-password"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your Cardle account password.",
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const token = resolvedSearchParams?.token as string
  const email = resolvedSearchParams?.email as string

  if (!token || !email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <h1 className="text-2xl font-bold mb-4">Invalid Reset Link</h1>
        <p className="text-gray-500">This password reset link is invalid or missing required parameters.</p>
        <a href="/account" className="mt-6 text-black underline font-medium">Return to login</a>
      </div>
    )
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Visual Brand Panel (Desktop only) */}
      <div className="hidden lg:flex relative flex-col justify-between p-16 bg-[#1a1a1a] text-white overflow-hidden select-none">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/cardle-cotton-tote-bags-login-cover.jpg"
            alt="Cardle Luxury Carry"
            fill
            className="object-cover opacity-70 transition-transform duration-[10000ms] ease-out"
            priority
          />
        </div>
      </div>

      {/* Forms Panel */}
      <div className="flex items-center justify-center p-8 sm:p-16 w-full bg-white z-10">
        <div className="w-full max-w-[420px] transition-all duration-300 animate-in fade-in duration-500">
          <ResetPassword token={token} email={email} />
        </div>
      </div>
    </div>
  )
}
