"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { clx } from "@medusajs/ui"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenIndex, setFullscreenIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const handleUpdateImage = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      const imageUrl = customEvent.detail
      if (!imageUrl) return
      
      const index = images.findIndex((img) => img.url === imageUrl)
      if (index !== -1 && index !== activeIndex) {
        setActiveIndex(index)
      }
    }

    window.addEventListener("updateImage", handleUpdateImage)
    return () => {
      window.removeEventListener("updateImage", handleUpdateImage)
    }
  }, [images, activeIndex])

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

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev() }}
          style={{ position: "fixed", left: 24, top: "50%", transform: "translateY(-50%)", zIndex: 100000 }}
          className="text-white bg-white/10 hover:bg-white/25 backdrop-blur-sm rounded-full p-4 transition-colors"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Full-screen image */}
      <div
        style={{ position: "fixed", inset: 0, paddingTop: 56, paddingBottom: images.length > 1 ? 120 : 40 }}
        onClick={(e) => e.stopPropagation()}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            style={{
              position: "absolute",
              inset: 0,
              opacity: index === fullscreenIndex ? 1 : 0,
              visibility: index === fullscreenIndex ? "visible" : "hidden",
              transition: "opacity 0.4s ease-in-out, visibility 0.4s ease-in-out",
              zIndex: index === fullscreenIndex ? 10 : 0,
            }}
          >
            <Image
              src={image.url}
              alt={`Product image ${index + 1}`}
              fill
              sizes="100vw"
              style={{ objectFit: "contain", transform: index === fullscreenIndex ? "scale(1)" : "scale(0.97)", transition: "transform 0.4s ease-out" }}
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next() }}
          style={{ position: "fixed", right: 24, top: "50%", transform: "translateY(-50%)", zIndex: 100000 }}
          className="text-white bg-white/10 hover:bg-white/25 backdrop-blur-sm rounded-full p-4 transition-colors"
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
              <Image src={image.url} alt={`Thumb ${index + 1}`} fill sizes="64px" style={{ objectFit: "cover" }} />
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

      <div className="flex flex-col gap-4 w-full" style={{ animation: "galleryEnter 0.4s ease-out forwards" }}>
        {/* Main Image */}
        <div
          className="relative w-full aspect-[4/5] md:aspect-auto md:h-[600px] lg:h-[700px] rounded-3xl overflow-hidden bg-gray-100 cursor-zoom-in group"
          onClick={() => openFullscreen(activeIndex)}
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
                alt={`Product image ${index + 1}`}
                fill
                sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                style={{ objectFit: "cover", transition: "transform 0.4s ease" }}
                className="group-hover:scale-[1.02]"
              />
            </div>
          ))}

          {/* Fullscreen hint overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
            <div className="bg-black/40 backdrop-blur-sm text-white rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </div>
          </div>


        </div>

        {/* Thumbnail strip — outside the main image */}
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setActiveIndex(index)}
                className={clx(
                  "relative flex-shrink-0 w-20 h-24 md:w-24 md:h-28 rounded-2xl overflow-hidden transition-all duration-200 border-2",
                  {
                    "border-black/60 shadow-md": index === activeIndex,
                    "border-transparent opacity-60": index !== activeIndex,
                  }
                )}
              >
                <Image src={image.url} alt={`Thumbnail ${index + 1}`} fill sizes="96px" style={{ objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Portal: renders directly into document.body — true full-screen */}
      {mounted && isFullscreen && createPortal(lightbox, document.body)}
    </>
  )
}

export default ImageGallery
