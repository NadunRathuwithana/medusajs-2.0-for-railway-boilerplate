"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function BackButton({
  className = "",
}: {
  className?: string
}) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return (
    <button
      onClick={handleBack}
      className={`flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer py-3 -my-3 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  )
}
