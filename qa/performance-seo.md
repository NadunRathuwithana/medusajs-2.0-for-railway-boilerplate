# QA: Performance and SEO (storefront)

Every storefront page renders dynamically on each request, and HTML is sent with `no-store`. No environment switch makes dev noindex. The sitemap also lists the internal packing product.
Next build was NOT run (check-env requires the publishable key and generateStaticParams calls the backend), so findings come from code. Items needing a browser are marked "unverified".

STATUS: PASS WITH ISSUES

Counts: blocker 0, major 6, minor 11.

## Major

### PERF-01 All HTML is no-store and every route is forced dynamic, so ISR and generateStaticParams are dead
- Severity: major
- Where: storefront/next.config.js:120-125, storefront/src/app/layout.tsx:10-18
- Evidence: root `generateMetadata` calls `await headers()` to read `x-pathname`. That opts every route into dynamic rendering. `generateStaticParams` in products, collections and categories therefore never yields static pages. On top of that, the headers block applies `Cache-Control: no-store, must-revalidate` to `/((?!_next/static|_next/image|favicon.ico).*)`.
- Expected vs actual: product, collection and home pages should be ISR or CDN-cacheable for 60-300s. Actual: each hit does SSR, with nav, CMS and region fetches. TTFB is bound by the backend (nav does 1 + N Medusa calls, see PERF-02). A traffic spike on one VPS falls back to the backend.
- Suggested fix:
  - Drop the `headers()` canonical hack. Use per-page `alternates.canonical` (already set on product, collection, category and policy pages). Or build the canonical from `params` in `generateMetadata`.
  - Restrict the no-store rule to the `/` stub, `/api/*` and cart, checkout and account paths.
  - Let pages emit `s-maxage=60, stale-while-revalidate`.
  - Note: Nav's `getCms` and cart calls are fine, but CartButton reads cookies, so it must stay inside Suspense/PPR or be moved client-side to allow static shells.

### PERF-03 The no-store regex also matches static files in /public
- Severity: major
- Where: storefront/next.config.js:120
- Evidence: the exclusions are only `_next/static`, `_next/image` and `favicon.ico`. Everything else in `public/` gets `no-store`: `/home/*.jpg`, `/about/*.jpg` (up to 783KB), `/payment/*.png`, the logo, `/invoice/logo.png` and `llms.txt`. Plain `<img>` tags for payment logos and the logo-light image reload on every visit. The Next image optimizer fetches `/public` originals over HTTP, so it is penalised too.
- Fix: add a header rule for `/:all*(png|jpg|jpeg|webp|avif|svg|ico|woff2)` with `public, max-age=31536000, immutable`, or at least `max-age=86400`. Place it before, or exclude it from, the catch-all. Alternatively narrow the no-store source to HTML routes only.

### PERF-02 Category and nav data are not cached (Next 15 fetch default is uncached)
- Severity: major
- Where: storefront/src/lib/data/categories.ts:6-30, 46-57; src/modules/layout/templates/nav/index.tsx:15-19
- Evidence: `listCategories`, `getCategoriesList` and `getCategoryByHandle` pass only `{ next: { tags: ["categories"] } }`. The repo's own comment in regions.ts notes that tags without `revalidate` are a no-op on Next 15. `listNavCategories` (on every page via Nav) does 1 category list call (uncached) plus N product count calls (cached 300s). Category pages call `getCategoryByHandle` twice (metadata and page), though React `cache` dedupes it within a request.
- Impact: every page view does a backend round trip for the categories.
- Fix: use `nextFetchOptions(["categories"], 300)` from `with-retry.ts` in all four calls. Add `withRetry` as the other data files do.

### PERF-04 CMS hero and page banners use raw `<img>`, not next/image (LCP)
- Severity: major
- Where: storefront/src/modules/cms/page-banner.tsx:30,46; home/components/wide-banner:26; categories-grid:34
- Evidence: the store, collection, category and about banners render `<picture><img src={b.image_desktop} loading="eager">`. The URLs are raw CMS uploads on media.cardle.lk, with no resizing, AVIF/WebP or srcset beyond the 3 CMS crops, and no `fetchPriority="high"`. Admin can upload multi-MB files. The default home hero (HeroCarousel) does use next/image.
- Fix: add `fetchPriority="high"` plus width/height to the banner `<img>`. Or render CMS images through `<Image fill priority sizes="100vw">` (media.cardle.lk is already in remotePatterns). Document an upload size cap (about 300KB per crop) in the CMS admin.

