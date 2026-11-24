import { getCms } from "@lib/data/cms"
import CtaLink from "./cta-link"
import BannerText from "./banner-text"
import { HERO_SIZE, HERO_IMG } from "./hero-size"

/**
 * Top banner of a page. Uses the first active CMS banner for `pageKey`;
 * otherwise renders `fallback` (the page's original built-in banner).
 */
export default async function PageBanner({
  pageKey,
  fallback,
}: {
  pageKey: "store" | "collection" | "about" | `category:${string}`
  fallback: React.ReactNode
}) {
  const { banners } = await getCms()
  const b = banners.find((x) => x.placement === "page" && x.page_key === pageKey && x.image_desktop)
  if (!b) return <>{fallback}</>

  const alt = b.alt || b.title || "Cardle"
  const isCategory = pageKey === "store" || pageKey.startsWith("category:")
  if (isCategory) {
    // Category banner: shorter, text on the LEFT over the image.
    return (
      <section className={`${HERO_SIZE} bg-[#e5e5e5]`}>
        <picture>
          {b.image_mobile && <source media="(max-width: 768px)" srcSet={b.image_mobile} />}
          {b.image_tablet && <source media="(max-width: 1024px)" srcSet={b.image_tablet} />}
          <img src={b.image_desktop!} alt={alt} className={HERO_IMG} loading="eager" />
        </picture>
        {b.cta_href && (
          <CtaLink href={b.cta_href} aria-label={b.title || b.alt || "Open"} className="absolute inset-0 z-[1]" />
        )}
        {(b.title || b.eyebrow || b.cta_label) && (
          <BannerText eyebrow={b.eyebrow} title={b.title} ctaLabel={b.cta_label} ctaHref={b.cta_href} color={b.text_color} onImage />
        )}
      </section>
    )
  }
  return (
    <section className={`${HERO_SIZE} bg-[#e5e5e5] flex flex-col items-center justify-center`}>
      <picture>
        {b.image_mobile && <source media="(max-width: 768px)" srcSet={b.image_mobile} />}
        {b.image_tablet && <source media="(max-width: 1024px)" srcSet={b.image_tablet} />}
        <img src={b.image_desktop!} alt={alt} className={HERO_IMG} loading="eager" />
      </picture>
      {b.cta_href && (
        <CtaLink href={b.cta_href} aria-label={b.title || b.alt || "Open"} className="absolute inset-0 z-[1]" />
      )}
      {(b.title || b.eyebrow || b.cta_label) && (
        <div className="absolute inset-0 z-[2] pointer-events-none bg-black/25 flex flex-col items-center justify-center text-center px-6">
          {b.eyebrow && <span className="text-white/90 uppercase tracking-[0.3em] text-xs font-semibold mb-2" style={b.text_color ? { color: b.text_color } : undefined}>{b.eyebrow}</span>}
          {b.title && <h1 className="text-white text-3xl md:text-5xl font-bold tracking-tight mb-4 max-w-3xl drop-shadow-lg" style={b.text_color ? { color: b.text_color } : undefined}>{b.title}</h1>}
          {b.cta_label && b.cta_href && (
            <CtaLink href={b.cta_href} className="pointer-events-auto inline-flex items-center bg-white text-black px-7 py-3 rounded-full text-xs md:text-sm font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors">
              {b.cta_label}
            </CtaLink>
          )}
        </div>
      )}
    </section>
  )
}
