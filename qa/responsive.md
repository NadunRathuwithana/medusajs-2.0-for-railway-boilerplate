# QA: Responsive and UI (storefront) - code-level review

Code review of the storefront at widths 360/390/768/1024/1440 found no blockers. It found 6 majors (no error boundary for checkout or layout crashes, sub-16px inputs, tiny tap targets, hero triple-preload, no empty-category state, duplicate checkout summary DOM) and 8 minors.
Nothing was run in a browser, so every visual claim is marked "unverified (needs browser)" where applicable.

STATUS: PASS WITH ISSUES
Counts: blocker 0 | major 6 | minor 8

---

### UI-01 No global-error.tsx, and no error boundary at all for checkout
- Severity: major
- Where: storefront/src/app (only `src/app/[countryCode]/(main)/error.tsx` exists; no `global-error.tsx`, no `error.tsx` in `(checkout)` or at `[countryCode]`)
- Evidence: `find src/app -name error.tsx -o -name global-error.tsx` returns only the (main) one. `(checkout)/layout.tsx` renders `<Nav/>` and `<Footer/>` (both async, hitting Medusa and CMS), and the checkout page, payment return pages (onepay/koko/mintpay) and checkout itself all sit outside `(main)`.
- Expected vs actual: a thrown error on checkout or payment return, or in the Nav/Footer data fetch (`listRegions`, `getCms`, `listNavCategories`, `getCollectionsList`), should show a branded retry screen. Today it shows Next's bare default error page. `(main)/error.tsx` cannot catch errors thrown by its own sibling `layout.tsx` (Nav/Footer) either. This is the highest-value place for a retry button, since a customer mid-payment is the one who lands there.
- Suggested fix:
  - Add `src/app/[countryCode]/(checkout)/error.tsx` that reuses `@components/common/error-fallback`.
  - Add `src/app/global-error.tsx` with its own `<html><body>` and a reload button.
  - Optionally lift one `error.tsx` to `src/app/[countryCode]/error.tsx`.

### UI-02 Form inputs are 13-14px, so iOS Safari zooms on focus
- Severity: major
- Where:
  - `src/modules/common/components/input/index.tsx:49` (`text-[14px] h-[38px]`)
  - `src/modules/common/components/native-select/index.tsx:148` (`text-[14px] h-[38px]`)
  - `src/modules/checkout/components/discount-code/index.tsx:137` (`text-[13px] h-9`)
  - `src/modules/search/components/search-box/index.tsx:57` (`txt-compact-large`)
  - `src/modules/store/components/sort-dropdown`
- Evidence: every checkout address field, login, register, and account form goes through `Input`/`NativeSelect`. iOS Safari zooms any field under 16px on focus and does not always zoom back out. Fields are also 38px tall, under the 44px tap target.
- Expected vs actual: >=16px on mobile and >=44px tall. Actual is 14px and 38px. This hits the most important mobile flow (checkout address entry) for the dominant Sri Lankan mobile audience.
- Suggested fix: in `Input` and `NativeSelect`, change `h-[38px] ... text-[14px]` to `h-11 ... text-base sm:text-[14px]`. Apply the same to the discount input (`h-11 text-base sm:text-[13px]`).

### UI-03 Tap targets well under 44px (qty, delete, close, hamburger, dots)
- Severity: major
- Where:
  - `modules/layout/components/cart-dropdown/index.tsx:346,356` qty +/- buttons `w-6 h-6` (24px)
  - `modules/cart/components/item/index.tsx:211,221` qty +/- `w-7 h-7` (28px)
  - `modules/common/components/delete-button/index.tsx:36` bare 20px trash icon, no padding, and no `aria-label`
  - `modules/layout/components/cart-dropdown/index.tsx:70-84` nav cart button is as wide as its 20px icon
  - `modules/layout/components/side-menu/index.tsx:75` hamburger is 24px wide (full header height, but narrow)
  - `side-menu/index.tsx:118` close button `w-8 h-8` (32px)
  - `cart-dropdown/index.tsx:126` close button is 40px
  - `hero-carousel.tsx:225` dots `h-1.5 w-1.5` (6px)
  - `product-card/index.tsx:83` Add/Options button is about 40px (`py-3` on `text-xs`)
  - `quick-view-modal.tsx:153` close button is 40px
