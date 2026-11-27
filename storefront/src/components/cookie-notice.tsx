"use client"

import { useEffect, useState } from "react"

const KEY = "cardle_cookie_notice"

/** Plain notice (PDPA): tells visitors about analytics cookies, links the privacy policy. */
export default function CookieNotice() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    try {
      setShow(localStorage.getItem(KEY) !== "1")
    } catch {}
  }, [])
  if (!show) return null
  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-[90] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
    >
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm text-gray-700">
        <p className="flex-1">
          We use cookies, the Meta Pixel and Google Analytics to measure our ads and improve the site.{" "}
          <a href="/lk/privacy" className="underline">Privacy policy</a>
        </p>
        <button
          onClick={() => {
            try { localStorage.setItem(KEY, "1") } catch {}
            setShow(false)
          }}
          className="h-11 px-5 rounded-full bg-black text-white text-sm font-medium"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
