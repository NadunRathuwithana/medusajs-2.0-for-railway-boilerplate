import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "404 – Page Not Found",
  description: "The page you're looking for doesn't exist.",
}

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 py-24 bg-white overflow-hidden relative">
      {/* Giant 404 background text */}
      <p className="absolute inset-0 flex items-center justify-center text-[20rem] font-black leading-none tracking-tighter text-gray-100 select-none pointer-events-none overflow-hidden">
        404
      </p>

      {/* Foreground content */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Tote bag icon */}
        <div className="w-20 h-20 rounded-2xl bg-[#111111] flex items-center justify-center shadow-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10 text-white"
          >
            <path d="M6 2 L4 22 L20 22 L18 2 Z" />
            <path d="M9 2 C9 0 15 0 15 2" />
            <line x1="12" y1="9" x2="12" y2="16" />
            <line x1="8.5" y1="12.5" x2="15.5" y2="12.5" />
          </svg>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Page not found
          </h1>
          <p className="text-gray-500 text-base md:text-lg max-w-sm leading-relaxed">
            Looks like this bag got lost in transit. The page you&apos;re looking
            for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <LocalizedClientLink
            href="/"
            className="inline-flex items-center justify-center bg-[#111111] text-white text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-full hover:bg-gray-800 transition-colors duration-200"
          >
            Back to home
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/store"
            className="inline-flex items-center justify-center border border-gray-200 text-gray-700 text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-full hover:bg-gray-50 transition-colors duration-200"
          >
            Shop all bags
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