- Expected vs actual: >=44x44 for primary mobile controls. Qty +/- and delete are the likely mis-tap points when adjusting a cart on a phone. The qty and delete buttons also have no accessible name (icon-only, no `aria-label`).
- Suggested fix: pad the hit area without changing the visual size, for example `relative after:absolute after:-inset-2.5 after:content-['']`, or bump to `w-10 h-10`. Add `aria-label="Increase quantity"`, `aria-label="Decrease quantity"` and `aria-label="Remove item"`. Make the hamburger `px-3 -ml-3`. Make the dots `p-2` with a `span` inside.

### UI-04 Hero preloads all three breakpoint images on every device
- Severity: major (LCP and data cost on mobile)
- Where: `modules/home/components/hero/hero-carousel.tsx:139-161`
- Evidence: three `<Image priority={i === 0}>` (mobile, tablet, desktop), swapped with `block md:hidden` / `hidden md:block lg:hidden` / `hidden lg:block`. `priority` makes Next emit a `<link rel="preload">` for each, without a media query. A phone preloads the mobile, tablet and desktop JPGs. The same pattern is in `product gallery` (`image-gallery/index.tsx:381` and `:416`): mobile and desktop carousels both set `priority`, so both first images preload on every viewport.
- Expected vs actual: only the image for the current breakpoint is fetched eagerly. Actual wastes bandwidth and competes with the real LCP image.
- Suggested fix: use a single `<picture>` with `<source media>`, or keep the three `<Image>` but set `priority` only on the mobile one and use `loading="lazy"` on the others. Alternatively use `fetchPriority="high"` with `loading` set per breakpoint. Verify in the browser Network tab at 390 vs 1440.

### UI-05 Empty category/collection shows a blank area (no empty state)
- Severity: major
- Where: `modules/store/templates/paginated-products.tsx:97-108`, `modules/store/components/infinite-product-grid/index.tsx:87-98`
- Evidence: `products.map(...)` is rendered straight into the `<ul>`. There is no `products.length === 0` branch. `/categories/<empty>` or `/collections/<empty>` renders only the title and an empty grid. Nav categories come from `listNavCategories` (categories "with products"), but direct URLs and sitemap entries can still hit empty ones.
- Also: `modules/search/templates/search-results-template/index.tsx:59` prints a bare `<Text>No results.</Text>` with `ml-8 small:ml-14`. The search route is also behind `NEXT_PUBLIC_FEATURE_SEARCH_ENABLED`, and `lib/search-client.ts` falls back to `http://127.0.0.1:7700` with `test_key` when env is missing. Confirm the flag is off in prod, and `/search` and `/results/x` are unreachable or noindex.
- Suggested fix: add a friendly empty block ("Nothing here yet" plus a "Shop all bags" link) when `products.length === 0`.

### UI-06 Mobile checkout summary mounts a second, hidden copy of the full summary
- Severity: major (a11y and potential state bugs)
- Where: `(checkout)/checkout/page.tsx:49,59` and `modules/checkout/components/mobile-checkout-summary/index.tsx:32-40`
- Evidence: `MobileCheckoutSummary` (`lg:hidden`) and the desktop sidebar (`hidden lg:block`) both render `<CheckoutSummary>`. So `DiscountCode` (`id="promotion-input"`, `autoFocus`, `data-testid="discount-input"`), `Packing` and `LiveTotals` are mounted twice, giving duplicate DOM ids. The collapsed mobile panel only uses `max-h-0 opacity-0 overflow-hidden`, so its links, buttons and the promo toggle stay in the tab order while invisible. The toggle button has no `aria-expanded`. If either copy's promo box is opened, it `autoFocus`es.
- Expected vs actual: one interactive copy per viewport, and collapsed content not focusable. Actual has duplicate ids, hidden-but-focusable controls and possible double Packing state.
- Suggested fix:
  - Add `aria-expanded={isOpen}` and `aria-controls`.
  - Add `inert` or `hidden` (`aria-hidden` plus `invisible` when closed) on the collapsed panel.
  - Consider `{isOpen && <CheckoutSummary/>}`.
  - Remove `autoFocus` or give the id a prop suffix.

