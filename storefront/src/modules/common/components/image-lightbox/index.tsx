"use client"

import { useEffect, useRef, useState } from "react"
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
  const boxRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setMounted(true)
    const opener = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose()
      if (e.key !== "Tab" || !boxRef.current) return
      // Keep Tab inside the viewer.
      const f = boxRef.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener("keydown", onKey)
    // iOS needs the body pinned, overflow:hidden alone still scrolls.
    const y = window.scrollY
    const prev = { overflow: document.body.style.overflow, position: document.body.style.position, top: document.body.style.top, width: document.body.style.width }
    Object.assign(document.body.style, { overflow: "hidden", position: "fixed", top: `-${y}px`, width: "100%" })
    setTimeout(() => boxRef.current?.querySelector<HTMLElement>("button")?.focus(), 0)
    return () => {
      document.removeEventListener("keydown", onKey)
      Object.assign(document.body.style, prev)
      window.scrollTo(0, y)
      opener?.focus?.()
    }
  }, [onClose])
  if (!mounted) return null
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in-top">
      <div ref={boxRef} onClick={(e) => e.stopPropagation()}
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
