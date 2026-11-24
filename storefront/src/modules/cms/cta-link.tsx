import Link from "next/link"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/** Internal paths keep the country code; full URLs open as normal links. */
export default function CtaLink({
  href,
  className,
  children,
  ...rest
}: {
  href: string
  className?: string
  children?: React.ReactNode
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">) {
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    )
  }
  return (
    <LocalizedClientLink href={href.startsWith("/") ? href : `/${href}`} className={className} {...(rest as any)}>
      {children}
    </LocalizedClientLink>
  )
}
