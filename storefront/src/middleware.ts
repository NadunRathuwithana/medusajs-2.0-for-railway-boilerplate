import { HttpTypes } from "@medusajs/types"
import { notFound } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
  // In-flight fetch, shared by every request that finds a cold/stale cache.
  // Without this, N concurrent requests arriving before the first fetch
  // resolves each independently kick off their own /store/regions call —
  // since middleware runs on every single matched request, a traffic burst
  // right after a cold start (fresh deploy/restart, empty cache) could fire
  // a thundering herd of duplicate requests at the backend simultaneously.
  inFlight: null as Promise<void> | null,
}

async function fetchRegionMap() {
  const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
    headers: {
      "x-publishable-api-key": PUBLISHABLE_API_KEY!,
    },
    next: {
      revalidate: 3600,
      tags: ["regions"],
    },
    // Middleware has no per-request timeout of its own — an unresponsive
    // backend would otherwise hang this fetch (and therefore every routed
    // request) indefinitely.
    signal: AbortSignal.timeout(8000),
  }).then((res) => res.json())

  if (!regions?.length) {
    notFound()
  }

  regions.forEach((region: HttpTypes.StoreRegion) => {
    region.countries?.forEach((c) => {
      regionMapCache.regionMap.set(c?.iso_2 ?? "", region)
    })
  })

  regionMapCache.regionMapUpdated = Date.now()
}

async function getRegionMap() {
  const { regionMap, regionMapUpdated } = regionMapCache

  const isStale =
    !regionMap.keys().next().value || regionMapUpdated < Date.now() - 3600 * 1000

  if (isStale) {
    try {
      // Join an already-in-flight refresh instead of starting a new one.
      if (!regionMapCache.inFlight) {
        regionMapCache.inFlight = fetchRegionMap().finally(() => {
          regionMapCache.inFlight = null
        })
      }
      await regionMapCache.inFlight
    } catch (error) {
      // A transient backend hiccup here previously threw uncaught out of
      // getRegionMap(), failing the ENTIRE middleware invocation — which
      // runs on virtually every route — for that request. Falling back to
      // whatever's already cached (possibly stale, possibly empty on a
      // cold start) keeps the site up instead of 500ing every page.
      console.error("[middleware] Failed to refresh region map:", error)
    }
  }

  return regionMapCache.regionMap
}

/**
 * Fetches regions from Medusa and sets the region cookie.
 * @param request
 * @param response
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode

    const vercelCountryCode = request.headers
      .get("x-vercel-ip-country")
      ?.toLowerCase()

    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION
    } else if (regionMap.keys().next().value) {
      countryCode = regionMap.keys().next().value
    }

    return countryCode
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable?"
      )
    }
  }
}

/**
 * Passes the request through while stamping the resolved pathname onto a
 * request header, so server components (e.g. the root layout) can read the
 * current path via next/headers to build a path-correct canonical URL.
 */
function passThrough(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", request.nextUrl.pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

/**
 * Middleware to handle region selection and onboarding status.
 */
export async function middleware(request: NextRequest) {
  const isMaintenanceModeEnv = process.env.NEXT_PUBLIC_ENABLE_MAINTENANCE_MODE === "true" || process.env.ENABLE_MAINTENANCE_MODE === "true"
  const isComingSoonEnv = process.env.NEXT_PUBLIC_ENABLE_COMING_SOON === "true" || process.env.ENABLE_COMING_SOON === "true"

  const hasAccess = request.cookies.get("storefront_access")?.value === "1"
  const isMaintenancePath = request.nextUrl.pathname.startsWith("/maintenance")
  const isComingSoonPath = request.nextUrl.pathname.startsWith("/coming-soon")

  if (isMaintenanceModeEnv && !hasAccess && !isMaintenancePath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/maintenance"
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl, 307)
  }

  if (isComingSoonEnv && !isMaintenanceModeEnv && !hasAccess && !isComingSoonPath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/coming-soon"
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl, 307)
  }

  if (hasAccess && (isMaintenancePath || isComingSoonPath)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/"
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl, 307)
  }

  if (!isMaintenanceModeEnv && isMaintenancePath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/"
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl, 307)
  }

  if (!isComingSoonEnv && isComingSoonPath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/"
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl, 307)
  }

  if (isMaintenancePath || isComingSoonPath) {
    return passThrough(request)
  }

  const searchParams = request.nextUrl.searchParams
  const isOnboarding = searchParams.get("onboarding") === "true"
  const cartId = searchParams.get("cart_id")
  const onboardingCookie = request.cookies.get("_medusa_onboarding")
  const cartIdCookie = request.cookies.get("_medusa_cart_id")

  const regionMap = await getRegionMap()

  // Backend unreachable AND no cache from a previous successful fetch (e.g.
  // right after a fresh deploy) — countryCode will resolve to undefined,
  // and the redirect logic below defaults to redirecting a request to
  // itself when that happens, i.e. an infinite redirect loop, which is a
  // worse failure than just letting the request through to fail/error
  // normally inside the page (now that pages have real error.tsx boundaries).
  if (regionMap.size === 0) {
    console.error("[middleware] Region map is empty — passing request through unresolved")
    return passThrough(request)
  }

  const countryCode = regionMap && (await getCountryCode(request, regionMap))

  const urlHasCountryCode =
    countryCode && request.nextUrl.pathname.split("/")[1].includes(countryCode)

  // check if one of the country codes is in the url
  if (
    urlHasCountryCode &&
    (!isOnboarding || onboardingCookie) &&
    (!cartId || cartIdCookie)
  ) {
    return passThrough(request)
  }

  const redirectPath =
    request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname

  const queryString = request.nextUrl.search ? request.nextUrl.search : ""

  let redirectUrl = request.nextUrl.href

  let response = NextResponse.redirect(redirectUrl, 307)

  // If no country code is set, we redirect to the relevant region.
  if (!urlHasCountryCode && countryCode) {
    redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`
    response = NextResponse.redirect(`${redirectUrl}`, 307)
  }

  // If a cart_id is in the params, we set it as a cookie and redirect to the checkout.
  if (cartId && !cartIdCookie) {
    response = NextResponse.redirect(`${redirectUrl}`, 307)
    response.cookies.set("_medusa_cart_id", cartId, { maxAge: 60 * 60 * 24 })
  }

  // Set a cookie to indicate that we're onboarding. This is used to show the onboarding flow.
  if (isOnboarding) {
    response.cookies.set("_medusa_onboarding", "true", { maxAge: 60 * 60 * 24 })
  }

  return response
}

export const config = {
  matcher: [
    // _next/image must be excluded too, not just _next/static: it has no
    // file extension (it's a query-string-driven route, /_next/image?url=...),
    // so it wasn't caught by the .jpg/.png/etc patterns either. Without this,
    // the optimizer's own request got treated as a country-code-less path and
    // 307-redirected to /lk/_next/image?... — not a real route, so every
    // optimized image 404'd once image optimization was turned on.
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png|.*\\.jpg|.*\\.gif|.*\\.svg|.*\\.xml|.*\\.txt).*)",
  ], // prevents redirecting on static files, including the root-level sitemap.xml and robots.txt routes
}
