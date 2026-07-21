import { getImageProps } from "next/image"

type HeroImageVariant = {
  src: string
  alt: string
  media: string
  className: string
}

/**
 * Art-directed hero banner: a different image per breakpoint (not just a resolution
 * swap of the same image), rendered via Next's Image Optimization so each still gets
 * AVIF/WebP + responsive sizing. next/image's `priority` preloads unconditionally, so
 * instead each variant gets its own media-scoped <link rel="preload"> pointing at the
 * real optimized URL, and the <img> itself stays `loading="lazy"` — the hidden variants
 * (display:none) are never fetched by the browser's native lazy-loader, while the
 * visible one loads immediately via its matching preload link.
 */
export default function ResponsiveHeroImage({
  variants,
}: {
  variants: HeroImageVariant[]
}) {
  const resolved = variants.map(({ src, alt, media, className }) => {
    const { props } = getImageProps({
      src,
      alt,
      fill: true,
      sizes: "100vw",
      loading: "lazy",
    })
    return { ...props, media, className }
  })

  return (
    <>
      {resolved.map((v) => (
        <link
          key={v.media}
          rel="preload"
          as="image"
          href={v.src}
          imageSrcSet={v.srcSet}
          imageSizes="100vw"
          media={v.media}
          fetchPriority="high"
        />
      ))}

      {resolved.map(({ media, className, ...imgProps }) => (
        <img key={media} {...imgProps} className={className} />
      ))}
    </>
  )
}
