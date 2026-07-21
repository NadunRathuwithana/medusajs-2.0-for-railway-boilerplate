import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import LocalizedClientLink from "../localized-client-link"

type InteractiveLinkProps = {
  href: string
  children?: React.ReactNode
  onClick?: () => void
}

const InteractiveLink = ({
  href,
  children,
  onClick,
  ...props
}: InteractiveLinkProps) => {
  return (
    <LocalizedClientLink
      className="flex gap-x-1 items-center group"
      href={href}
      onClick={onClick}
      {...props}
    >
      {/* text-ui-fg-interactive (Medusa UI's design token, #60A5FA) measures
          ~2.5:1 on a white background — fails WCAG AA's 4.5:1 for normal
          text. Using a darker blue here instead of touching the shared
          --fg-interactive CSS variable, which other @medusajs/ui components
          may rely on in different (possibly dark) contexts. */}
      <Text className="text-blue-700">{children}</Text>
      <ArrowUpRightMini
        className="group-hover:rotate-45 ease-in-out duration-150 text-blue-700"
      />
    </LocalizedClientLink>
  )
}

export default InteractiveLink
