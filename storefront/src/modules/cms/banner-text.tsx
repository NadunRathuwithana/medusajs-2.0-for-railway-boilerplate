import CtaLink from "./cta-link"

/**
 * The one text layout for every category/store banner: right half on
 * tablet+desktop, left-aligned inside it; full width on mobile.
 * Used by the built-in banner and by uploaded banners alike.
 */
export default function BannerText({
  eyebrow,
  title,
  ctaLabel,
  ctaHref,
  onImage = false,
  color,
}: {
  eyebrow?: string | null
  title?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
  onImage?: boolean
  color?: string | null
}) {
  const c = color || undefined
  const tone = onImage ? "text-white drop-shadow-lg" : "text-black"
  return (
    <div className="absolute inset-0 flex items-center">
      <div className="content-container max-w-[1440px] mx-auto w-full px-6 md:px-16 flex md:justify-end">
        <div className="w-full md:w-1/2 text-left">
          {eyebrow && <p className={`text-base md:text-xl font-medium ${onImage ? "text-white/90" : "text-gray-900"}`} style={c ? { color: c } : undefined}>{eyebrow}</p>}
          {title && <h2 className={`text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.02] mt-1 ${tone}`} style={c ? { color: c } : undefined}>{title}</h2>}
          {ctaLabel && ctaHref && (
            <CtaLink href={ctaHref} className="mt-6 inline-flex items-center bg-black text-white px-7 py-3 rounded-full text-xs md:text-sm font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors">
              {ctaLabel}
            </CtaLink>
          )}
        </div>
      </div>
    </div>
  )
}
