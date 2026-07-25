"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { clx } from "@medusajs/ui"
import { useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useGestureZoom } from "@lib/hooks/use-gesture-zoom"
import { useInfiniteCarouselPosition } from "@lib/hooks/use-infinite-carousel-position"

type ImageGalleryProps = {
  product: HttpTypes.StoreProduct
}

const ImageGallery = ({ product }: ImageGalleryProps) => {
  const searchParams = useSearchParams()
  const urlColor = searchParams?.get("color")

  const [optimisticColor, setOptimisticColor] = useState<string | null>(null)

  useEffect(() => {
    setOptimisticColor(urlColor)
  }, [urlColor])

  useEffect(() => {
    const handleVariantChange = (e: CustomEvent) => {
      setOptimisticColor(e.detail.color)
    }
    window.addEventListener("variantChange", handleVariantChange as EventListener)
    return () => window.removeEventListener("variantChange", handleVariantChange as EventListener)
  }, [])

  const selectedColor = optimisticColor || urlColor

  const activeVariant = selectedColor 
    ? product.variants?.find((v) => 
        v.options?.some((opt) => opt.value === selectedColor && opt.option?.title?.toLowerCase() === "color")
      )
    : product.variants?.[0]
    
  const initialImages = activeVariant?.images?.length ? activeVariant.images : (product.images || [])

  // Note: For consistency, the first image in every variant's image set should ideally 
  // use the same framing/background (studio shot, ¾ angle) so the gallery doesn't visually jump.
  
  // Sort images so that the one with metadata.view === "front" is first
  const images = [...initialImages].sort((a, b) => {
    const aView = (a as any).metadata?.view
    const bView = (b as any).metadata?.view
    if (aView === "front" && bView !== "front") return -1
    if (bView === "front" && aView !== "front") return 1
    return 0
  })

  const [activeIndex, setActiveIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenIndex, setFullscreenIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Custom left/right-arrow cursor + click-to-navigate on the main image (desktop only)
  const mainImageRef = useRef<HTMLDivElement>(null)
  const [isHoveringMain, setIsHoveringMain] = useState(false)
  const [hoverSide, setHoverSide] = useState<"left" | "right">("right")
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })

  // Mobile-only main image: swipe to change image (with a live drag-follow,
  // like a native carousel). Zoom lives in the fullscreen viewer instead of
  // inline here — a plain tap opens it — so inline zoom is disabled to avoid
  // a double-tap racing against that tap-to-open. No edge resistance — the
  // carousel loops (see `useInfiniteCarouselPosition` below), so there's no
  // "edge" to soften against.
  const mobileGesture = useGestureZoom({
    onSwipeLeft: () => goToNextImage(),
    onSwipeRight: () => goToPrevImage(),
    maxScale: 1,
    doubleTapScale: 1,
  })

  // Fullscreen viewer gestures: swipe to navigate, pinch/double-tap to zoom,
  // pan while zoomed. Arrow buttons stay desktop-only (see `lightbox` below).
  const lightboxGesture = useGestureZoom({
    onSwipeLeft: () => next(),
    onSwipeRight: () => prev(),
    maxScale: 4,
    doubleTapScale: 2.5,
  })

  // Loop both mobile tracks (inline + fullscreen) so swiping past the last
  // image continues forward into the first instead of snapping backwards.
  const mobileLoop = useInfiniteCarouselPosition({
    index: activeIndex,
    length: images.length,
    resetKey: activeVariant?.id,
  })
  const lightboxLoop = useInfiniteCarouselPosition({
    index: fullscreenIndex,
    length: images.length,
    resetKey: activeVariant?.id,
  })
  const loopImages = images.length > 1 ? [images[images.length - 1], ...images, images[0]] : images
  const firstRealLoopIdx = images.length > 1 ? 1 : 0

  // Thumbnail strip scroll controls
  const thumbStripRef = useRef<HTMLDivElement>(null)
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => { setMounted(true) }, [])

  // Reset active image index when the active variant changes
  useEffect(() => {
    setActiveIndex(0)
    setFullscreenIndex(0)
  }, [activeVariant?.id])

  // Zoom shouldn't carry over from one image to the next.
  useEffect(() => {
    mobileGesture.reset()
  }, [activeIndex])
  useEffect(() => {
    lightboxGesture.reset()
  }, [fullscreenIndex, isFullscreen])

  // Auto-slide the thumbnail strip so the active thumbnail is always in
  // view, since with many images the strip can be longer than its
  // container and older/later thumbnails become unreachable otherwise.
  useEffect(() => {
    thumbRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    })
  }, [activeIndex])

  const scrollThumbs = (direction: "left" | "right") => {
    thumbStripRef.current?.scrollBy({
      left: direction === "left" ? -220 : 220,
      behavior: "smooth",
    })
  }

  const handleMainMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = mainImageRef.current?.getBoundingClientRect()
    if (!rect) return
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setHoverSide(e.clientX - rect.left < rect.width / 2 ? "left" : "right")
  }

  const goToPrevImage = () => setActiveIndex((i) => (i - 1 + images.length) % images.length)
  const goToNextImage = () => setActiveIndex((i) => (i + 1) % images.length)

  const handleMainClick = () => {
    if (images.length <= 1) {
      openFullscreen(activeIndex)
      return
    }
    if (hoverSide === "left") {
      goToPrevImage()
    } else {
      goToNextImage()
    }
  }

  if (!images || images.length === 0) return null

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index)
    setIsFullscreen(true)
  }
  const closeFullscreen = () => setIsFullscreen(false)
  const prev = () => setFullscreenIndex((i) => (i - 1 + images.length) % images.length)
  const next = () => setFullscreenIndex((i) => (i + 1) % images.length)

  // Keyboard & scroll lock
  useEffect(() => {
    if (!isFullscreen) return
    document.body.style.overflow = "hidden"
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", handler)
    return () => {
      window.removeEventListener("keydown", handler)
      document.body.style.overflow = ""
    }
  }, [isFullscreen])

  const lightbox = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "customFadeIn 0.25s ease-out forwards",
      }}
      onClick={closeFullscreen}
    >
      <style>{`
        @keyframes customFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes imgEnter {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Close */}
      <button
        onClick={closeFullscreen}
        style={{ position: "fixed", top: 24, right: 24, zIndex: 100000 }}
        className="text-white bg-white/10 hover:bg-white/25 backdrop-blur-sm rounded-full p-3 transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Counter */}
      <div
        style={{ position: "fixed", top: 28, left: "50%", transform: "translateX(-50%)", zIndex: 100000 }}
        className="text-white/60 text-sm font-medium tracking-widest"
      >
        {fullscreenIndex + 1} / {images.length}
      </div>

      {/* Prev — desktop only; mobile navigates by swiping */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev() }}
          style={{ position: "fixed", left: 24, top: "50%", transform: "translateY(-50%)", zIndex: 100000 }}
          className="hidden lg:block text-white bg-white/10 hover:bg-white/25 backdrop-blur-sm rounded-full p-4 transition-colors"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Full-screen image — a sliding track so moving left/right animates
          like the rest of the gallery, not just a crossfade. */}
      <div
        ref={lightboxGesture.containerRef}
        style={{
          position: "fixed",
          inset: 0,
          paddingTop: 56,
          paddingBottom: images.length > 1 ? 120 : 40,
          overflow: "hidden",
          touchAction: lightboxGesture.touchAction,
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={lightboxGesture.handlers.onTouchStart}
        onTouchMove={lightboxGesture.handlers.onTouchMove}
        onTouchEnd={lightboxGesture.handlers.onTouchEnd}
      >
        <div
          className="flex h-full"
          onTransitionEnd={(e) => lightboxLoop.handleTransitionEnd(e.propertyName)}
          style={{
            width: `${loopImages.length * 100}%`,
            transform: `translateX(calc(-${lightboxLoop.trackPosition * (100 / loopImages.length)}% + ${lightboxGesture.dragX}px))`,
            transition:
              lightboxGesture.isGesturing || lightboxLoop.suppressTransition
                ? "none"
                : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {loopImages.map((image, idx) => {
            const isActive = idx === (images.length > 1 ? fullscreenIndex + 1 : 0)
            return (
              <div key={idx} className="relative h-full" style={{ width: `${100 / loopImages.length}%` }}>
                <Image
                  src={image.url}
                  alt={`${product.title} – view ${idx} of ${images.length} | Cardle`}
                  fill
                  sizes="100vw"
                  style={{
                    objectFit: "contain",
                    transform: isActive
                      ? `translate(${lightboxGesture.panX}px, ${lightboxGesture.panY}px) scale(${lightboxGesture.scale})`
                      : undefined,
                    transition: isActive && !lightboxGesture.isGesturing ? "transform 0.3s ease-out" : undefined,
                  }}
                  priority={idx === firstRealLoopIdx}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Next — desktop only; mobile navigates by swiping */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next() }}
          style={{ position: "fixed", right: 24, top: "50%", transform: "translateY(-50%)", zIndex: 100000 }}
          className="hidden lg:block text-white bg-white/10 hover:bg-white/25 backdrop-blur-sm rounded-full p-4 transition-colors"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 100000, display: "flex", gap: 10 }}
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={(e) => { e.stopPropagation(); setFullscreenIndex(index) }}
              className={clx(
                "relative flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden transition-all duration-200 border-2",
                {
                  "border-white scale-110 shadow-lg": index === fullscreenIndex,
                  "border-transparent opacity-50 hover:opacity-100": index !== fullscreenIndex,
                }
              )}
            >
              <Image src={image.url} alt={`${product.title} – thumbnail ${index + 1}`} title={`${product.title} – view ${index + 1}`} fill sizes="64px" style={{ objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes galleryEnter {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div key={activeVariant?.id || 'default'} className="flex flex-col gap-4 w-full" style={{ animation: "galleryEnter 0.4s ease-out forwards" }}>
        {/* Main Image — mobile: full-bleed swipe carousel. Tap opens the
            fullscreen viewer (pinch/double-tap zoom lives there instead, so
            it doesn't race against tap-to-open here). No arrow buttons. */}
        <div
          ref={mobileGesture.containerRef}
          className="lg:hidden relative -mx-6 w-[calc(100%+3rem)] md:-mx-16 md:w-[calc(100%+8rem)] aspect-[4/5] overflow-hidden bg-gray-100"
          style={{ touchAction: mobileGesture.touchAction }}
          onClick={() => openFullscreen(activeIndex)}
          onTouchStart={mobileGesture.handlers.onTouchStart}
          onTouchMove={mobileGesture.handlers.onTouchMove}
          onTouchEnd={mobileGesture.handlers.onTouchEnd}
        >
          <div
            className="flex h-full"
            onTransitionEnd={(e) => mobileLoop.handleTransitionEnd(e.propertyName)}
            style={{
              width: `${loopImages.length * 100}%`,
              transform: `translateX(calc(-${mobileLoop.trackPosition * (100 / loopImages.length)}% + ${mobileGesture.dragX}px))`,
              transition:
                mobileGesture.isGesturing || mobileLoop.suppressTransition
                  ? "none"
                  : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {loopImages.map((image, idx) => (
              <div key={idx} className="relative h-full" style={{ width: `${100 / loopImages.length}%` }}>
                <Image
                  src={image.url}
                  priority={idx === firstRealLoopIdx}
                  alt={`${product.title} – image ${idx} | Cardle`}
                  fill
                  sizes="100vw"
                  style={{ objectFit: "cover" }}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Main Image — desktop: hover cursor nav + fullscreen viewer */}
        <div
          ref={mainImageRef}
          className="hidden lg:block relative w-full aspect-[4/5] md:aspect-auto md:h-[600px] lg:h-[700px] rounded-3xl overflow-hidden bg-gray-100 group"
          style={{ cursor: images.length > 1 && isHoveringMain ? "none" : "zoom-in" }}
          onMouseEnter={() => setIsHoveringMain(true)}
          onMouseLeave={() => setIsHoveringMain(false)}
          onMouseMove={handleMainMouseMove}
          onClick={handleMainClick}
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              className={clx(
                "absolute inset-0 transition-opacity duration-500 ease-in-out",
                {
                  "opacity-100 z-10": index === activeIndex,
                  "opacity-0 z-0": index !== activeIndex,
                }
              )}
            >
              <Image
                src={image.url}
                priority={index === 0}
                alt={`${product.title} – image ${index + 1} | Cardle`}
                fill
                sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                style={{ objectFit: "cover", transition: "transform 0.4s ease" }}
                className="group-hover:scale-[1.02]"
              />
            </div>
          ))}

          {/* Expand-to-fullscreen — its own click target, top corner, since
              clicking the image itself now navigates prev/next instead */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              openFullscreen(activeIndex)
            }}
            aria-label="View fullscreen"
            className="absolute top-4 right-4 z-20 bg-black/40 backdrop-blur-sm text-white rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>

          {/* Custom directional cursor — left half hovers show a left arrow,
              right half a right arrow, replacing the native cursor */}
          {images.length > 1 && isHoveringMain && (
            <div
              className="pointer-events-none absolute z-20 w-12 h-12 -ml-6 -mt-6 rounded-full bg-white shadow-lg flex items-center justify-center"
              style={{ left: cursorPos.x, top: cursorPos.y }}
            >
              {hoverSide === "left" ? (
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-700" />
              )}
            </div>
          )}
        </div>

        {/* Thumbnail strip — outside the main image. Mobile: full-bleed like
            the main image above; desktop: contained within the column. */}
        {images.length > 1 && (
          <div className="relative group/thumbs -mx-6 w-[calc(100%+3rem)] md:-mx-16 md:w-[calc(100%+8rem)] lg:mx-0 lg:w-full">
            {images.length > 4 && (
              <>
                <button
                  onClick={() => scrollThumbs("left")}
                  aria-label="Scroll thumbnails left"
                  className="hidden lg:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-md border border-gray-100 rounded-full items-center justify-center opacity-0 group-hover/thumbs:opacity-100 transition-opacity hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => scrollThumbs("right")}
                  aria-label="Scroll thumbnails right"
                  className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-md border border-gray-100 rounded-full items-center justify-center opacity-0 group-hover/thumbs:opacity-100 transition-opacity hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </>
            )}
            <div
              ref={thumbStripRef}
              className="flex gap-3 overflow-x-auto pb-1 scroll-smooth px-6 md:px-16 lg:px-0"
              style={{ scrollbarWidth: "none" }}
            >
              {images.map((image, index) => (
                <button
                  key={image.id}
                  ref={(el) => { thumbRefs.current[index] = el }}
                  onClick={() => setActiveIndex(index)}
                  className={clx(
                    "relative flex-shrink-0 w-20 h-24 md:w-24 md:h-28 rounded-2xl overflow-hidden transition-all duration-200 border-2",
                    {
                      "border-black/60 shadow-md": index === activeIndex,
                      "border-transparent opacity-60": index !== activeIndex,
                    }
                  )}
                >
                  <Image src={image.url} alt={`${product.title} – thumbnail ${index + 1}`} title={`${product.title} – view ${index + 1}`} fill sizes="96px" style={{ objectFit: "cover" }} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Portal: renders directly into document.body — true full-screen */}
      {mounted && isFullscreen && createPortal(lightbox, document.body)}
    </>
  )
}

export default ImageGallery
