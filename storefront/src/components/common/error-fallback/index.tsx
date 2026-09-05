"use client"

import { useEffect } from "react"

type ErrorFallbackProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Shared App Router error.tsx UI. Previously several routes (home, product
 * pages) had no error boundary at all — a slow/failing backend request
 * either rendered a silent blank page or fell through to Next's bare default
 * error screen. This gives visitors an actual retry path instead.
 */
export default function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  useEffect(() => {
    console.error("[ErrorFallback]", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center text-center py-32 px-6 min-h-[50vh]">
      <h2 className="text-2xl font-bold text-bold mb-3">
        Something went wrong
      </h2>
      <p className="text-gray-500 mb-8 max-w-md">
        We couldn&apos;t load this page. This is usually temporary — please
        try again.
      </p>
      <button
        onClick={reset}
        className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
