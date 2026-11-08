import { getCms } from "@lib/data/cms"
import HeroCarousel, { DEFAULT_SLIDES, Slide } from "./hero-carousel"

// Slides come from Admin > Site CMS. With none active (or the CMS unreachable)
// the built-in slides show, so the homepage never ends up empty.
export default async function Hero() {
  const { banners } = await getCms()
  const slides: Slide[] = banners
    .filter((b) => b.placement === "hero" && b.image_desktop)
    .map((b) => ({
      desktop: b.image_desktop!,
      tablet: b.image_tablet || b.image_desktop!,
      mobile: b.image_mobile || b.image_tablet || b.image_desktop!,
      alt: b.alt || b.title || "Cardle",
      eyebrow: b.eyebrow || undefined,
      title: b.title || undefined,
      cta: b.cta_label || undefined,
      href: b.cta_href || undefined,
    }))

  return <HeroCarousel slides={slides.length ? slides : DEFAULT_SLIDES} />
}
