import { getCms } from "@lib/data/cms"
import CtaLink from "./cta-link"

/**
 * Top banner of a page. Uses the first active CMS banner for `pageKey`;
 * otherwise renders `fallback` (the page's original built-in banner).
 */
export default async function PageBanner({
  pageKey,
  fallback,
}: {
  pageKey: "store" | "collection" | "about"
  fallback: React.ReactNode
}) {
  const { banners } = await getCms()
  const b = banners.find((x) => x.placement === "page" && x.page_key === pageKey && x.image_desktop)
  if (!b) return <>{fallback}</>

  const alt = b.alt || b.title || "Cardle"
  return (
    <section className="h-[62vh] min-h-[380px] max-h-[640px] w-full relative overflow-hidden bg-[#e5e5e5] flex flex-col items-center justify-center">
      <picture>
        {b.image_mobile && <source media="(max-width: 768px)" srcSet={b.image_mobile} />}
        {b.image_tablet && <source media="(max-width: 1024px)" srcSet={b.image_tablet} />}
        <img src={b.image_desktop!} alt={alt} className="absolute inset-0 w-full h-full object-cover object-center" loading="eager" />
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
