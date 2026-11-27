# V2 FEATURES QA (CMS, add-ons, packing, lightbox, free-third)

Code-only review (no browser/network). No blockers found: add-on pricing is server-side and tamper-resistant. Main gaps: promo bar disappears on first V2 deploy, ops/customer emails and admin order view do not show add-ons or which packing was chosen, add-on lines freeze their price.

STATUS: PASS WITH ISSUES

Counts: blocker 0, major 4, minor 12

---

### V2F-01 Promo bar disappears on V2 launch until an admin saves it
- Severity: major
- Where: backend/src/api/store/cms/route.ts:125-127, storefront/src/lib/data/cms.ts:45, storefront/src/modules/layout/templates/nav/index.tsx:21-24
- Evidence: with no `promo_bar` row in `cms_setting` the API returns `promo_bar: null`. The storefront treats `null` as "switched off" and `undefined` (CMS unreachable) as "show built-in". The live site (contabo) hardcodes "5% Off for all Card Payments". On live DB (fresh migration) there is no row, so the bar vanishes.
- Expected: the existing bar keeps showing until an admin changes it. Actual: no bar at all.
- Fix: in the route, return `promo_bar: row ? (active&&text ? {...} : null) : undefined` (omit the key when no row), or seed the row in the migration (text "5% Off for all Card Payments", is_active true). Also add to the launch checklist: run CMS + addons migrations on live DB.

### V2F-02 Customer emails do not show add-ons or which packing was chosen
- Severity: major
- Where: backend/src/modules/email-notifications/templates/order-placed.tsx:250-255
- Evidence: the template prints `item.product_title ?? item.title` and `item.title` only. `metadata.addons` and `metadata.packing_name` are never read (no `metadata` reference in the template). A packing line renders as "Packing / Packing" with a price; an add-on bag shows a higher price with no explanation.
- Fix: in the item row render `item.metadata?.packing ? ("Packing: " + item.metadata.packing_name) : product_title`, and list `item.metadata.addons[]` as "+ name" lines. Make sure the subscriber fetches `items.metadata` (it uses `items.*`, so it is included).

### V2F-03 Admin order view shows no add-ons / packing choice (fulfilment cannot see them)
- Severity: major
- Where: backend/src/admin/widgets (only order-payment-method, product-extra-details, variant-precise-dimensions); no order widget for line metadata
- Evidence: grep for `addons|packing` under backend/src/admin finds only routes/addons/page.tsx. Native Medusa order page shows line title/variant only, so a packing line is just "Packing", and the add-ons (laptop pocket, key tag...) the packer must sew/attach are invisible. The Cardle Ops webhook only sends the order id, so this depends on Ops reading metadata (not checked here).
- Fix: add an `order.details.side.after` (or `.after`) widget listing for each item `metadata.addons` and `metadata.packing_name`. Confirm Cardle Ops renders them too.

### V2F-04 Lines with add-ons are frozen at a custom price (sales/price changes never apply)
- Severity: major
- Where: backend/src/api/store/carts/[id]/addon-items/route.ts:57-58; storefront/src/lib/data/cart.ts:194-226 (repriceCart)
- Evidence: `item.unit_price = base + extra` makes Medusa mark the line `is_custom_price = true`. `repriceCart` ("update cart to refresh every line") skips custom-price lines, so a sale ending/starting or a base price change is not applied to add-on bags, and `compare_at_unit_price` (strike-through) is never set. Add-on price changes in admin also do not reach carts that already hold the line. Also `base_price` in metadata is stored but never used.
- Impact: customer can check out an old price after a price rise (revenue loss) or miss a sale price.
- Fix (small): at checkout/reprice time, for lines with `metadata.addons`, recompute `base (calculated_price) + sum(current add-on prices)` and call updateLineItemInCart with that unit_price; or validate in a cart-complete hook. At minimum document that carts keep the added price.

### V2F-05 Same bag + same add-ons may not merge into one line (unstable order)
- Severity: minor
- Where: addon-items/route.ts:61
- Evidence: `chosen.sort(by sort_order)` with equal sort_order gives DB-dependent order; Medusa merges lines only when metadata is deep-equal, so identical choices can become two lines. Fix: sort by `sort_order` then `id`.

### V2F-06 /store/carts/:id/addon-items has no rate limit and weak input checks
- Severity: minor
- Where: addon-items/route.ts:14-16; api/middlewares.ts (no matcher)
- Evidence: addon_ids not capped (any length goes into two queries); quantity clamped to 1-50 but not added to the existing line's cap. Cart id acts as the secret, ok. Fix: slice addon_ids to 10 and add a rateLimit matcher like `/store/carts/:id/complete`.

