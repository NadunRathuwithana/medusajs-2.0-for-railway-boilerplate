"use client"

// Cross-mount (but tab-scoped) event dedup — protects against a page
// refresh/revisit re-mounting a tracker component and re-firing an event that
// a React ref alone can't guard against, since the ref resets on every fresh
// mount. Namespaced per event type so e.g. a purchase and a checkout tracker
// don't collide.
export function wasEventTracked(namespace: string, key: string): boolean {
  try {
    const raw = sessionStorage.getItem(`cardle_tracked_${namespace}`)
    const tracked: string[] = raw ? JSON.parse(raw) : []
    return tracked.includes(key)
  } catch {
    return false
  }
}

export function markEventTracked(namespace: string, key: string) {
  try {
    const storageKey = `cardle_tracked_${namespace}`
    const raw = sessionStorage.getItem(storageKey)
    const tracked: string[] = raw ? JSON.parse(raw) : []
    if (!tracked.includes(key)) {
      tracked.push(key)
      sessionStorage.setItem(storageKey, JSON.stringify(tracked))
    }
  } catch {
    // sessionStorage unavailable (private mode, etc.) — caller's in-mount
    // ref guard is still in effect for this render.
  }
}
