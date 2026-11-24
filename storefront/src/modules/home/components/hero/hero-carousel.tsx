"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { clx } from "@medusajs/ui"
import CtaLink from "@modules/cms/cta-link"
import { HERO_SIZE } from "@modules/cms/hero-size"

export type Slide = {
  mobile: string
  tablet: string
  desktop: string
  alt: string
  // Live text over the image: crisp, translatable and readable by screen readers.
  // Slide 1 already carries its headline in the artwork, so it only gets the button.
  eyebrow?: string
  title?: string
  // Text colour from the CMS (#RRGGBB); white when unset.
  color?: string
  cta?: string
  href?: string
}

// Slide 1 keeps the original per-breakpoint crops. Slides 2-3 reuse the two
// photos that used to live in the "CARDLE - ELEVATING THE EVERYDAY CARRY"
// grid — that section is shrinking to a compact strip at the end of the
// page and no longer needs its own large images, so these are free to
// become hero slides instead of sitting unused or duplicated.
export const DEFAULT_SLIDES: Slide[] = [
  {
    mobile: "/home/cardle-premium-cotton-tote-bag-sri-lanka-mobile.jpg",
    tablet: "/home/cardle-premium-cotton-tote-bag-sri-lanka-tablet.jpg",
    desktop: "/home/cardle-premium-cotton-tote-bag-sri-lanka.jpg",
    alt: "Cardle handcrafted cotton tote bags – shop Sri Lanka's premium make-to-order bags",
    cta: "Shop the collection",
    href: "/store",
  },
  {
    mobile: "/home/cardle-uncompromising-craftsmanship.jpg",
    tablet: "/home/cardle-uncompromising-craftsmanship.jpg",
    desktop: "/home/cardle-uncompromising-craftsmanship.jpg",
    alt: "Cardle uncompromising craftsmanship – zero-stretch canvas engineering",
    eyebrow: "Uncompromising craftsmanship",
    title: "Zero-stretch canvas, built to last",
    cta: "Shop totes",
    href: "/store",
  },
  {
    mobile: "/home/cardle-status-meets-utility-tote-bag.jpg",
    tablet: "/home/cardle-status-meets-utility-tote-bag.jpg",
    desktop: "/home/cardle-status-meets-utility-tote-bag.jpg",
    alt: "Cardle – where status meets utility, quiet luxury everyday carry",
    eyebrow: "Status meets utility",
    title: "Quiet luxury for everyday carry",
    cta: "Explore the range",
    href: "/store",
  },
]

const AUTOPLAY_MS = 5500
// Swipe must clear this many px horizontally, and stay mostly horizontal,
// before it's treated as a slide change rather than an incidental touch/scroll.
const SWIPE_THRESHOLD_PX = 50

const HeroCarousel = ({ slides: SLIDES = DEFAULT_SLIDES }: { slides?: Slide[] }) => {
  const [index, setIndex] = useState(0)
  // Paused only while a finger is on the slide (so a swipe isn't fought by autoplay).
  const [isPaused, setIsPaused] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const goTo = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    if (isPaused || SLIDES.length <= 1) return
    // Restarts on every slide change, so a manual arrow/swipe/dot gets a full
    // AUTOPLAY_MS before the next auto advance.
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length)
    }, AUTOPLAY_MS)
    return () => clearTimeout(timer)
  }, [isPaused, index])

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
      className={`group ${HERO_SIZE} bg-[#e5e5e5]`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={`${slide.desktop}-${i}`}
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

      {/* Live text and call to action for the active slide */}
      <div className="absolute inset-x-0 bottom-16 z-20 flex flex-col items-center px-6 text-center pointer-events-none">
        {SLIDES[index].eyebrow && (
          <span className="text-white/90 uppercase tracking-[0.3em] text-xs font-semibold mb-2 drop-shadow" style={SLIDES[index].color ? { color: SLIDES[index].color } : undefined}>
            {SLIDES[index].eyebrow}
          </span>
        )}
        {SLIDES[index].title && (
          <p className="text-white text-2xl md:text-4xl font-bold tracking-tight mb-4 max-w-2xl drop-shadow-lg" style={SLIDES[index].color ? { color: SLIDES[index].color } : undefined}>
            {SLIDES[index].title}
          </p>
        )}
        {SLIDES[index].cta && SLIDES[index].href && (
          <CtaLink
            href={SLIDES[index].href!}
            className="pointer-events-auto inline-flex items-center bg-white text-black px-7 py-3 rounded-full text-xs md:text-sm font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors"
          >
            {SLIDES[index].cta}
          </CtaLink>
        )}
      </div>

      {/* Prev / next arrows (tablet & desktop; mobile swipes) */}
      {SLIDES.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous slide"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/20 hover:bg-black/35 text-white items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-300"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next slide"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/20 hover:bg-black/35 text-white items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-300"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </>
      )}

      {/* Dot navigation */}
      {SLIDES.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={`${slide.desktop}-${i}`}
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

export default HeroCarousel
