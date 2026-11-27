# QA: Tracking (Meta Pixel, Meta CAPI, GA4)

Code review of branch v2-prelaunch-fixes. Purchase dedup is wired correctly (browser eventID = CAPI event_id = order.id) and CAPI fires from order.placed for every order path (incl. Onepay watcher/reconcile), but CAPI is missing client_user_agent, sends SL phones without country code, can log the access token on error, and the browser trackers can silently drop Purchase on the Onepay full-page redirect.
No consent/notice for Meta/Google under PDPA 2022, three add-to-cart paths send no AddToCart, and a few funnel events are mis-timed or never fire.

STATUS: PASS WITH ISSUES  (blocker 0, major 7, minor 8)

## Event table

| Event | Browser Pixel | CAPI | GA4 | Value / currency OK? | Dedupe OK? | Verdict |
|---|---|---|---|---|---|---|
| PageView | MetaPixel.tsx:49 (init snippet, first load) + :28 (every pathname/searchParams change) | no | page_view GoogleAnalytics.tsx:21 (send_page_view:false in config) | n/a | First-load guard OK. Extra PageView on every colour click / sort change (TRK-09); possible GA4 double with enhanced measurement (TRK-15) | minor issues |
| ViewContent | track.ts:61 via product-actions/index.tsx:67, on mount keyed on product.id | no | view_item track.ts:71 | cheapest price, LKR (uppercased) OK | No session guard (correct: one per PDP view) | OK, but content_ids = product.id (TRK-08) |
| AddToCart | track.ts:90 via product-actions/index.tsx:213, after addToCart resolves | no | add_to_cart track.ts:100 | price + addons, LKR OK | n/a (user action) | MAJOR: missing on 3 other add paths (TRK-06) |
| InitiateCheckout | track.ts:121 via CheckoutTracker.tsx:20 (checkout page.tsx:44) | no | begin_checkout track.ts:131 | cart.total, LKR OK; num_items = line count (TRK-10) | ref + sessionStorage per cart.id OK | OK with TRK-04 caveat |
| AddShippingInfo (GA4 only) | none | no | add_shipping_info track.ts:196 via shipping/index.tsx:40 | OK | sessionStorage per cart.id | Effectively never fires (TRK-12) |
| AddPaymentInfo | track.ts:225 via payment/index.tsx:189 (Onepay) / :262 (others, after session created) | no | add_payment_info track.ts:234 | Pre-discount value for card (TRK-11) | sessionStorage per cart+method OK | Auto-fires for COD default (TRK-11) |
| Purchase | track.ts:153 via PurchaseTracker.tsx:24 (order/confirmed/[id]/page.tsx:44), eventID = order.id | meta-capi.ts:71-90 from subscribers/order-placed.ts:58, event_id = order.id | purchase track.ts:168, transaction_id = order.id | order.total (incl. LKR 500 shipping, after discounts) both sides; LKR uppercased both sides | Pixel/CAPI dedup key matches. Browser guard ref + sessionStorage. CAPI fires once per order.placed | Dedup OK; CAPI match quality and browser race issues (TRK-01..04) |

Onepay specifics: popup flow ends with `window.location.replace('/lk/order/confirmed/<id>')` (payment-button/index.tsx:637, onepay/return/client.tsx:95). That is one full document load in the same tab, so PurchaseTracker mounts once and the sessionStorage guard blocks reloads: Purchase fires at most once. It can fire zero times in the browser (TRK-04). If the server watcher / reconcile job / /api/collect created the order and the customer never reaches the confirmation page, CAPI still sends: all those paths emit PaymentWebhookEvents.WebhookReceived (jobs/onepay-reconcile.ts:85, api/api/collect/route.ts:68, webhooks/onepay/route.ts:14) and Medusa's native webhook flow completes the cart, which emits order.placed. GA4 gets nothing in that case (TRK-13).

---

