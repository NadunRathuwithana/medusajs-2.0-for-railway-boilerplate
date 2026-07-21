"use client"

import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"
import { useEffect } from "react"

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export default function MetaPixel() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!PIXEL_ID) return

    // Fire PageView on route change (including initial load)
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView")
    }
  }, [pathname, searchParams])

  if (!PIXEL_ID) return null

  return (
    <>
      {/* Bootstrap only: defines fbq() so every ViewContent/AddToCart/etc.
          call above safely queues into n.queue (Meta's own documented
          behavior — see the `n.callMethod ? ... : n.queue.push(...)` line)
          regardless of whether the real fbevents.js has loaded yet. */}
      <Script
        id="meta-pixel-bootstrap"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[]}(window, document,'script');
            fbq('init', '${PIXEL_ID}');
          `,
        }}
      />
      {/* The actual fbevents.js library (103KB, ~37KB unused per the Phase 1
          Lighthouse audit) is deferred to lazyOnload — the bootstrap above
          already made every fbq() call safe to queue in the meantime. */}
      <Script
        id="meta-pixel-lib"
        strategy="lazyOnload"
        src="https://connect.facebook.net/en_US/fbevents.js"
      />
    </>
  )
}
