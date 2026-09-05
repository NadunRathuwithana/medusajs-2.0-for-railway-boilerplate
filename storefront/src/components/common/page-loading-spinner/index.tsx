/**
 * Generic App Router loading.tsx fallback for routes that didn't have one —
 * the homepage and product pages previously showed nothing at all while
 * their server-side data fetch was in flight (or, on a slow/failing
 * backend, indefinitely), which is exactly what produced the "blank page,
 * no visible error" symptom under load.
 */
export default function PageLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] py-32">
      <div
        className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}
