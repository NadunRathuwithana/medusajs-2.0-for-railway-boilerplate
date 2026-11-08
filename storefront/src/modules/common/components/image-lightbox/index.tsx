"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

/**
 * A thumbnail that opens a larger view of the same image.
 * Esc, the close button or a click outside closes it.
 */
/**
 * Full-screen image viewer. Rendered into <body> through a portal so a
 * transformed / sticky parent (like the product column) can't trap it.
 */
export function Lightbox({
  src, alt, onClose, caption, footer,
}: {
  src: string
  alt: string
  onClose: () => void
  caption?: React.ReactNode
  footer?: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])
  if (!mounted) return null
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in-top">
      <div onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Close"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg text-gray-800 shadow hover:bg-white">✕</button>
        <div className="aspect-square w-full bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="h-full w-full object-contain" />
        </div>
        {(caption || footer) && (
          <div className="flex flex-col gap-y-3 p-4">
            {caption}
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default function ZoomableImage({
  src,
  alt,
  className = "h-16 w-16",
}: {
  src: string
  alt: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`View ${alt} larger`}
        className={`${className} relative shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-black`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      </button>
      {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)}
        caption={<p className="text-sm font-medium text-gray-900">{alt}</p>} />}
    </>
  )
}
