"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

type Slide =
  | { type: "responsive"; alt: string }
  | {
      type: "single"
      src: string
      alt: string
      eyebrow: string
      title: string
      href: string
      cta: string
    }

// Slide 1 is the original responsive hero art. Swap `src` on the other slides
// for real campaign banners whenever they are ready.
const SLIDES: Slide[] = [
  {
    type: "responsive",
    alt: "Cardle handcrafted cotton tote bags – shop Sri Lanka's premium make-to-order bags",
  },
  {
    type: "single",
    src: "/home/cardle-status-meets-utility-tote-bag.jpg",
    alt: "Close-up of a Cardle cotton canvas tote bag handle stitching",
    eyebrow: "Status meets utility",
    title: "Built to carry everything",
    href: "/store",
    cta: "Shop totes",
  },
  {
    type: "single",
    src: "/home/cardle-uncompromising-craftsmanship.jpg",
    alt: "Close-up of heavyweight Cardle cotton canvas fabric",
    eyebrow: "Uncompromising craftsmanship",
    title: "Handmade in Sri Lanka",
    href: "/store",
    cta: "Explore the collection",
  },
]

const INTERVAL_MS = 5500

const Hero = () => {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const go = useCallback(
    (next: number) => setIndex((next + SLIDES.length) % SLIDES.length),
    []
  )

  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => go(index + 1), INTERVAL_MS)
    return () => clearTimeout(t)
  }, [index, paused, go])

  const slide = SLIDES[index]

  return (
    <div
      className="h-[62vh] min-h-[380px] max-h-[640px] w-full relative overflow-hidden bg-[#e5e5e5]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
        touchStartX.current = null
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured"
    >
      {/* Single h1 for the page (kept visually hidden, hero art carries the message) */}
      <h1 className="sr-only">Cardle – Premium Cotton Tote Bags, Handcrafted in Sri Lanka</h1>

      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          aria-live={paused ? "polite" : "off"}
        >
          {slide.type === "responsive" ? (
            <>
              <Image
                src="/home/cardle-premium-cotton-tote-bag-sri-lanka-mobile.jpg"
                alt={slide.alt}
                fill
                sizes="100vw"
                className="block md:hidden object-cover object-top"
                priority
              />
              <Image
                src="/home/cardle-premium-cotton-tote-bag-sri-lanka-tablet.jpg"
                alt={slide.alt}
                fill
                sizes="100vw"
                className="hidden md:block lg:hidden object-cover object-top"
                priority
              />
              <Image
                src="/home/cardle-premium-cotton-tote-bag-sri-lanka.jpg"
                alt={slide.alt}
                fill
                sizes="100vw"
                className="hidden lg:block object-cover object-top"
                priority
              />
            </>
          ) : (
            <>
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="100vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <span className="text-white/80 uppercase tracking-[0.3em] text-xs md:text-sm font-semibold mb-3">
                  {slide.eyebrow}
                </span>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tighter text-white mb-6 max-w-3xl leading-[1.1]">
                  {slide.title}
                </h2>
                <LocalizedClientLink
                  href={slide.href}
                  className="inline-flex items-center bg-white text-black px-8 py-3 rounded-full text-xs md:text-sm font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors"
                >
                  {slide.cta}
                </LocalizedClientLink>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Arrows (hidden on small screens, swipe works there) */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => go(index - 1)}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/80 hover:bg-white text-black transition-colors"
      >
        <span aria-hidden>‹</span>
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => go(index + 1)}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/80 hover:bg-white text-black transition-colors"
      >
        <span aria-hidden>›</span>
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            onClick={() => go(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default Hero