### TRK-01 CAPI Purchase sends no client_user_agent
- Severity: major
- Where: backend/src/lib/meta-capi.ts:32-60; storefront/src/lib/data/cart.ts:745-762 (metaMatchKeys), :809-830 (placeOrder)
- Steps / evidence: UserData gets email, phone, names, external_id, fbc, fbp, client_ip_address. No `setClientUserAgent` anywhere; `grep -rni user.agent backend/src storefront/src` finds only robots.ts. metaMatchKeys only collects `_fbc`, `_fbp`, x-forwarded-for, referer.
- Expected vs actual: Meta documents client_user_agent as required for `action_source: 'website'` server events, and it is a key match parameter (also needed for fbp/IP matching to work well). Actual: never sent. Depending on Meta's enforcement the events are either rejected or poorly matched. Unverified (needs Events Manager / backend logs: look for `[Meta CAPI] Error` and the EMQ score).
- Suggested fix:
```ts
// storefront cart.ts metaMatchKeys() and the placeOrder block
const ua = headersList.get("user-agent")
if (ua) out.client_user_agent = ua.slice(0, 500)
// backend meta-capi.ts
if (order.metadata?.client_user_agent) userData.setClientUserAgent(order.metadata.client_user_agent)
```

### TRK-02 Sri Lankan phone hashed without country code (and no country/city keys)
- Severity: major
- Where: backend/src/lib/meta-capi.ts:37-39; node_modules/capi-param-builder-nodejs/src/piiUtil/phoneUtil.js
- Steps / evidence: checkout accepts `^(0\d{9}|(\+94|94)\d{9})$` (checkout-validation.ts:9) and cleanPhone keeps `07XXXXXXXX`. The param builder normalizer only strips non-digits and leading zeros: `0771234567` -> `771234567`. Meta requires the number with country code (`94771234567`), so the hashed phone never matches for the most common local format.
- Expected vs actual: phone match key should be `94XXXXXXXXX`; actual is 9 digits without country code. Also missing `country` (lk), `ct` (city), `zp` which are already on the order.
- Suggested fix:
```ts
const toE164LK = (p?: string) => {
  const d = (p || "").replace(/\D/g, "")
  if (/^0\d{9}$/.test(d)) return "94" + d.slice(1)
  if (/^94\d{9}$/.test(d)) return d
  return d || undefined
}
const phone = toE164LK(order.shipping_address?.phone || order.metadata?.contact_phone)
if (phone) userData.setPhones([hashPII(phone, PII_DATA_TYPE.PHONE)])
// plus setCountries / setCities / setZips with the matching PII_DATA_TYPE hashing
```

### TRK-03 CAPI error log can print the Meta access token and hashed PII
- Severity: major
- Where: backend/src/lib/meta-capi.ts:92-93
- Steps / evidence: `console.error('[Meta CAPI] Error sending purchase event:', error)`. In facebook-nodejs-business-sdk src/api.js `call()` appends `access_token=<token>` to the URL for array paths and on failure throws `new FacebookRequestError(response, method, url, data)`; the error object keeps `url` (with token) and `data` (event payload). Logging the whole object writes the token into Coolify logs (and Sentry if it captures console errors). Combined with TRK-01, errors may be frequent. Also line 91 logs the full success response (harmless but noisy).
- Expected vs actual: log only status + message.
- Suggested fix:
```ts
} catch (error: any) {
  console.error('[Meta CAPI] Purchase failed', error?.status, error?.response?.error?.message || error?.message)
}
```
Rotate the CAPI token if any error logs from this code already exist.