### V2F-07 Packing replace is not atomic; stray packing lines possible
- Severity: minor
- Where: packing/route.ts:110-128
- Evidence: old lines are deleted, then new lines added in a second workflow. If the add fails the customer silently loses packing (cart metadata still says old ids until the end). Concurrent calls (rapid toggles from two tabs) can duplicate lines. The UI serializes calls in one tab (`running` ref) so normal use is fine. Also packing lines remain charged if the admin later switches packing off, and remain in a cart whose bags were all removed (cart page shows "empty" but cart still holds the line and total).
- Fix: on bag removal / packing disabled, clean `metadata.packing` lines; wrap in a single workflow or re-check after.

### V2F-08 Free "default" packing is not an actual selection
- Severity: minor
- Where: store/packing/route.ts:152-156, storefront packing/index.tsx:108
- Evidence: the default option is excluded from `options` and shown only as the text "Standard packing included". That matches "always included, free", but nothing is stored on the order saying standard packing was chosen, and if no extras exist `enabled` is false (whole block hidden) even when a default is configured. Acceptable; confirm intent.

### V2F-09 Packing/add-on prices shown can lag the charged price by about 1-2 minutes
- Severity: minor
- Where: lib/data/addons.ts:27,43 (revalidate 60) + route Cache-Control `max-age=30, s-maxage=60`
- Evidence: UI uses cached price, backend charges the live catalog price. After an admin price edit customers can see the old price for up to ~2 min and be charged the new one (totals shown in cart/checkout are server values, so only the picker label is stale). Fine for launch; note for ops.

### V2F-10 Order emails/invoice: invoice OK, order confirmation OK
- Severity: minor (informational, PASS items below)
- print-invoice shows packing title and `md.addons` (invoice:189-215). Order confirmation uses LineItemAddons.

### V2F-11 Lightbox: no focus trap, no focus restore, iOS scroll lock weak, no arrows
- Severity: minor
- Where: storefront/src/modules/common/components/image-lightbox/index.tsx:24-34
- Evidence: Esc, close button (aria-label) and backdrop click work. Missing: focus is not moved into the dialog on open nor returned to the trigger on close, Tab can reach the page behind; `document.body.style.overflow = "hidden"` does not stop background scroll on iOS Safari; no arrow keys (only one image per lightbox so arrows are N/A). `onClose` is in the effect deps and callers pass inline arrows, so the effect re-subscribes every render (works, but wasteful). If opened inside another headlessui Dialog, Esc may close both (unverified, needs browser).
- Fix: focus the close button on mount, store `document.activeElement` and restore it, add Tab trap, use `position:fixed` or `overscroll-behavior: contain` on the overlay, keep onClose in a ref.

### V2F-12 CMS cache: changes appear in 60-120 s, no on-demand invalidation
- Severity: minor
- Where: storefront/src/lib/data/cms.ts:29,41; store/cms/route.ts:129
- Evidence: Next data cache `revalidate: 60` plus backend `max-age=30, s-maxage=60` (and any CDN in front of api.cardle.lk) stack, so a save can take up to about 2 minutes. Admin text says "about a minute". Admin saves do not call any revalidate hook. Acceptable; adjust admin copy ("up to 2 minutes") or lower revalidate.

### V2F-13 CMS failure path flips the promo bar and hero to defaults
- Severity: minor
- Where: lib/data/cms.ts:46-48
- Evidence: on timeout (4 s, 1 retry) every CMS block falls back to built-in content, including re-showing the old promo text even if admin turned it off. Short-lived (errors are not cached). Fine.

### V2F-14 CMS fields: no validation of image URL / link / lengths on the backend
- Severity: minor
- Where: backend/src/modules/cms/fields.ts:80-102
- Evidence: hex colour, placement, dates, sort_order are validated; `cta_href`, image URLs, title/body have no length cap or scheme check (promo text is capped at 140/300, banners are not). Admin-only, so risk is low. Banner can be created via API without `image_desktop` (UI blocks it; storefront silently ignores such hero/page banners and shows the fallback). Fix: cap lengths, restrict image URLs to https and cta_href to `/` paths or http(s).

### V2F-15 Hero carousel preloads all three breakpoints of slide 1
- Severity: minor
- Where: hero-carousel.tsx:163-186
- Evidence: `priority={i===0}` is set on the mobile, tablet and desktop `<Image>` of slide 1, so Next emits three preload hints; a phone downloads/preloads the desktop image too. Use `<picture>` or only set priority via CSS-matching (or `fetchPriority` on the right one) to protect LCP/data.