### UI-07 Long unbroken text (emails, names, addresses) can overflow at 360px
- Severity: minor
- Where:
  - `modules/order/components/order-details/index.tsx:38` (order email in a flex row with no `min-w-0` and no `break-words`)
  - `modules/order/components/shipping-details/index.tsx:15-40` (address lines, email)
  - `modules/cart/components/item/index.tsx:163` (h3 has `min-w-0` parent but no `break-words`)
  - `modules/account/components/overview/index.tsx:30` ("Hey, {firstName}" at `text-3xl`)
  - `modules/layout/components/cart-dropdown/index.tsx:147` (packing names)
- Evidence: `grep -rn "break-words|break-all|overflow-wrap" src` returns nothing across the whole storefront. The product card uses `line-clamp-1` (fine, but a long name is cut with no way to read it on the grid). Cart drawer and checkout preview use `truncate`, which is fine.
- Suggested fix: add `break-words min-w-0` (or `[overflow-wrap:anywhere]`) to the email, address, name and title elements above. Screenshot with a 60-char email and a 40-char unbroken product name.

### UI-08 No prefers-reduced-motion handling anywhere; hero autoplay has no pause control
- Severity: minor
- Where: global. `grep -rn "reduced-motion|motion-reduce|useReducedMotion" src` returns nothing.
- Evidence: hero autoplay (5.5s, 1s cross-fade), `animate-fade-in-top/right` on the product page, `galleryEnter`, side-menu link stagger, cart drawer 500-700ms slide, quick view scale, `framer-motion` on order complete, coming-soon and maintenance pages. The cart drawer also auto-opens on add (`cart-dropdown` effect), which is a surprise motion for some users.
- Suggested fix: add to `globals.css`:
  `@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}`
  Stop hero autoplay when the media query matches. Wrap framer-motion in `<MotionConfig reducedMotion="user">`.

### UI-09 Focus visibility: outline removed with no replacement in a few controls
- Severity: minor
- Where:
  - `layout/components/side-menu/index.tsx:78` hamburger (`focus:outline-none`, no ring)
  - `checkout/components/mobile-checkout-summary/index.tsx:22`
  - `common/components/radio/index.tsx:9` (`outline-none`, relies on a `group-focus` shadow)
  - `search/components/search-box/index.tsx:57,63`
  - `layout/templates/footer/index.tsx:130` (commented out, ignore)
  - `cart/components/cart-item-select/index.tsx:55`
- Evidence: only 4 `focus-visible` usages in the whole `src`. `Input` has `focus:ring-1` (OK). The product option buttons, qty buttons, cart/nav buttons and pills rely on the browser default outline (OK, preflight keeps it).
- Also (modal a11y): `quick-view-modal.tsx:132` is a bare `fixed` div with no `role="dialog"`, no `aria-modal`, no Escape handler and no focus trap; its close and arrow buttons have no `aria-label`. `image-gallery` lightbox close and prev/next buttons (`:221,:241,:307`) have no `aria-label`. `hero-carousel` dots have `aria-current={bool}` (renders "false"; should be `"true"` or `undefined`).
- Suggested fix: add `focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2` to those controls. Wrap quick view in headlessui `Dialog` (already a dependency, used by the cart drawer). Add `aria-label`s.