### PERF-05 Home hero preloads three variants of slide 1
- Severity: major
- Where: storefront/src/modules/home/components/hero/hero-carousel.tsx:140-162
- Evidence: each slide renders three `<Image>` (mobile, tablet, desktop), all with `priority={i === 0}`, and only CSS (`hidden md:block...`) selects one. `priority` emits a `<link rel=preload>` for each, so a phone downloads the mobile, tablet and desktop crops at high priority. That competes with the real LCP image and wastes bandwidth.
- Fix: preload only one. Use a single `<picture>` with `<source media>`, or one `<Image>` plus `art direction` via `getImageProps` and `priority` on the one that matches. Alternatively set `fetchPriority` on the mobile image only and `loading="lazy"` on tablet/desktop.

### SEO-01 There is no env-based switch: dev is indexable, and prod config is hardcoded
- Severity: major
- Where: storefront/src/app/robots.ts:1-20,179-181; src/app/layout.tsx:58-68; src/app/sitemap.ts:3
- Evidence: `robots.ts` always returns `allow: "/"` with `sitemap: https://cardle.lk/sitemap.xml`. The root metadata hardcodes `robots: { index: true, follow: true }`. No `X-Robots-Tag` header and no env check exists (grep for noindex or APP_ENV found only the cart, terms and privacy pages). So dev.cardle.lk will serve a crawlable site. Canonicals point to cardle.lk, which limits the damage, but dev pages can still be indexed or appear in search. The dev sitemap and robots also advertise prod URLs.
- Expected vs actual: dev should be `Disallow: /` with noindex; prod should allow indexing.
- Suggested fix: derive an `IS_PROD` flag from `NEXT_PUBLIC_BASE_URL === "https://cardle.lk"` (or a new `NEXT_PUBLIC_ALLOW_INDEXING` env).
  - `robots.ts`: if not prod, return `{ rules: { userAgent: "*", disallow: "/" } }`.
  - `layout.tsx`: set `robots: IS_PROD ? {...} : { index: false, follow: false }`.
  - `next.config.js` headers: add `X-Robots-Tag: noindex, nofollow` when not prod.
  - Also use `getBaseURL()` instead of the hardcoded `https://cardle.lk` in the canonical, OG, sitemap and JSON-LD.

### SEO-02 Sitemap lists the internal packing product, and omits some real pages
- Severity: major
- Where: storefront/src/app/sitemap.ts:20-24,100-107; backend/src/modules/addons/packing-product.ts:32-35
- Evidence: the sitemap fetches `fields: "handle,updated_at"` and does not filter `metadata.internal`. The "Packing" product (handle `internal-packing`, published) would appear as `/lk/products/internal-packing`. `getProductsList` filters internal products for listings, but the product page by handle does not, so the URL resolves with 200 and gets indexed. Also missing from the sitemap: `/lk/refunds`, categories (`/lk/categories/*`), and the legal pages (terms and privacy are noindex, so that is fine).
- Fix: request `fields: "handle,updated_at,metadata"` and filter `!p.metadata?.internal`. Also `notFound()` in the product page when `pricedProduct.metadata?.internal`. Add category and refunds entries.

## Minor

### SEO-03 Region redirects are 307 (temporary), and www goes through a two-hop chain
- Severity: minor
- Where: storefront/src/middleware.ts:216,221; next.config.js:90-98
- Evidence: bare URLs (`/products/x`, `/store`, `/collections/x`) are redirected with `NextResponse.redirect(..., 307)` to `/lk/...`. Query strings are preserved. `www.cardle.lk/foo` then goes 308 to `cardle.lk/foo`, then 307 to `cardle.lk/lk/foo` (2 hops).
- Impact: the old (contabo) URLs that Google has indexed without `/lk` pass link equity more reliably with 301/308. Bots are not blocked: no UA checks, and the 307 is followed.
- Fix: use `308` in the region redirect. Optionally add a direct www rule to `https://cardle.lk/lk/:path*` for paths not starting with `lk`.

### SEO-04 Middleware country check uses `includes`, so some paths skip the redirect and 404
- Severity: minor
- Where: storefront/src/middleware.ts:197-198
- Evidence: `pathname.split("/")[1].includes(countryCode)` is a substring match. A first segment containing "lk" (for example `/bulk`, `/talk`, `/lkx`) is treated as already prefixed, so no redirect occurs. `[countryCode]` then fails `getRegion` and the page 404s. Not an issue for current routes (none contain "lk"), but any future top-level slug with "lk" would 404.
- Fix: compare equality: `split("/")[1]?.toLowerCase() === countryCode`.

