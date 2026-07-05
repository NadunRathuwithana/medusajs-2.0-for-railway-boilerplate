import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your Cardle account password.",
}

export default function ResetPasswordAuthenticatedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">You are already logged in</h1>
      <p className="text-gray-500 max-w-md mx-auto">
        You cannot reset your password while logged in. If you wish to reset your password, please log out first.
      </p>
      <a href="/account" className="mt-6 bg-black text-white px-8 py-3 rounded-full text-xs font-bold tracking-widest capitalize">
        Go to Dashboard
      </a>
    </div>
  )
}
