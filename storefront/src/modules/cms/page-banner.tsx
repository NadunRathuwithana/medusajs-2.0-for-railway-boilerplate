import { getCms } from "@lib/data/cms"
import CtaLink from "./cta-link"
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
  const isCategory = pageKey.startsWith("category:")
  if (isCategory) {
    // Category banner: shorter, text on the LEFT over the image.
    return (
      <section className={`${HERO_SIZE} bg-[#e5e5e5]`}>
        <picture>
          {b.image_mobile && <source media="(max-width: 768px)" srcSet={b.image_mobile} />}
          {b.image_tablet && <source media="(max-width: 1024px)" srcSet={b.image_tablet} />}
          <img src={b.image_desktop!} alt={alt} className={HERO_IMG} loading="eager" />
        </picture>
        {(b.title || b.eyebrow || b.cta_label) && (
          <div className="absolute inset-0 flex items-center">
            <div className="content-container max-w-[1440px] mx-auto w-full px-6 md:px-16 text-left">
              {b.eyebrow && <p className="text-sm md:text-base font-medium text-white/90 drop-shadow">{b.eyebrow}</p>}
              {b.title && <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mt-1 max-w-xl drop-shadow-lg">{b.title}</h2>}
              {b.cta_label && b.cta_href && (
                <CtaLink href={b.cta_href} className="mt-4 inline-flex items-center bg-white text-black px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors">
                  {b.cta_label}
                </CtaLink>
              )}
            </div>
          </div>
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
      {(b.title || b.eyebrow || b.cta_label) && (
        <div className="absolute inset-0 bg-black/25 flex flex-col items-center justify-center text-center px-6">
          {b.eyebrow && <span className="text-white/90 uppercase tracking-[0.3em] text-xs font-semibold mb-2">{b.eyebrow}</span>}
          {b.title && <h1 className="text-white text-3xl md:text-5xl font-bold tracking-tight mb-4 max-w-3xl drop-shadow-lg">{b.title}</h1>}
          {b.cta_label && b.cta_href && (
            <CtaLink href={b.cta_href} className="inline-flex items-center bg-white text-black px-7 py-3 rounded-full text-xs md:text-sm font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors">
              {b.cta_label}
            </CtaLink>
          )}
        </div>
      )}
    </section>
  )
}