### SEO-05 V1 to V2 URL comparison (origin/contabo vs this branch)
- Severity: minor (informational)
- Evidence: `git ls-tree` diff of `storefront/src/app` shows the route tree is identical except for 2 new API routes (`/api/onepay/finish`, `/api/onepay/status`). The URL shapes are unchanged: `/lk/products/:handle`, `/lk/collections/:handle`, `/lk/categories/*`, `/lk/store`, `/lk/about`, `/lk/contact`, `/lk/faq`, `/lk/shipping`, `/lk/returns`, `/lk/refunds`, `/lk/terms`, `/lk/privacy`, `/lk/search`, `/lk/results/:q`, with unprefixed variants redirected by middleware. No V1 URL is removed by this code, so none should 404 from route changes.
- Residual risks (unverified, needs the live DB):
  - Product, collection and category handles in the live DB must match whatever V2 serves. Since V2 will point at its own DB, diff `handle` values between the live and V2 DBs before cutover.
  - The `llms.txt` and live sitemap list handles (journey-tote, heritage-tote, dune-tote, cardle-cloud, cardle-signature, horizon-tote, essential-tote, artisan-canvas-tote, sierra-tote, cardle-voyage). Confirm each exists in V2.
- Suggested precautionary redirects, only if legacy shapes exist (no evidence they do): in `next.config.js` `redirects()` add `{ source: "/product/:h", destination: "/lk/products/:h", permanent: true }`, `{ source: "/collection/:h", destination: "/lk/collections/:h", permanent: true }`, `{ source: "/shop", destination: "/lk/store", permanent: true }`. Mark any renamed handle with its own entry.

### SEO-06 Stale or inconsistent copy in SEO surfaces
- Severity: minor
- Where: storefront/public/llms.txt (delivery "LKR 300", "2-7 business days"); (main)/page.tsx:20 ("Free delivery available"); product-json-ld/index.tsx:87 (transit 3-8 days)
- Evidence: the site policy is LKR 500 flat and 3-10 working days (shipping page, FAQ). JSON-LD transitTime says 3-8; the home meta description claims free delivery. Contradictory structured data can trigger Merchant Center mismatch warnings.
- Fix: align everything with 500 / 3-10, and drop "Free delivery available" or qualify it (the Buy 2 Get 1 promo).

### SEO-07 Title template double-brands pages that already include the name
- Severity: minor
- Where: root layout `template: "%s | Cardle Sri Lanka"`; about, store, faq, shipping, returns, refunds, contact, collection, category, terms, privacy pages
- Evidence: for example "Terms of Service | Cardle" becomes "Terms of Service | Cardle | Cardle Sri Lanka". Product and home pages correctly use `absolute`. Titles run long (>60 chars).
- Fix: use `title: { absolute: ... }` or drop the "| Cardle" suffix in those pages.

### SEO-08 Non-indexable pages rely on robots.txt only; some index-worthy pages are noindex
- Severity: minor
- Where: checkout, account and search/results pages have no `robots: noindex` metadata. `/lk/checkout` (no trailing slash), `/lk/search` and `/lk/results/*` are not covered by Disallow (the checkout rule is `/lk/checkout/` with trailing slash). Terms and privacy are `index: false`.
- Fix: add `robots: { index: false }` to checkout, account, search and results pages. Change the disallow rules to `/lk/checkout`, `/lk/account`, `/lk/search`, `/lk/results`. Consider indexing privacy and terms (not harmful either way).

### SEO-09 Product JSON-LD and OG details
- Severity: minor
- Where: product-json-ld/index.tsx; products/[handle]/page.tsx:100-114; collections and categories pages
- Evidence: `JSON.stringify` output is injected without escaping `<`, so a product description containing `</script>` would break out (admin-controlled, low risk). Fix with `.replace(/</g, "\\u003c")`. Product OG image dims are hardcoded 800x1000, while media is about 1638x2048. The breadcrumb for products has no category level. Collection and category metadata have no OG image, relying on the root file convention `src/app/opengraph-image.jpg` (1200x630). Whether the root OG image is inherited when a child sets `openGraph` is unverified (needs browser). Fix: set `images` explicitly. `priceValidUntil` is computed at render time (always now+1y), harmless.