### TRK-04 Browser trackers mark events as sent even when fbq/gtag is not loaded yet (Onepay full-page redirect)
- Severity: major (unverified, needs browser)
- Where: storefront/src/components/analytics/PurchaseTracker.tsx:19-34, CheckoutTracker.tsx:15-26; storefront/src/lib/analytics/track.ts:152, :167; storefront/src/app/layout.tsx:84-88
- Steps / evidence: `trackPurchase` does `if (window.fbq) {...}` / `if (window.gtag) {...}` and silently does nothing otherwise, then PurchaseTracker always calls `markEventTracked("purchases", order.id)`. fbq/gtag are only defined when the `afterInteractive` inline `<Script>`s in MetaPixel/GoogleAnalytics run, and those sit inside a `<Suspense>` boundary in the root layout, while PurchaseTracker is in the page tree. On the Onepay path the confirmation page is a fresh document load (`window.location.replace`), so the effect order between the Suspense-hydrated scripts and PurchaseTracker's effect is not guaranteed. If PurchaseTracker runs first, browser Purchase and GA4 purchase are dropped and the session guard prevents any retry. Meta still gets CAPI (dedup partner missing, fine), GA4 loses the sale.
- Expected vs actual: event must be queued/sent once the libraries exist; actual can be dropped.
- Suggested fix: define the stubs before anything else so calls queue, e.g. in MetaPixel/GoogleAnalytics use `strategy="beforeInteractive"` for the small inline stub (fbq queue + `window.dataLayer=...;function gtag(){dataLayer.push(arguments)}`), or in trackPurchase/trackInitiateCheckout only `markEventTracked` when `window.fbq || window.gtag` existed, and otherwise retry on a short interval (e.g. 10 x 300 ms). Lead: in the browser, do an Onepay test order and confirm both `fbevents` Purchase (with eventID) and `collect?en=purchase` appear on the confirmation page load.

### TRK-05 No consent banner; privacy policy does not disclose Meta/Google tracking or CAPI PII sharing (PDPA 2022)
- Severity: major (legal, confirm with counsel)
- Where: storefront/src/app/layout.tsx:84-88 (Pixel + GA4 load unconditionally); storefront/src/app/[countryCode]/(main)/privacy/page.tsx:36, :60; terms/page.tsx:88
- Steps / evidence: `grep -ri consent` finds no banner or Consent Mode. Privacy page only says "cookies and similar technologies" and "trusted third-party service providers"; Meta, Google, the Conversions API and the sending of hashed email/phone/name/IP to Meta are not named. Data goes to Meta/Google outside Sri Lanka.
- Expected vs actual: Sri Lanka Personal Data Protection Act No. 9 of 2022 requires a lawful basis (consent or legitimate interest), a clear notice of purposes and recipients, and safeguards for cross-border transfers. Minimum before launch: update the privacy policy to name Meta Pixel, Meta Conversions API (hashed email/phone/name, IP, cookies fbp/fbc), Google Analytics 4, purposes, retention and an opt-out contact. Recommended: a light cookie notice with accept/decline, gating `fbq('consent','revoke'|'grant')` and Google Consent Mode v2 (`gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',...})`), and skipping CAPI when metadata says consent was declined.
- Suggested fix: as above; store `metadata.tracking_consent` with the address save and check it in sendPurchaseEvent.

### TRK-06 AddToCart missing on three add-to-cart paths
- Severity: major
- Where: storefront/src/modules/products/components/product-card/index.tsx:65, product-card/quick-view-modal.tsx:105, modules/cart/components/free-third/dialog.tsx:28
- Steps / evidence: these call `addToCart(...)` but never `trackAddToCart`. Only product-actions/index.tsx:213 tracks.
- Expected vs actual: every successful add should send Pixel AddToCart + GA4 add_to_cart. Quick-add from cards/quick view is undercounted, which skews ad optimisation and the GA4 funnel.
- Suggested fix: after each `await addToCart(...)` call `trackAddToCart({ id: variantId, name, price, quantity: 1, currency: "LKR" })` (for the Buy 2 Get 1 free item, value 0 or skip by choice; document it).

### TRK-07 Environment checks: test event code, pixel IDs, dev vs live
- Severity: major (unverified, config not in repo)
- Where: backend/src/lib/meta-capi.ts:4-6, :86-88; backend/.env.template:56-58; storefront/.env.local.template:24-25
- Steps / evidence: `META_TEST_EVENT_CODE` is env-driven. If it is set on backend-prod, every CAPI Purchase lands in Test Events only and is not used for attribution. Dev and live share one VPS; if dev (storefront/backend) uses the live pixel ID without a test code, dev test orders become real Purchases on the live pixel.
- Expected vs actual / check list for the lead in Coolify:
  - backend-prod: `META_TEST_EVENT_CODE` empty; `META_PIXEL_ID` equals storefront-prod `NEXT_PUBLIC_META_PIXEL_ID` (dedup only works within the same pixel).
  - dev: either a separate pixel/GA4 property, or `META_TEST_EVENT_CODE` set and `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_GA_MEASUREMENT_ID` empty or test IDs.
  - Do not print the values, just confirm.