### UI-10 404 page: giant "404" background text is clipped at mobile widths; 404 height ignores promo bar
- Severity: minor
- Where: `src/app/not-found.tsx:14`, `src/app/[countryCode]/(main)/not-found.tsx:~12`
- Evidence: `text-[20rem]` is 320px per glyph, so "404" is roughly 600px or more wide. At 360/390 it is clipped by `overflow-hidden` (by design, but only the middle of "0" shows). (main) not-found uses `min-h-[calc(100vh-64px)]`, but the sticky header is 64px plus a roughly 28px promo bar (more if the promo wraps to two lines), so the page scrolls slightly.
- Suggested fix: `text-[9rem] sm:text-[14rem] md:text-[20rem]`, and use `min-h-[70vh]` or `dvh`. Two other not-founds (`cart/not-found.tsx`, `(checkout)/not-found.tsx`) use the old template look and the checkout one has `description: "Something went wrong"`. Align them with the (main) one.

### UI-11 Promo bar can wrap to 2 lines and push the sticky offsets
- Severity: minor (unverified, needs browser)
- Where: `modules/layout/templates/nav/index.tsx:27-38`, with sticky offsets `top-24` in `cart/templates/index.tsx:38`, `checkout/page.tsx:58`, `account-layout.tsx:34`, and `products/templates/index.tsx:39` (`lg:top-24`)
- Evidence: the header is `sticky top-0 z-50` holding the promo bar (CMS text, `text-[11px]`, `capitalize`, `py-1.5`) plus a 64px header. Sticky sidebars use a fixed `top-24` (96px). With a long CMS promo that wraps at 360 to 390px the header grows to 100px or more, which only matters on the lg sticky columns (promo wrapping is unlikely at lg), so the risk is low.
- Suggested fix: none needed unless a screenshot shows overlap. Optionally use a CSS var for header height.

### UI-12 Safe area and viewport units
- Severity: minor
- Where:
  - `layout.tsx` (no `viewport` export or `viewportFit: "cover"`; default is fine, and no fixed bottom bar exists, so safe-area impact is low)
  - `cart-dropdown/index.tsx:181` (bottom bar `pb-8`, OK)
  - `free-third/dialog.tsx:45` (`max-h-[88vh]` bottom sheet, no `pb-[env(safe-area-inset-bottom)]`)
  - many `min-h-screen` / `h-screen` / `100vh` uses (cart page, checkout, search modal, modal)
- Evidence: `grep safe-area|dvh` finds nothing. iOS Safari's collapsing toolbar makes `100vh` taller than the visible area, so bottom-anchored buttons (the free-third sheet) can sit behind the toolbar.
- Suggested fix: use `max-h-[88dvh]` and add `pb-[max(1rem,env(safe-area-inset-bottom))]` to the sheet. Replace `min-h-screen` with `min-h-dvh` (Tailwind 3.4+) where it matters.
- Note: `product-actions/mobile-actions.tsx` (z-[75] dialog) is never opened. `open` from `useToggleState` is unused and `show` is ignored, so there is no sticky mobile add-to-cart bar. The Add to Cart button is only in the normal flow, so on long product pages on mobile the CTA scrolls away. This is a product decision, not a bug. Dead code can be removed.

### UI-13 Image alt text and misc image details
- Severity: minor
- Where:
  - `product-card/index.tsx:203` alt is `` `${product.title} - ${idx}` `` (reads "Tote - 0")
  - `image-gallery/index.tsx:286,382` alt includes "image ${idx}" (loop indexes include clones, so "image 0" and "image N+1" duplicates)
  - `thumbnail/index.tsx:66` uses `sizes="(max-width: 576px) 280px..."` for 84-120px cart thumbs (over-fetch, low impact; `quality={50}` is good)
  - raw `<img>` in `side-menu:112`, `account/overview:76`, `free-third/dialog:59`, `bnpl-widget:52`, `order-card` (no `next/image`, no width/height on some; boxes have fixed sizes so CLS risk is low, BNPL logo uses `h-4` or `h-7` with auto width, which can shift a few px on load)