### PERF-06 Full `lodash` import in client bundles
- Severity: minor
- Where: product-card/quick-view-modal.tsx:11, product-actions/index.tsx:4, lib/util/compare-addresses.ts, checkout/shipping-address
- Evidence: `import { isEqual } from "lodash"` pulls the CJS monolith (about 70KB gzip), in the product-card client chunk used on every listing page. `product-card` is `"use client"` and also bundles QuickViewModal and BnplWidget for each card.
- Fix: `import isEqual from "lodash/isEqual"` or `lodash-es`, and `next/dynamic` the QuickViewModal.

### PERF-07 Product gallery preloads two copies of the first image, and the home page has sequential data awaits
- Severity: minor
- Where: image-gallery/index.tsx:381, 416; (main)/page.tsx:34-35
- Evidence: mobile (`lg:hidden`) and desktop (`hidden lg:block`) blocks both render `<Image priority>`, so both are preloaded and the unused one wastes a request. `sizes="100vw"` on mobile is correct. The home page awaits `getCollectionsWithProducts` and then `getRegion` sequentially (cached, so small cost).
- Fix: render only one gallery via CSS-independent logic, or drop `priority` on the desktop copy when a mobile viewport is likely. Wrap with `Promise.all`.

### PERF-08 next/image has no `minimumCacheTTL`; the module-level region cache never expires
- Severity: minor
- Where: next.config.js images block; lib/data/regions.ts (module-level `regionMap`)
- Evidence: Next 15's default optimizer cache TTL is short (60s from the upstream header, and media.cardle.lk's header is unknown). Set `minimumCacheTTL: 2592000` for stable product images. `regionMap` is populated once per process and only reset on restart, so region or price changes need a redeploy or restart (note `revalidateTag("regions")` does not clear it).

### PERF-09 Misc
- Severity: minor
- Evidence:
  - Product page `withRetry` can wait 8s x 3 attempts plus backoff (about 25s) before failing.
  - Meta Pixel and GA load `afterInteractive` (fine).
  - `MetaParamSync` dynamically imports on every route change (cached module, fine).
  - The CSP is Report-Only, which has no perf effect but allows `unsafe-eval`. No webfonts are loaded (no next/font, no font imports), so there is no font CLS (unverified, needs browser).
  - Per-image `quality` is 50 on Thumbnail and 75 on cards, fine.

## Checked and PASSED
- Product pages: title, description (word-boundary truncated), canonical, OG and Twitter present, and `notFound()` in `generateMetadata` gives a real 404 for unknown handles.
- Product JSON-LD: Offer with `priceCurrency` from the region (LKR), `price` with 2 decimals, `availability` via `isVariantInStock`, brand, sku, shipping and return policy. BreadcrumbList (home > shop > product) and Collection breadcrumb present. Organization and WebSite JSON-LD on home, FAQPage on FAQ.
- Sitemap: reachable, with `/lk` prefixed URLs and errors caught. robots.ts: disallows api, checkout, account and cart, and lists the sitemap.
- Region redirect: `/` goes to `/lk` in one hop, and it preserves query strings. A backend outage avoids an infinite loop (empty region map passes through). The `www` to apex redirect is permanent (308). The middleware matcher excludes `_next/image`, api, and static assets.
- Maintenance and coming-soon redirects (307) are only active when the env flags are set. Verify they are OFF in the prod env, or all bots get redirected.
- Images: `images.formats` avif/webp; remotePatterns trimmed (demo hosts removed, localhost non-prod only); product cards use `sizes` and lazy loading; hero default uses next/image with `priority` on the first slide; logo has `priority`.
- Third-party scripts: Meta Pixel and GA via `next/script afterInteractive`. Onepay.js is injected on demand in the payment button (not site-wide).
- Heavy libs: framer-motion only on maintenance, coming-soon and order-complete pages. PayPal and Stripe SDKs are imported only in checkout components.
- Promo bar and hero have fixed aspect ratios (`HERO_SIZE`), so little CLS from banners. Nav cart is in Suspense with a placeholder link.
- Security headers present (HSTS, XFO, nosniff, referrer policy, CSP report-only). public/ has no huge files (largest 783KB; 7.2MB total, 23 jpg and 12 png, none above 1MB).
- 404: `(main)/not-found.tsx` and a root `not-found.tsx` exist, with titles. Trailing slashes use Next defaults (308 to the no-slash form). No hreflang is needed (single region, no alternates).