### TRK-08 content_ids / item_id inconsistent (product id vs variant id)
- Severity: minor (major if Meta catalog / Advantage+ catalog ads are used)
- Where: storefront/src/modules/products/components/product-actions/index.tsx:67-72 (ViewContent / view_item use `product.id`); track.ts:90-95, :118, :150, :222 (others use variant_id); backend meta-capi.ts:62
- Expected vs actual: one ID scheme that matches the Meta catalog `id` (and GA4 items) across all events. Actual: ViewContent uses `prod_...`, AddToCart/Checkout/Purchase use `variant_...`, so the catalog can match at most one of them.
- Suggested fix: pick the catalog ID (usually variant id, or product id with `content_type: 'product_group'`) and use it everywhere.

### TRK-09 Extra PageView / page_view on colour selection and sort change
- Severity: minor
- Where: storefront/src/components/analytics/MetaPixel.tsx:17-30, GoogleAnalytics.tsx:13-27; triggers: product-actions/index.tsx:136 (`router.replace(...?color=...)`), store/components/sort-dropdown/index.tsx:39
- Expected vs actual: one PageView per page. Actual: both effects depend on `searchParams`, so every colour click on a PDP and every sort change fires another Meta PageView and GA4 page_view.
- Suggested fix: depend on `pathname` only (or ignore changes where only `color`/`sortBy` changed).

### TRK-10 num_items is line count; packing/add-on lines pollute content_ids; no `contents`
- Severity: minor
- Where: track.ts:126, :161; meta-capi.ts:62, :69; packing lines are real variants (backend/src/api/store/carts/[id]/packing/route.ts:52)
- Expected vs actual: num_items should be total quantity of products; content_ids should only be sellable products; Meta recommends `contents: [{id, quantity, item_price}]`. Actual: `items.length` including packing/add-on lines, whose variant ids also go into content_ids and GA4 items.
- Suggested fix: filter `!i.metadata?.packing` (and add-on lines), `num_items = sum(quantity)`, add `contents` on both Pixel and CAPI (`new Content().setId().setQuantity().setItemPrice()`).

### TRK-11 AddPaymentInfo fires automatically for the default COD method, and pre-discount for card
- Severity: minor
- Where: storefront/src/modules/checkout/components/payment/index.tsx:60-64 (COD auto-selected), :186-196 (Onepay), :258-268 (others)
- Expected vs actual: AddPaymentInfo should mean the customer chose a payment method. Actual: as soon as shipping is set, COD is auto-selected, a session is created and AddPaymentInfo fires without any user action, so it is almost identical to "address saved". For Onepay it fires with `cart.total` before the CARD_5 promo is applied (value 5% high).
- Suggested fix: fire on an explicit user selection / on Place order click, using the post-promo total.

### TRK-12 GA4 add_shipping_info effectively never fires
- Severity: minor
- Where: storefront/src/lib/data/cart.ts:530-538 (setAddresses auto-selects the first shipping method server-side); shipping/index.tsx:33-45, :63-74
- Expected vs actual: the event is only sent inside the Shipping component's `set()`. Since setAddresses already sets the method, the component sees `selectedShippingMethod` and never calls `set()`, so add_shipping_info is only sent if the customer manually picks another option. The GA4 funnel step stays near 0%. Unverified (needs browser).
- Suggested fix: fire add_shipping_info client-side after a successful address submit (when the returned cart has a shipping method), guarded by the same sessionStorage key.