- Suggested fix: use alt like `${title}, photo ${n} of ${total}`. Add `width`/`height` to BNPL logos.

### UI-14 Home "all products" is 1 column on phones, store grid is 2 columns
- Severity: minor (consistency, unverified visually)
- Where: `home/components/all-products/index.tsx:68` (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) vs `store/.../infinite-product-grid:89` (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`)
- Evidence: the home grid shows full-width cards with `text-sm sm:text-xl` titles on mobile, while the store grid is 2-up. Likely intentional, but at 768 to 1023 the home grid is 2-col vs 3-col on store, and `lg` jumps to 3 where store is 4. Confirm with the owner.

---

## Checked and PASSED
- Dark mode: `tailwind.config.js` sets `darkMode: "class"`. The `@medusajs/ui-preset` plugin only emits dark tokens under `.dark` in that mode (verified in `ui-preset/dist/index.js:869-890`), and no `.dark` class or `dark:` utility is used anywhere. `<html data-mode="light">`. OS dark mode should not turn anything dark. Native controls could still follow the OS (`color-scheme` is not set); optional `:root{color-scheme:light}` hardening.
- Fonts: no webfonts and no `next/font`. The font stack is SF Pro then system (`tailwind.config.js` fontFamily), so there is no FOUT or CLS from fonts. Rendering will differ by platform (Android uses Roboto, Windows uses Segoe), which matters for screenshots.
- Hero, product gallery and cards use fixed aspect boxes (`aspect-[3/4]`, `aspect-[4/5]`, `aspect-square`), so CLS from images is low. `next/image` is used with `fill` plus `sizes` on the main surfaces. The nav logo has width and height.
- Global horizontal overflow: the content container is `max-w-[1440px] w-full px-6`. Cart and checkout flex columns use `min-w-0`. Gallery full-bleed negative margins (`-mx-6 w-[calc(100%+3rem)]`) are balanced by the parent `px-6` at mobile and `md:px-16` at md. Unverified (needs browser) at 360 for page-level scroll.
- z-index order is consistent: header `z-50` sticky; cart drawer (headlessui portal) `z-50` and later in DOM so it sits above the header; side menu `z-[100]/[101]`; free-third `z-[100]`; search `z-[75]`; lightbox `z-99999` through a portal. The side menu drawer is inside the sticky header's stacking context, but it is full-viewport fixed so it still covers the page.
- Hamburger menu and cart drawer: headlessui gives focus trap, Esc and aria. Cart drawer is `w-screen` on mobile and 480px on `sm+`. Drawer item rows use `min-w-0` and `truncate`.
- Cart page and empty states: empty cart (`EmptyCartMessage`, drawer empty state, account "No orders yet") all have an icon, text and a CTA. Cart/summary uses `p-4 sm:p-6`, and the checkout button is 60px tall.
- Error pages: `(main)/error.tsx` renders a shared `ErrorFallback` with a retry button. Root and (main) not-found have heading, copy and two CTAs.
- Loading states: `loading.tsx` exists for cart, account and order confirmed. Suspense skeletons for related products, product grid (infinite scroll) and product actions.
- Forms: `Input` has a visible label, `aria-invalid`, and inline `role="alert"` errors. Autofill styling is handled.
- Hero: the first slide has `priority`, slides have `aria-hidden` and `tabIndex` handling, there is an `sr-only` h1, and arrows/dots have `aria-label`s.

## Pages the lead should screenshot (widths 360, 390, 768, 1024, 1440 unless noted)
1. `/lk` (home): hero crop per breakpoint (360/390 portrait, 768 tablet, 1024+), promo bar wrap, dot/arrow positions, popular slider (88% cards) and "all products" grid column count, trust strip and footer. Check Network tab for UI-04 preloads (390 only).
2. `/lk/store`: 2-col grid at 360 (badges overlapping in a ~150px card, BNPL widget, "Options"/"Add to Cart" button text fit), sort dropdown, infinite-scroll skeletons, 1024 with 3 vs 4 cols.
3. `/lk/categories/<empty or fake handle>` and `/lk/collections/<handle>`: confirm blank state (UI-05) and the 404 behaviour.
4. `/lk/products/<long-name product>` at 360/390: gallery swipe and tap to fullscreen, fullscreen close button and counter (safe area), option buttons wrap, BNPL widget, Add to Cart (no sticky bar), tabs accordion, related products. Add a variant with a very long name.
5. Cart drawer (add an item, so it auto-opens) at 360: qty pill and delete tap size, price stack, packing row, empty state centring, bottom button vs the iOS toolbar.
6. `/lk/cart` at 360/390 with 3+ items and a long product name: item card layout, qty/delete, summary, sign-in prompt, free-third dialog (Buy 2 Get 1) bottom sheet, `blocked` stock message.
7. `/lk/checkout` at 360/390/768/1024/1440: mobile summary toggle (UI-06), address form field widths and iOS zoom on focus (UI-02, real device or devtools iPhone), country/province selects, shipping and payment option rows (long labels, test card hint), Packing block, promo input, review/pay button, no horizontal scroll. Try a 60-char email and 40-char address line.
8. `/lk/checkout/onepay/return`, `/koko/return`, `/mintpay/return`, `/koko/cancel`, `/mintpay/fail`: loading, success and failure states at 360 (these are outside `(main)`, so no error boundary: UI-01).
9. `/lk/order/confirmed/<id>` at 360 with long email: animation, email chip overflow (UI-07), item rows, shipping details, Print Invoice button (print view too).
10. `/lk/account` (logged out): login/register split layout at 360 vs 1024 (`lg:grid-cols-2`), password eye button tap size, input zoom. Logged in: overview stat pills, quick links 2-col at 360, mobile menu, `/account/orders` (empty and with orders), `/account/addresses` (add/edit modals at 360, 144px country-code grid), `/account/profile`.
11. `/lk/this-page-does-not-exist` and a product handle that does not exist: 404 at 360/390 (UI-10), and the Nav and Footer around it.
12. Side menu (hamburger) at 360 and 390: width, link tap size, close button size, backdrop.
13. `/lk/about`, `/contact`, `/faq`, `/shipping`, `/returns`, `/refunds`, `/privacy`, `/terms`: long copy and tables at 360 (not code-reviewed in depth; check for horizontal scroll).
14. Emulate OS dark mode (devtools "prefers-color-scheme: dark") on home, checkout and account to confirm nothing turns dark.
15. Emulate `prefers-reduced-motion: reduce` on home to confirm hero autoplay and fades still run (UI-08).
16. Keyboard pass at 1440: Tab through header, hero, product card, cart drawer, checkout form. Look for invisible focus (hamburger, mobile summary toggle, radio) and Esc behaviour in quick view (UI-09).
17. A few devtools toggles: throttle to Slow 4G and watch for CLS and blank states on `/lk` and a product page. Force an error (block the API request) on `/lk/checkout` to see the default Next error screen (UI-01).

## Notes for the lead (not issues)
- `text-bold` appears in 96 places in src. It is not defined in `tailwind.config.js` and my grep of the ui-preset for a `bold` colour key found nothing, so it may be a no-op class (text inherits the default colour). Unverified (needs browser or a Tailwind build check); if intended, define `colors.bold` in the config.
- `src/app/[countryCode]/(main)/results/[query]/page.tsx` reads `params.query` and `searchParams` synchronously. In Next 15 these are Promises (sync access works with a dev warning for now). Low risk since search is feature-flagged.
- No secrets were found in the files reviewed. A Facebook domain-verification token sits in `src/app/layout.tsx:70` (public by design, not a secret).
