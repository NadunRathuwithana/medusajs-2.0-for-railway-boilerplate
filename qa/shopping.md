# QA report: SHOPPING FLOW (prefix SHOP-)

Code review of storefront shopping flow (home, store, collections, categories, PDP, cart drawer and page, region, pricing, stock, free-third promo, emails). No browser or network access, so runtime behaviour is marked "unverified (needs browser)" where relevant. Found 0 blockers, 6 majors, 11 minors; the main risks are the Buy 2 Get 1 target item, silent add-to-cart failures, and stale stock and prices.

STATUS: PASS WITH ISSUES

Counts: blocker 0 / major 6 / minor 11

---

### SHOP-01 Buy 2 Get 1 may free the MOST expensive line, not the cheapest
- Severity: major
- Where: storefront/src/modules/cart/components/free-third/options.ts:34-40 (assumption); backend promo engine backend/node_modules/@medusajs/promotion/dist/utils/compute-actions/buy-get.js:8-9 and :226-231
- Evidence: options.ts comment says "The promo frees the CHEAPEST bag, so only offer totes that cost no more than the cheapest one already in the cart". In Medusa 2.13.6 `filterItemsByPromotionRules` sorts target items with `sortByPrice` = `lt(a.subtotal, b.subtotal) ? 1 : -1` (descending by LINE subtotal) and the comment reads "prioritize most valuable item". The free quantity is taken from the first target line in that order.
- Expected vs actual: customer picks a cheap tote "free" in the dialog, but the engine discounts the highest-subtotal line (a 2-qty line of a 2,960 bag outranks a 1-qty line of a 3,500 bag). Cost to the shop is higher than intended. The "cap" logic in the dialog gives false assurance. Depends on how BUY2GET1 is configured on dev (target rules, max quantity), so unverified (needs a real cart test).
- Suggested fix: test on dev with cart A(2960) x1 + B(3500) x1 + free pick, and cart A x2 + B x1. If the priciest is freed, either restrict the promo with target rules, or rewrite the copy and cap logic to match actual behaviour. Do not show a "free" price line-through that implies a different item is free.

### SHOP-02 Add to cart failures are silent or leave the UI stuck
- Severity: major
- Where: product-actions/index.tsx:192-223 (`try/finally`, no catch); product-card/index.tsx:63-72 (same); product-card/quick-view-modal.tsx:79-85
- Evidence: `addToCart` calls `medusaError(error)` which throws (out of stock, no price, backend 5xx, region missing). In PDP and card the `try { await addToCart } finally { setIsAdding(false) }` has no catch, so the user sees nothing and an unhandled rejection is logged. In QuickViewModal `setIsAdding(false)` and `handleClose()` come after the await with no try/finally, so on a throw the button stays on "Adding..." forever and the modal never closes. Next also masks server action error messages in production, so even a caught `err.message` would be generic.
- Expected vs actual: show an inline "Could not add, please try again / sold out" message and recover the button. Currently the customer just sees nothing happen (lost sale on a race with stock or a backend blip).
- Suggested fix: wrap each in try/catch/finally, set an `error` state. Better, make `addToCart` return `{ error?: string }` like `initiatePaymentSession` does, instead of throwing, so the message survives production masking.

### SHOP-03 Cart drawer quantity input never resyncs with the server after the first edit
- Severity: major
- Where: storefront/src/modules/layout/components/cart-dropdown/index.tsx:293-322 (`SidebarCartItem`)
- Evidence: `debounceRef.current = setTimeout(() => { startTransition(...) }, 500)` never sets `debounceRef.current = null` inside the timeout (compare cart/components/item/index.tsx:50 which does). The sync effect is `if (!isPending && !debounceRef.current) setOptimisticQty(item.quantity)`, so after the first click it is permanently false.
- Expected vs actual: after one qty change in the drawer, optimisticQty is never overwritten by server state. If the server clamps/rejects, if the same line is changed on the cart page, or after a reprice, the drawer shows a qty different from the real cart. The error branch reverts to `item.quantity` but there is no visible error either way (qty silently snaps back with no message).
- Suggested fix: set `debounceRef.current = null` at the top of the timeout callback (as in the cart page item), and add an error line like the cart page has.

