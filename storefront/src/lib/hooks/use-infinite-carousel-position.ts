"use client"

import { useState } from "react"

/**
 * Drives the track position for a looping (infinite) slide carousel where
 * `index` wraps around via modulo (see product-card/image-gallery). Plain
 * `translateX(-index/length %)` breaks at the wrap: going from the last
 * slide back to the first jumps the transform from a large negative value
 * to 0, which animates as a reverse slide instead of continuing forward.
 *
 * Fix: the caller renders one extra clone slide on each end of the real
 * list ([last, ...real, first]). At a wrap, this hook first animates onto
 * the matching clone (continuing in the same direction the user was
 * already moving), then — once that transition finishes — silently snaps
 * (no transition) to the real slide at the same visual position, which is
 * an identical image so the jump is imperceptible.
 *
 * `trackPosition` is adjusted synchronously during render — comparing
 * `index`/`length`/`resetKey` against a `prev` state snapshot, React's
 * documented pattern for "adjusting state when a prop changes" — rather
 * than in a `useEffect`. An effect commits one render late, which left a
 * stale in-between frame where the gesture's drag offset had already reset
 * to 0 but `trackPosition` hadn't caught up yet, producing a visible
 * snap-back-then-correct stutter right at the moment a swipe completed.
 */
export function useInfiniteCarouselPosition({
  index,
  length,
  resetKey,
}: {
  index: number
  length: number
  resetKey?: string | number
}) {
  const [trackPosition, setTrackPosition] = useState(() => (length > 1 ? index + 1 : 0))
  const [suppressTransition, setSuppressTransition] = useState(false)
  const [prev, setPrev] = useState({ index, length, resetKey })

  const changed = prev.index !== index || prev.length !== length || prev.resetKey !== resetKey

  if (length <= 1) {
    if (trackPosition !== 0) setTrackPosition(0)
    if (changed) setPrev({ index, length, resetKey })
  } else if (changed) {
    const variantChanged = prev.resetKey !== resetKey || prev.length !== length

    if (variantChanged) {
      // A new image set (e.g. switched variant/color) — jump straight there,
      // no wrap animation.
      setSuppressTransition(true)
      setTrackPosition(index + 1)
      requestAnimationFrame(() => setSuppressTransition(false))
    } else if (prev.index === length - 1 && index === 0) {
      setTrackPosition(length + 1) // animate onto the clone-after-last
    } else if (prev.index === 0 && index === length - 1) {
      setTrackPosition(0) // animate onto the clone-before-first
    } else {
      setTrackPosition(index + 1)
    }

    setPrev({ index, length, resetKey })
  }

  const handleTransitionEnd = (propertyName?: string) => {
    if (propertyName && propertyName !== "transform") return
    if (length > 1 && (trackPosition === 0 || trackPosition === length + 1)) {
      setSuppressTransition(true)
      setTrackPosition(index + 1)
      requestAnimationFrame(() => setSuppressTransition(false))
    }
  }

  return { trackPosition, suppressTransition, handleTransitionEnd }
}
