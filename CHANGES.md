# Session Changes — cardle.lk Optimization (Phases 1–14)

Running log of what was changed in this session, in commit order on `fine-tune-branch`. Updated as work progresses.

## Phase 1 — Audit (no code changes)
Mapped routing, data fetching, state management, image usage, SEO/metadata, and analytics across the storefront. Ran a partial production build and Lighthouse against the staging URL to get baseline numbers. Key baseline: PDP Performance score 48, LCP 10.2s, driven mostly by `images.unoptimized: true` shipping full-size JPEGs (some over 1MB) and ~4MB total page weight.

## Phase 2 — Performance (`833cd28`)
- Removed unused deps (`pg`, `axios`, `qs`, `algoliasearch`); pinned floating `"preview"`-tagged Medusa packages to exact versions so installs stay reproducible.
- Fixed `lodash` barrel imports to per-method imports.
- Wired up `@next/bundle-analyzer` (the existing `analyze` script was a no-op).
- Converted 6 components with no hooks/handlers from client to server components.
- Dynamically imported `QuickViewModal` (product grid) — only loads when opened.
- Deferred loading the Stripe.js SDK until a Stripe payment session is actually pending, instead of on every checkout regardless of payment method.
- Wrapped `retrieveCart`/`enrichLineItems` in React `cache()` to dedupe repeated per-request cart fetches.
- Added Suspense + skeleton fallbacks around home page product sections.

## Phase 3 — Image optimization (`88121b2`)
- Removed `images.unoptimized: true` (the single biggest perf issue found) and enabled AVIF/WebP.
- Added a `**.up.railway.app` remote pattern and fixed a latent `remotePatterns` hostname/port-parsing bug that `unoptimized: true` had been silently masking.
- Replaced every raw `<img>` with `next/image` (product cards, About page, order/account thumbnails, payment/logo icons), all with explicit dimensions or `fill`+`sizes`.
- Added a shared `ResponsiveHeroImage` component (home/store/collection heroes) using `next/image`'s `getImageProps` art-direction pattern — each breakpoint gets its own media-scoped `<link rel=preload>` instead of preloading all 3 variants on every device.
- Deleted an unused dead-code component that hotlinked Unsplash placeholder images.

## Phase 4 — Mobile (`82bbdd5`)
- Audited 375/390/768px viewports against staging with Playwright (screenshots + a DOM script checking overflow and tap-target sizes). No horizontal overflow found anywhere.
- Fixed ~20 interactive elements measuring below the 44px touch-target minimum: nav hamburger/logo/cart icon, footer social icons and text links, product grid CTAs, cart quantity steppers (both the cart page and the drawer), sort dropdown, "View All" link, back button.

## Phase 5 — SEO/meta (`bc47798`)
- Sitemap was missing `/refunds` (indexable, should've been listed) and every `/categories/*` route — both added. (`/privacy` and `/terms` are correctly excluded, they're `noindex`.)
- Added canonical + OG override to the About page (was inheriting the homepage's canonical).
- Added OG images to collection/category page metadata (product page already had one).
- Added `BreadcrumbList` JSON-LD to category pages.
- Fixed Product JSON-LD: `price`/`currencyCode` were never actually passed from the page, so the entire `Offer` block silently never rendered; `availability` was hardcoded to `InStock` regardless of real inventory. Now computes real stock across variants and passes cheapest price through.
- Removed a stale dead-code comment/import on the contact page (its metadata already worked correctly via a sibling `layout.tsx`).

## Phase 6 — GA4 + Meta Pixel (`fc675ab`)
- Found and fixed a real double-fire bug: `GoogleAnalytics.tsx`'s inline init script called `gtag('config', ..., {page_path})` on load, and the route-change `useEffect` fired the same call again on mount — every initial page view was counted twice.
- Added the missing GA4 `view_item_list` event (new `ViewItemListTracker` component, wired into every product-grid surface) and the missing Meta Pixel `Search` event (`SearchTracker` on search results).
- Guarded the PDP `view_item`/`ViewContent` tracker against StrictMode double-invoke / prop-identity churn.
- Flagged (not built): Meta Conversions API and a cookie-consent banner — see the Phase 8 correction below re: CAPI.

## Phase 7 — State management (`4acc29d`)
- Consolidated 3 copy-pasted `fetchCart()` definitions (nav cart button, cart page, checkout page) into one cached `getCart()` in `lib/data/cart.ts`.
- Memoized the `ModalProvider` context value (was a fresh object literal every render).

## Phase 8 — Security & resilience (`240666b`)
**Critical findings:**
- Removed `/collect` and `/api/collect` (identical duplicated code at both paths): a fully public, unauthenticated backend endpoint that could trigger real payment capture for any matching pending order using an attacker-supplied `transaction_id`, with no signature verification (unlike the real `/webhooks/koko` and `/webhooks/onepay`). Removed per explicit confirmation.
- The maintenance/coming-soon bypass login checked **hardcoded plaintext credentials committed to source**. Moved to `COMING_SOON_USERNAME`/`COMING_SOON_PASSWORD` env vars, fails closed if unset, added a per-IP rate limit (this form had none).

**Other work:**
- Added security headers: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (all enforcing). CSP shipped as **Report-Only** — checkout depends on Stripe/PayPal iframes and a Koko form-POST to a gateway domain that differs QA/prod, unverifiable without a live payment sandbox. **Needs a manual check**: run a real checkout with all 3 payment methods, confirm no CSP violations in the browser console, then flip `reportOnly` to `false` in `next.config.js`.
- Hardened `_medusa_cart_id`/`_medusa_onboarding` cookies (set in `middleware.ts`) with the same httpOnly/sameSite=strict/secure flags used elsewhere.
- Added Redis-backed sliding-window rate limiting (`backend/src/lib/rate-limit.ts`, using the already-provisioned `REDIS_URL`) on `/store/contact`, `/store/carts/:id/complete`, and both payment webhooks. Fails open if Redis is unreachable.
- Audited the client bundle and `NEXT_PUBLIC_` vars for leaked secrets — none found.
- **Correction to Phase 6**: Meta Conversions API is already fully implemented in the backend (`lib/meta-capi.ts`, called from the `order-placed` subscriber, correctly deduped against the client Pixel via `order.id`) — missed earlier because that audit only covered the storefront package.

**Still pending / needs your input:**
- Cloudflare WAF/cache rules — waiting on `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ZONE_ID`.

## Phase 9 — Caching & CDN (`240fa3f`)
- Product/collection/category fetches were tag-based but had no time-based revalidate, and the only `revalidateTag()` calls anywhere were for the storefront's own cart/customer mutations — an admin editing a product directly in Medusa admin had no trigger to invalidate the storefront's cache at all.
- Added `POST /api/revalidate` on the storefront (rate-limited, secret-protected) and a backend subscriber (`storefront-revalidate.ts`) listening for product/variant/collection/category create/update/delete events that calls it with the right tag(s). No-ops with a warning if unconfigured.
- Added a 1-hour safety-net `revalidate` alongside the existing tags on all products/collections/categories fetches, matching the `revalidate: 3600` convention already used elsewhere (middleware.ts region cache, sitemap.ts) — in case the webhook trigger ever fails silently.
- Extracted a shared in-memory rate-limit utility (storefront) reused by both the coming-soon login and the new revalidate endpoint.
- Documented (not yet applied — needs `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ZONE_ID`) the Cloudflare WAF and edge-cache-rule recommendations in `docs/cloudflare-recommendations.md`.

---

*Phases 10–14 (monitoring, accessibility, checkout hardening, third-party scripts, CI/CD) are in progress and will be appended here as they complete.*