### V2F-16 Minor CMS polish
- Severity: minor
- (a) wide-banner/index.tsx:294 uses `max-width: 768px` while the rest use 767/1023 (768px viewport gets mobile image); no tablet image for creatives. (b) page-banner.tsx:184 non-category banners hide `body` unless eyebrow/title/cta exists. (c) CtaLink only treats `http(s)://` as external; `mailto:`/`tel:` become `/lk/mailto:...` (broken). (d) category banner: button label without link is dropped silently.
- Admin preview does not show tablet image.

### V2F-17 Free-third dialog edge cases
- Severity: minor
- Where: cart/components/free-third/options.ts, dialog.tsx, summary.tsx
- Evidence: (a) dialog only when bag qty is exactly 2 and the `BUY2GET1` promo is active (offers route checks code, status, campaign dates, cached 60 s); it re-opens on every "Check out" click while the cart still has 2 bags (no "already skipped" memory). (b) If every tote costs more than the cheapest bag in the cart (`cap`), options are empty and no dialog shows even though the promo will apply, so the customer is not told they get a free bag. (c) `cap` uses line `unit_price`, which includes add-on prices, so a cheap bag with add-ons raises the cap; whether the promo frees add-ons with the cheapest line depends on the promotion config (unverified, test: 2 bags, cheapest with add-ons, add free third, check discount). (d) after "Add free" the dialog closes and the customer must click Check out again (acceptable). (e) promo detection is hard-coded to code `BUY2GET1`; renaming the promo silently disables the dialog.

---

## What was checked and PASSED
- Add-on price is computed on the server (`base + sum(add-on prices)` from the catalog, region-priced); the browser sends only ids, so price tampering is impossible. Disallowed/inactive/unknown add-on for the product is rejected (links checked per product, count must match). Standard `/store/carts/:id/line-items` cannot set `unit_price`.
- Add-on price counted once: custom price set at creation; quantity changes keep the unit price; merge of identical lines sums quantity only.
- Add-ons only shown where `addon_product` links exist (`/store/addons?product_id`, active only); picker returns null for empty list; shown in cart drawer, cart page, checkout preview, order confirmation and invoice via LineItemAddons; add-on total shown on PDP; AddToCart analytics includes add-ons.
- Packing: server validates ids (active, non-default), builds one line per paid option at catalog price (`unit_price` from DB), dedupes ids (max 10), disabled when switched off; selection persisted in `cart.metadata.packing_ids` and restored on reload; optimistic store + serialized flush handles rapid toggles; packing lines hidden from product lists/cart counts/free-third counts; hidden product `internal-packing` excluded from storefront lists (metadata.internal) and the sitemap/feeds? Meta/Google feed (backend/src/lib/meta-catalog-feed.ts) filters only `status: published`, so the internal "Packing" product (price 0) may be exported to Meta/Google feeds. Marked as **unverified, worth a check** (add `metadata.internal` filter; sitemap also lists it via `fields: handle` with no filter).
- CMS XSS: all CMS text rendered through React (escaped); `text_color` validated as `#RRGGBB` server-side (no CSS injection); `javascript:` links cannot execute because non-http hrefs are forced into `/<country>/<href>` (becomes a relative path); external links use `rel=noopener noreferrer`. Admin routes sit under /admin (authenticated). Uploads: client checks `image/*`, minio keys sanitized to ASCII + ulid, public-read bucket; SVG served only through `<img>` (no script execution).
- Empty states: no hero -> built-in slides; no page banner -> original fallback; no creative -> built-in wide banner text; missing mobile/tablet falls back tablet -> desktop (hero) or desktop (page); missing text hides the block; empty image skipped.
- Sizing: single HERO_SIZE (3:4 < 768, 4:3 768-1023, 62vh desktop) used by hero and page banners; admin hints match (1080x1440, 1600x1200).
- Scheduling: store route filters `is_active` and starts/ends window; admin list shows Active/Scheduled/Expired.
- Free-third: fails closed (any error = no dialog), excludes packing lines, only offers affordable totes in stock.

## Notes for the lead (unverified, needs browser/DB)
- Whether `cms.listBanners` without `take` returns all rows (no default limit found in build-query; likely fine for a handful of banners).
- minio-file `upload()` treats string content matching `^[A-Za-z0-9+/]+=*$` as base64; correct only if Medusa passes base64 (it does in 2.13 upload route; a binary string would fail the regex anyway). Confirm one real upload on dev.
- Run migrations for `cms` (2 migrations) and `addons` on the live DB before deploying; seed promo_bar (V2F-01).