### SHOP-04 Stale stock and prices: product data cached 300s, no backend invalidation
- Severity: major
- Where: storefront/src/lib/data/products.ts:36 (`PRODUCTS_REVALIDATE_SECONDS = 300`), getProductsById/getProductByHandle/getProductsList; lib/data/cart.ts:248-280 (`enrichLineItems`); no `revalidateTag`/webhook in backend/src (grep returned none)
- Evidence: PDP, cards, free-third options, and cart enrichment all read `+variants.inventory_quantity` and `calculated_price` through the Next data cache for 5 minutes, tagged "products", and only `updateRegion` ever revalidates that tag (and that action is unused, see SHOP-12).
- Expected vs actual:
  - The last unit sells but PDP and cards still show "Add to Cart" for up to 5 min (checkout re-checks stock live in `assertCartInStock`, so the customer finds out late, at payment).
  - The cart page `stock_issue` (cart.ts:226-236) uses the cached data, so a restocked item can keep checkout blocked, or a sold out item can stay unblocked, for up to 5 min.
  - Drawer/cart-line prices come from the cached variant `calculated_price` (get-product-price.ts:29, `getPricesForItem` only uses `unit_price` for custom lines) while totals come from live cart data. During a price/sale change the line price and the Subtotal can disagree.
- Suggested fix: lower stock-bearing reads to 30-60s, or add a backend subscriber on product/inventory/price changes that POSTs a secret-protected storefront `/api/revalidate?tag=products`. For cart lines, display `item.unit_price`/`item.total` (already on the cart) instead of the cached catalog price.

### SHOP-05 Transient region/backend failure renders a 404 (SEO risk) instead of an error
- Severity: major
- Where: storefront/src/lib/data/regions.ts:36-62 (`getRegion` catches everything and returns null); app/[countryCode]/(main)/products/[handle]/page.tsx (`if (!region) notFound()`), same in generateMetadata
- Evidence: `listRegions()` is wrapped in `withRetry(...).catch(medusaError)`, which throws; `getRegion` swallows it with `catch (e) { return null }`; PDP then calls `notFound()`. Middleware has the same "backend down" tolerance, so the request reaches the page.
- Expected vs actual: a 5-10s backend blip returns HTTP 404 to Googlebot and customers on every product page. Pages are dynamic (layout reads cookies), so the 404 is not cached, but crawlers will still record it. Also the module-level `regionMap` (regions.ts:30) is never invalidated, so a region change needs a restart.
- Suggested fix: let `getRegion` rethrow (or return a distinct error) so error.tsx shows a 5xx; only `notFound()` when the region list loaded and the code is missing.

### SHOP-06 Nav cart button can take down every page when the products endpoint blips
- Severity: major (unverified, needs browser/fault injection)
- Where: storefront/src/modules/layout/components/cart-button/index.tsx:4-23; nav/index.tsx:101-114
- Evidence: `CartButton` awaits `enrichLineItems` -> `getProductsById` -> `withRetry` which throws after 3 attempts. `Suspense` does not catch errors. Only visitors with a non-empty cart are affected, but those are exactly the buyers.
- Expected vs actual: header cart should degrade (show count from raw cart items) instead of throwing the whole layout into error.tsx.
- Suggested fix: wrap the enrich step in try/catch and fall back to `cart.items` unenriched.

### SHOP-07 Collections page sort label is wrong (and collection route uses sync params)
- Severity: major (customer-visible mismatch), small fix
- Where: modules/collections/templates/index.tsx:27 (`const sort = sortBy || "created_at"`); modules/store/components/sort-dropdown/index.tsx:9-14, 34
- Evidence: dropdown options are most_relevant / best_selling / price_asc / price_desc only. Collections default to `created_at`, which is not in the list, so `activeOption` falls back to `sortOptions[1]` = "Best selling". Page is actually newest-first.
- Expected vs actual: label says "Best selling" while order is newest. The same file set also reads `params.handle` and `searchParams` synchronously (collections/[handle]/page.tsx and categories/[...category]/page.tsx); that works in Next 15 only through the deprecated compat shim (the store page was already fixed for this).
- Suggested fix: default to "best_selling" on collections (like store/categories) or add a "Newest" option; await `params`/`searchParams`.

### SHOP-08 "Featured"/"New Arrivals" home rails show random products if the collection is missing
- Severity: minor
- Where: modules/home/components/popular-products/index.tsx:20-35
- Evidence: `collectionId` stays undefined when `getCollectionByHandle` finds nothing, so `queryParams` has no `collection_id` and the rail lists the 10 newest of all products under the "Featured"/"New Arrivals" title (and `isNew` badges them "New").
- Suggested fix: if `collectionHandle` was given and no collection is found, `return null`.