### TRK-13 GA4 purchase is browser-only and thin
- Severity: minor
- Where: track.ts:167-178
- Expected vs actual: orders finished by the Onepay watcher/reconcile job when the customer closed the tab, ad-blocked browsers, and TRK-04 drops get no GA4 purchase. Payload lacks `shipping`, `tax`, `coupon`. Revisiting the confirmation link in a new tab (sessionStorage is per tab) re-sends Pixel Purchase (Meta dedups by eventID) and GA4 purchase (GA4 dedups same transaction_id per user, mostly).
- Suggested fix: add `shipping: order.shipping_total, tax: order.tax_total, coupon: promo codes`; optionally send purchase via GA4 Measurement Protocol from the order.placed subscriber (with client_id from the `_ga` cookie saved in cart metadata like fbp) and drop the browser one, or keep browser + MP with the same transaction_id.

### TRK-14 CAPI value type and event_source_url robustness
- Severity: minor
- Where: backend/src/lib/meta-capi.ts:67, :79-81; storefront cart.ts:755
- Expected vs actual: `setValue(order.total)` passes whatever query.graph returns (possibly a BigNumber object; serialises via toJSON, unverified). event_source_url is the Referer of the address-save server action (checkout URL), fine, but absent if Referer is stripped.
- Suggested fix: `setValue(Number(order.total))`; fallback `event_source_url = https://cardle.lk/lk/order/confirmed/${order.id}`.

### TRK-15 Possible GA4 double page_view via enhanced measurement
- Severity: minor (unverified, GA4 admin setting)
- Where: storefront/src/components/analytics/GoogleAnalytics.tsx:13-27, :45-47
- Expected vs actual: manual page_view on every route change plus `send_page_view:false`. If the GA4 web stream has Enhanced measurement > Page views > "Page changes based on browser history events" on, GA4 also auto-sends page_view on client-side navigations, doubling them.
- Suggested fix: turn that toggle off in GA4 admin, or drop the manual effect for non-initial navigations. Lead: check in browser that one client-side navigation produces exactly one `en=page_view` request.

---

## Passed / checked
- Purchase dedup key: browser `fbq('track','Purchase',..., {eventID: order.id})` (track.ts:153-164) and CAPI `setEventId(order.id)` + `setEventName('Purchase')` (meta-capi.ts:72-74) match.
- CAPI fires from `order.placed` for every completion path: COD/BNPL placeOrder, /api/onepay/finish, Onepay webhook, /api/collect and reconcile job (all go through Medusa's payment webhook flow / cart complete, which emits order.placed once). Redis retries would resend with the same event_id, which Meta dedups.
- fbc/fbp/IP/event_source_url saved during the address save (cart.ts:510, metaMatchKeys :745-762) and again in placeOrder (:809-830). Medusa v2 merges metadata on update (`mergeMetadata` in medusa-internal-service), so these writes do not wipe contact_phone/contact_phone_2.
- MetaParamSync (MetaParamSync.tsx) builds `_fbc` from `fbclid` on landing, so fbc is present for ad clicks.
- Currency: normalizeCurrency uppercases everywhere in the browser (track.ts:12-13); CAPI uppercases (meta-capi.ts:68). LKR default.
- Purchase value: order.total on both sides (incl. LKR 500 shipping, after promos). Consistent between Pixel and CAPI; confirm Meta/GA4 setups expect gross order value incl. shipping.
- Purchase fires exactly once per tab: ref + sessionStorage guard; Onepay `window.location.replace` replaces history so back button does not re-show the page.
- React Strict Mode (`reactStrictMode: true`): double effects only in `next dev`; refs/sessionStorage guards prevent duplicate Purchase/InitiateCheckout. MetaPixel's first-render ref can send one extra PageView in local dev only, not in production builds.
- First Meta PageView sent by the init snippet, SPA navigations handled by the effect; GA4 initial page_view not doubled by config (`send_page_view:false`).
- No GTM in code (no `GTM-` / gtm.js), so no gtag + GTM double counting from the codebase.
- PII hashing via Meta's capi-param-builder (email, phone, names, external_id) before sending.
- No secrets in tracking code; the facebook-domain-verification meta tag in layout.tsx:70 is public by design.
