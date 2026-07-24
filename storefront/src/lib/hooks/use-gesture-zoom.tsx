"use client"

import { useCallback, useRef, useState } from "react"

type UseGestureZoomOptions = {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  /** Max pinch/double-tap zoom scale. Set to 1 to disable zooming entirely (swipe-only). */
  maxScale?: number
  doubleTapScale?: number
  /** Applies drag resistance instead of a 1:1 follow past this edge (e.g. first/last slide). */
  isAtStart?: boolean
  isAtEnd?: boolean
}

type ZoomState = {
  scale: number
  panX: number
  panY: number
}

const EDGE_RESISTANCE = 0.35

const getDistance = (touches: React.TouchList) => {
  const a = touches[0]
  const b = touches[1]
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

/**
 * Touch-gesture hook for image viewers/carousels: horizontal swipe (with a
 * live drag-follow offset, like a native carousel) to navigate, pinch-to-zoom,
 * double-tap-to-zoom, and pan while zoomed in. A gesture only takes over
 * (preventDefault) once real movement/a second touch/a double-tap is
 * detected, so a plain tap still falls through as a normal click.
 */
export function useGestureZoom({
  onSwipeLeft,
  onSwipeRight,
  maxScale = 4,
  doubleTapScale = 2.5,
  isAtStart = false,
  isAtEnd = false,
}: UseGestureZoomOptions = {}) {
  const [zoom, setZoom] = useState<ZoomState>({ scale: 1, panX: 0, panY: 0 })
  const [dragX, setDragX] = useState(0)
  const [isGesturing, setIsGesturing] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Latest edge flags in a ref so the touch handlers (memoized once via
  // useCallback below) always see the current slide position without
  // needing to be re-created every render.
  const edges = useRef({ isAtStart, isAtEnd })
  edges.current = { isAtStart, isAtEnd }

  const touch = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    axis: null as "x" | "y" | null,
    isPinching: false,
    pinchStartDist: 0,
    pinchStartScale: 1,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
  })

  const clampPan = useCallback((x: number, y: number, scale: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x, y }
    const maxX = (rect.width * (scale - 1)) / 2
    const maxY = (rect.height * (scale - 1)) / 2
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    }
  }, [])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const t = touch.current
      if (e.touches.length === 2) {
        t.isPinching = true
        t.pinchStartDist = getDistance(e.touches)
        t.pinchStartScale = zoom.scale
      } else if (e.touches.length === 1) {
        t.startX = e.touches[0].clientX
        t.startY = e.touches[0].clientY
        t.startTime = Date.now()
        t.axis = null
        if (zoom.scale > 1) {
          t.isPanning = true
          t.panStartX = zoom.panX
          t.panStartY = zoom.panY
        }
      }
    },
    [zoom.scale, zoom.panX, zoom.panY]
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const t = touch.current

      if (t.isPinching && e.touches.length === 2) {
        e.preventDefault()
        setIsGesturing(true)
        const dist = getDistance(e.touches)
        const newScale = Math.min(
          maxScale,
          Math.max(1, t.pinchStartScale * (dist / t.pinchStartDist))
        )
        setZoom((s) => {
          const { x, y } = clampPan(s.panX, s.panY, newScale)
          return { scale: newScale, panX: x, panY: y }
        })
        return
      }

      if (e.touches.length !== 1) return

      const dx = e.touches[0].clientX - t.startX
      const dy = e.touches[0].clientY - t.startY

      if (t.axis === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        t.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y"
      }

      if (t.isPanning) {
        e.preventDefault()
        setIsGesturing(true)
        const { x, y } = clampPan(t.panStartX + dx, t.panStartY + dy, zoom.scale)
        setZoom((s) => ({ ...s, panX: x, panY: y }))
        return
      }

      if (t.axis === "x" && zoom.scale === 1) {
        e.preventDefault()
        setIsGesturing(true)
        const pastStart = dx > 0 && edges.current.isAtStart
        const pastEnd = dx < 0 && edges.current.isAtEnd
        setDragX(pastStart || pastEnd ? dx * EDGE_RESISTANCE : dx)
      }
    },
    [maxScale, zoom.scale, clampPan]
  )

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const t = touch.current

      if (t.isPinching) {
        t.isPinching = false
        if (e.touches.length === 0) {
          setIsGesturing(false)
          setZoom((s) => (s.scale <= 1.05 ? { scale: 1, panX: 0, panY: 0 } : s))
        }
        return
      }

      if (t.isPanning) {
        t.isPanning = false
        setIsGesturing(false)
        return
      }

      const changed = e.changedTouches[0]
      if (!changed) return
      const dx = changed.clientX - t.startX
      const dy = changed.clientY - t.startY
      const dt = Date.now() - t.startTime

      if (t.axis === "x" && zoom.scale === 1) {
        setIsGesturing(false)
        setDragX(0)
        if (Math.abs(dx) > 40 && dt < 600) {
          e.preventDefault()
          if (dx < 0) onSwipeLeft?.()
          else onSwipeRight?.()
        }
        return
      }

      if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 250) {
        const now = Date.now()
        const closeToLastTap =
          Math.hypot(changed.clientX - t.lastTapX, changed.clientY - t.lastTapY) < 30
        if (now - t.lastTapTime < 300 && closeToLastTap) {
          e.preventDefault()
          t.lastTapTime = 0
          setZoom((s) => (s.scale > 1 ? { scale: 1, panX: 0, panY: 0 } : { scale: doubleTapScale, panX: 0, panY: 0 }))
          return
        }
        t.lastTapTime = now
        t.lastTapX = changed.clientX
        t.lastTapY = changed.clientY
      }
    },
    [zoom.scale, onSwipeLeft, onSwipeRight, doubleTapScale]
  )

  const reset = useCallback(() => {
    setZoom({ scale: 1, panX: 0, panY: 0 })
    setDragX(0)
    setIsGesturing(false)
  }, [])

  return {
    containerRef,
    scale: zoom.scale,
    panX: zoom.panX,
    panY: zoom.panY,
    isZoomed: zoom.scale > 1,
    dragX,
    isGesturing,
    touchAction: maxScale > 1 ? ("none" as const) : ("pan-y" as const),
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    reset,
  }
}