### SHOP-09 Hidden "Packing" product is reachable and indexed
- Severity: minor
- Where: backend/src/modules/addons/packing-product.ts:33-36 (handle internal-packing, status published); storefront/src/app/sitemap.ts:13-22; Meilisearch config backend/medusa-config.js:284-300; storefront list filter only in lib/data/products.ts:120
- Evidence: the exclusion `metadata.internal` is applied only in `getProductsList`. The sitemap fetches all products (limit 500, no filter), the search index has no filter, and `/lk/products/internal-packing` renders via `getProductByHandle`. On that page the price skeleton shows forever (price 0, see SHOP-11) but the Add to Cart button is enabled, and adding it puts a LKR 0 "Packing" line in the cart as a product (no `metadata.packing`, so it is not hidden).
- Suggested fix: filter `metadata.internal` in sitemap, `getProductByHandle` (404), and the Meili/indexing step. Meta catalog feed skips it only because it has no image (fragile).

### SHOP-10 Rounding and formatting inconsistencies for .50 / fractional LKR
- Severity: minor
- Where: lib/util/money.ts:11-27 (default 2 decimals, `en-US`); modules/products/components/addon-picker/index.tsx:46, product-actions/index.tsx:292, line-item-addons/index.tsx:30, checkout/components/packing/index.tsx:60, layout/components/cart-dropdown/index.tsx:149 (all `maximumFractionDigits: 0`); backend/src/modules/email-notifications/templates/order-placed.tsx:23-25 (`LKR 2960.50`); order/components/print-invoice/index.tsx:18 (`en-LK`, always 2dp)
- Evidence (ran Intl in Node 22): `LKR 2,960.50` with defaults, but `maximumFractionDigits:0` gives `LKR 2,961` and `2961.5 -> LKR 2,962`. So an add-on or packing priced 2960.50 shows as 2,961 in the picker and drawer but 2,960.50 in totals. Email prints no thousands separator and no cents-hiding (`LKR 2960.50`), site prints `LKR 2,960.50`, invoice prints `LKR 2,960.50` always with `.00`. The card CARD_5 5% discount produces fractional totals, so the order page, email and Onepay amount (`toFixed(2)`) all show cents while product cards show whole rupees for whole prices (e.g. `LKR 2,960.00`).
- Expected vs actual: one consistent rule. Backend `num()` in addons/lib.ts:8 already stores 2dp so cents are legal.
- Suggested fix: pick one format in `convertToLocale` (e.g. hide `.00` only when integer: `minimumFractionDigits: Number.isInteger(amount) ? 0 : 2`), remove the `maximumFractionDigits: 0` overrides, and use the same helper in the email template (with thousands separators).

### SHOP-11 Products without a price: PDP shows endless skeleton and live Add to Cart
- Severity: minor
- Where: modules/products/components/product-price/index.tsx:18-20; product-actions/index.tsx:300; lib/util/get-product-price.ts:5-7
- Evidence: `getPricesForVariant` returns null when `calculated_amount` is falsy (also for a legitimate 0). `ProductPrice` then renders a pulsing grey box forever. The product card correctly shows "Coming soon", the PDP does not. The Add button only checks `inStock` and `selectedVariant`, so it stays clickable and the backend then rejects (see SHOP-02 for the missing error). Sorting (sort-products.ts:23-26) treats missing prices as `0`, so unpriced products sort first in "Price, low to high".
- Suggested fix: PDP "Coming soon / Unavailable" state and disable Add; use `Infinity` for missing prices in sort.

### SHOP-12 Region handling for non-LK visitors
- Severity: minor
- Where: storefront/src/middleware.ts:96-127,148-155; lib/data/cart.ts:update region action `updateRegion`; layout/components/country-select
- Evidence: only region "lk" exists. Geo detection relies on `x-vercel-ip-country`, which does not exist on Coolify/Contabo, so everyone gets `/lk` (correct for LKR-only shop). `/us/...` style URLs are not in the region map, so they are redirected to `/lk/us/...` and 404 (not to `/lk/...`). `urlHasCountryCode` uses `.includes(countryCode)` on the first segment, which would false-match for a future region code like "in" (e.g. "login"). `updateRegion` and the CountrySelect component are not rendered anywhere, so there is no region switcher (fine for now).
- Expected vs actual: acceptable for launch. Foreign visitors see LKR prices only and can proceed to checkout (shipping scope is covered by the checkout report).
- Suggested fix: strip a 2-letter unknown first segment before redirecting; compare `=== countryCode` rather than `.includes`.

