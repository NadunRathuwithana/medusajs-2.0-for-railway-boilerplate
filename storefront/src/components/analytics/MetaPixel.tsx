"use client"

import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"
import { useEffect, useRef } from "react"

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export default function MetaPixel() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // The inline init snippet below fires the first PageView itself, synchronously
  // with fbq being defined — relying on this effect for that first call races
  // against the <Script> tag's own execution and can silently drop it.
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (!PIXEL_ID) return

    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Fire PageView on subsequent client-side route changes — Next.js
    // navigation doesn't reload the page, so fbevents.js never sees it.
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView")
    }
  }, [pathname, searchParams])

  if (!PIXEL_ID) return null

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `,
      }}
    />
  )
}
