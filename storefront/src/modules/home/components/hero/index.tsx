"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { clx } from "@medusajs/ui"

type Slide = {
  mobile: string
  tablet: string
  desktop: string
  alt: string
}

// Slide 1 keeps the original per-breakpoint crops. Slides 2-3 reuse the two
// photos that used to live in the "CARDLE - ELEVATING THE EVERYDAY CARRY"
// grid — that section is shrinking to a compact strip at the end of the
// page and no longer needs its own large images, so these are free to
// become hero slides instead of sitting unused or duplicated.
const SLIDES: Slide[] = [
  {
    mobile: "/home/cardle-premium-cotton-tote-bag-sri-lanka-mobile.jpg",
    tablet: "/home/cardle-premium-cotton-tote-bag-sri-lanka-tablet.jpg",
    desktop: "/home/cardle-premium-cotton-tote-bag-sri-lanka.jpg",
    alt: "Cardle handcrafted cotton tote bags – shop Sri Lanka's premium make-to-order bags",
  },
  {
    mobile: "/home/cardle-uncompromising-craftsmanship.jpg",
    tablet: "/home/cardle-uncompromising-craftsmanship.jpg",
    desktop: "/home/cardle-uncompromising-craftsmanship.jpg",
    alt: "Cardle uncompromising craftsmanship – zero-stretch canvas engineering",
  },
  {
    mobile: "/home/cardle-status-meets-utility-tote-bag.jpg",
    tablet: "/home/cardle-status-meets-utility-tote-bag.jpg",
    desktop: "/home/cardle-status-meets-utility-tote-bag.jpg",
    alt: "Cardle – where status meets utility, quiet luxury everyday carry",
  },
]

const AUTOPLAY_MS = 5500
// Swipe must clear this many px horizontally, and stay mostly horizontal,
// before it's treated as a slide change rather than an incidental touch/scroll.
const SWIPE_THRESHOLD_PX = 50

const Hero = () => {
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const goTo = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    if (isPaused || SLIDES.length <= 1) return
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length)
    }, AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [isPaused])

  const onTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true)
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false)
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null

    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) {
      return // too small, or more vertical (a scroll) than horizontal
    }
    goTo(index + (dx < 0 ? 1 : -1))
  }

  return (
    <div
      className="h-[90vh] w-full relative overflow-hidden bg-[#e5e5e5]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.desktop}
          aria-hidden={i !== index}
          className={clx(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
            i === index ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <Image
            src={slide.mobile}
            alt={slide.alt}
            fill
            sizes="100vw"
            className="block md:hidden object-cover object-top"
            priority={i === 0}
          />
          <Image
            src={slide.tablet}
            alt={slide.alt}
            fill
            sizes="100vw"
            className="hidden md:block lg:hidden object-cover object-top"
            priority={i === 0}
          />
          <Image
            src={slide.desktop}
            alt={slide.alt}
            fill
            sizes="100vw"
            className="hidden lg:block object-cover object-top"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Dot navigation */}
      {SLIDES.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.desktop}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={clx(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75"
              )}
            />
          ))}
        </div>
      )}

      {/* The homepage had no <h1> at all — every heading jumped straight to
          H2 ("Popular Right Now", etc). Visually hidden since the hero
          image already carries the visual message; this exists purely so
          the page has exactly one, meaningful top-level heading. */}
      <h1 className="sr-only">Cardle – Premium Cotton Tote Bags, Handcrafted in Sri Lanka</h1>
    </div>
  )
}

export default Hero