### SHOP-13 Free-third offer only shows from the cart page and only at exactly 2 bags
- Severity: minor
- Where: cart/components/free-third/options.ts:32-33; layout/components/cart-dropdown/index.tsx (Check out button goes straight to /checkout)
- Evidence: `bagQty(cart) !== 2` returns []. Customers with 4 bags (eligible for another free one) or those who click "Check out" in the drawer never see the upsell. The cap uses `i.unit_price`, which includes add-on prices for add-on lines, so the cap can be inflated. The dialog is also skipped silently if `/store/offers` fails.
- Suggested fix: use `bagQty % 3 === 2`; route the drawer button through the same dialog or send it to /cart when the offer applies.

### SHOP-14 Cart quantity optimistic price is wrong while a discount is active
- Severity: minor
- Where: cart/components/item/index.tsx:67-70; cart-dropdown/index.tsx:325-333
- Evidence: cart page scales `item.total / item.quantity * optimisticQty`, which averages the discount per unit (a free item's discount gets spread), so for 500ms to a few seconds the line total is off until the server responds. In the drawer `adjustmentsSum` is the full adjustment for the old qty subtracted from `price * optimisticQty`, so a qty bump on a discounted line shows a wrong (too low/high) price momentarily. Both settle after revalidation.
- Suggested fix: show a pending state (dim price) until the transition finishes, rather than computed numbers.

### SHOP-15 Cart page hides packing lines but still counts them; drawer and page label totals differently
- Severity: minor
- Where: cart/templates/index.tsx:30-31; common/components/cart-totals/index.tsx:34; layout/components/cart-dropdown/index.tsx:52
- Evidence: the cart page filters out `metadata.packing` lines from the list but `item_subtotal` includes them, so a returning customer with a leftover paid packing option sees a subtotal higher than their visible items with no explanation (the drawer does show a "Packing:" row). The drawer "Subtotal" is `item_subtotal - discount_total`, while the cart page "Subtotal" is `item_subtotal` with a separate Discount row, so the two screens show different numbers under the same label. Also `shipping_total ? fmt : "Calculated at next step"` shows that text for a legitimately 0 shipping.
- Suggested fix: show a Packing row on the cart page, and use one subtotal definition.

### SHOP-16 `getPercentageDiff` / `LineItemPrice` can produce NaN
- Severity: minor
- Where: lib/util/get-precentage-diff.ts:1-6; common/components/line-item-price/index.tsx:23-27
- Evidence: original 0 gives NaN%; `LineItemPrice` multiplies `original_price_number` (undefined when `getPricesForItem` returns null, e.g. variant missing) by quantity, producing `LKR NaN`. The component is currently not imported anywhere (grep), so dead code today.
- Suggested fix: delete the component or guard with `?? 0`.

### SHOP-17 Pagination, search and misc robustness
- Severity: minor
- Where: lib/data/products.ts:157-184 (`getProductsListWithSort`); app/[countryCode]/(main)/results/[query]/page.tsx; modules/search/actions.ts; lib/search-client.ts; nav/index.tsx:84
- Evidence:
  - Sorting fetches only the first 100 products; anything beyond 100 is never listed in store/category pages. `?page=abc` gives NaN offsets (empty grid) and `page=0` gives a negative slice (empty grid).
  - Search is gated by `NEXT_PUBLIC_FEATURE_SEARCH_ENABLED` (so likely hidden). If enabled, `search()` has no try/catch: Meilisearch down gives an unhandled error page. Defaults point to `127.0.0.1:7700` / `test_key`. Results page does `decodeURI(query)` which throws on a malformed `%`. The Meili index has no stock/price filtering and includes the hidden packing product (SHOP-09). No search filters exist besides sort (price and sort only; no category facets in the UI).
  - Category/collection filters: only sort is offered; no filtering by colour/size.
- Suggested fix: clamp page (`Math.max(1, Number(page) || 1)`), try/catch the search call, `try { decodeURIComponent }`.

### SHOP-18 Stock state UX gaps (low stock, made-to-order)
- Severity: minor
- Where: product-actions/index.tsx:305-309; lib/util/get-product-price.ts:84-100
- Evidence: only two states exist: "Out of stock" (button) and the cart's `only_N` / `sold_out` messages. There is no "Only N left" on PDP or card, and no "made to order / ships in X days" text for backorder variants even though all SEO copy says "made to order". `OptionSelect` does not mark unavailable variants, so a customer picks a sold-out colour and only then sees "Out of stock". Variant combos that do not exist show "Select variant" even after every option is chosen.
- Suggested fix: add a low-stock badge (`inventory_quantity <= 3`), a made-to-order note when `allow_backorder`, and strike through sold-out option values.

### SHOP-19 Emails: line price ignores promo adjustments; packing lines listed as items
- Severity: minor
- Where: backend/src/modules/email-notifications/templates/order-placed.tsx:259 and 50-76
- Evidence: line total is `unit_price * quantity` with no adjustments, so the free third tote shows its full price on the line, with the saving only in a separate Discount row (consistent total but confusing). The packing helper line (`metadata.packing`) is rendered like any product (title "Packing"). Discount resolution has 3 fallbacks that can double-count if `discount_total` is 0 while item adjustments exist alongside a subtotal/item_total gap (unlikely). Not verifiable without a rendered email (unverified, needs a real order email; dev currently sends none).
- Suggested fix: show per-line discount, label packing lines by `metadata.packing_name`, and share one money formatter with the site (see SHOP-10).

### SHOP-20 Minor: card sitewide discount badge is display-only
- Severity: minor
- Where: product-card/index.tsx:22,146-158
- Evidence: with `NEXT_PUBLIC_SITEWIDE_DISCOUNT_PERCENT` set, cards show a crossed-out price and "X% off" that the PDP and cart do not honour (PDP shows the plain price). Not set in the env template (commented out), so only a risk if someone enables it. The discounted amount is not rounded (e.g. 2960 * 0.9 fine, 2995 * 0.95 = 2845.25).
- Suggested fix: leave unset for launch, or remove the code path.

---

## Checked and OK (coverage)
- Money: `convertToLocale` gives `LKR 2,960.50` with 2 decimals; cart totals, order summary, order items, checkout mobile summary, JSON-LD (`toFixed(2)`), Google and Meta feeds all use consistent 2dp numbers; Onepay/Koko/Mintpay amounts use `toFixed(2)`.
- Cart mutations use `revalidateTag("cart")` and `"shipping"`; cart fetch is uncached (tag only), so the page view of the cart is live; `retrieveLiveCart` reprices if older than 15s; `assertCartInStock` re-prices and re-checks stock live before paying (comparison uses `Math.round(before) !== Math.round(after)`, so a sub-rupee change is not flagged, acceptable).
- Completed carts are treated as no cart (retrieveCart), poisoned-promotion cart recovery exists in `addToCart`.
- Qty change on cart page: debounced 500 ms, bounded 1-20, reverts on error, shows error text; server actions are queued by Next so fast clicks do not interleave; delete has an error message and spinner.
- Add-to-cart with add-ons goes through the backend, which recomputes price server-side (addon-items route); qty clamped; add-on validation present. Packing lines are filtered from lists and sold through a hidden product, `metadata.internal` filtered in product lists.
- Region: middleware has single-flight region fetch, timeouts, empty-map pass-through (no redirect loop), default `lk`; sitemap/feeds hardcode lk.
- Empty states: cart page and drawer empty message, "Coming soon" card for unpriced products, "No results" for search, `error.tsx` exists in (main); home throws a real error if data is missing rather than a blank page.
- Products without images: `Thumbnail` falls back to a placeholder, merchant feed skips imageless items, product card handles an empty image list (renders nothing, not a crash).
- Variant selection: single-variant and single-option products are pre-selected; URL `color` param sync; image swap per variant.
- Stock helper `isVariantInStock` is shared by PDP, card, JSON-LD and the feed (manage_inventory false, backorder, qty > 0).
- Search endpoint `/store/offers` fails closed (no promo popup on error), cached 60s.

## Not verifiable here (needs browser / dev data)
- Real BUY2GET1 promo configuration (SHOP-01), real inventory-location linkage for `inventory_quantity` in the storefront's sales channel, rendered email output, Meilisearch availability on dev, behaviour of Next masking server action errors in the production build.
