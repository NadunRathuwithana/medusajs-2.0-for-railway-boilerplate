# QA: Checkout and Payments (PAY-)

Checkout is solid for Onepay (harness 105/105) and for Koko signature handling, but COD cap and the CARD_5 card discount are enforced only in storefront server actions, never in the backend. Koko and Mintpay have a server-side recovery job, but a leftover COD session can block Koko and Mintpay completion.

STATUS: PASS WITH ISSUES
Counts: blocker 0, major 5, minor 6

Scope: code review only (no network). Onepay harness was run. Branch v2-prelaunch-fixes.

## Results matrix

| Method | Success | Fail | Cancel | Webhook race | Double-submit | Tab closed |
|---|---|---|---|---|---|---|
| COD | PASS: placeOrder runs stock, phone and COD-cap checks then cart.complete (cart.ts:764). Cap is client/storefront-action only, see PAY-01 | PASS: errors surface in ErrorMessage, button re-enabled | PASS: nothing external to cancel | PASS: n/a, no webhook | PASS: button disabled by state, Medusa cart lock makes second complete a no-op. Tiny same-frame window (PAY-11) | PASS: nothing paid, no order is created, which is correct |
| Onepay | PASS: harness S01, S12, S16, S17 | PASS: harness S02, S20 | PASS: harness S03 | PASS: harness S12 (popup + return + callback + job at once) | PASS: harness S11, S19 plus busyRef sync lock (payment-button:565) | PASS: harness S05, S06, S09, S21. Caveat PAY-03 on the callback URL |
| Koko | PASS: signed webhook or return page placeOrder, authorize verifies with orderView (service.ts:217) | PASS: return page with non-SUCCESS resets session (koko/return/client.tsx:35). PAY-04 for a leftover COD session | PASS: cancel page exists. Cart intact. Caveat PAY-08 (bad link) | PASS: Redis cache plus orderView fallback, Medusa cart lock, capture idempotent (payment.captured_at). Replay of a signed message is harmless | PASS: submitting state plus form.submit once. Same _orderId reused, so harmless | PASS: koko-reconcile every 5 min replays Koko's own signed SUCCESS (age 2 min to 24 h). Order can lag up to ~5 min |
| Mintpay | PASS: return page placeOrder, authorizePayment live-polls status (service.ts:222) | PASS: fail page resets session | PASS: same fail_url path | PASS: no push webhook, so the only writers are the return page and the reconcile job. Both go through the cart lock | PASS: same pattern as Koko | PASS: mintpay-reconcile every 5 min (needs mintpay_purchase_id on session) |

No cell is NOT TESTABLE by code reading, but all runtime behaviour of Koko, Mintpay and the browser popups is unverified (needs browser and live provider sandboxes).

## Onepay harness result
`RUNS=5 OUT=/tmp/qa-onepay.json backend/.harness/run.sh`: TOTAL 105/105 pass (21 scenarios x 5 runs, 79.6 s). 85 orders created, 165 complete calls, 65 failed auth, no failures. Scenarios cover success, decline, popup closed, paid-then-tab-closed with and without callback, replaced-link payment, double pay, double click, attacker posting another cart's txn, unknown txn, Onepay API down, completion failing once, late status, 24h-old links.
Caveat: the harness requires `src/api/collect/route.ts`, which is NOT the file served at `/api/collect` (see PAY-03).

## Issues

### PAY-01 COD LKR 8,000 cap is not enforced on the backend
- Severity: major
- Where: storefront/src/lib/data/cart.ts:647-657, 659-672, 772; storefront/src/lib/constants.tsx:62-65; backend has no matching code
- Steps / evidence: `grep -rn "8000\|pp_system_default\|COD" backend/src` finds only the seed, an email label and an admin label. The cap exists only in `codOverLimit()` and `isCodOverLimit()` inside the storefront server actions (`checkCartReady`, `placeOrder`) and in the disabled radio in payment/index.tsx:46. Anyone calling Medusa's `POST /store/carts/:id/payment-collections`, `/payment-sessions` and `/store/carts/:id/complete` directly with the public publishable key can place a COD order of any size. The storefront check also trusts `cart.total` from a separate read.
- Expected vs actual: cap enforced server side; actual client plus storefront action only.
- Suggested fix: add a Medusa workflow hook on completeCartWorkflow (`completeCartWorkflow.hooks.validate`) that throws when the cart's payment session provider is `pp_system_default` and `cart.total > 8000`. Keep the limit in one env var shared by both apps.

### PAY-02 Card 5% promo (CARD_5) can stay on a COD order via direct API; no server-side tie between promo and payment method
- Severity: major
- Where: storefront/src/modules/checkout/components/payment/index.tsx:111-165; storefront/src/lib/constants.tsx:103-145; backend: no code
- Steps / evidence: the discount is added or removed by a client `useEffect` that calls `applyPromotions` when the selected method changes. For COD the code comes from `NEXT_PUBLIC_PROMO_MANUAL_CODE` (empty) so the effect strips the card code. That is UI only: nothing in the backend checks that a cart carrying CARD_5 uses Onepay. Direct API (add promo code, select COD, complete) keeps the 5% off on a COD order, and a customer can also type the code in the manual promo box. Also the effect has a lastAttemptedCodesRef guard, so if the strip call fails silently (only console.error, line 155) the customer completes COD at the card price with no visible error. Which codes are set in the live env (NEXT_PUBLIC_PROMO_*) is not visible here (unverified).
- Expected vs actual: COD order never keeps the card discount; actual only enforced if the browser effect succeeds.
- Suggested fix: in the same completeCart validate hook, if the cart has a promotion whose code is in a payment-promo allow-list (CARD_5), require the session provider to be `pp_onepay_onepay` (or the provider mapped to that code), otherwise throw. Alternative: make the promotion rule itself conditional (Medusa promotion rule on payment provider is not available, so the hook is the practical route). Also block manual entry of payment-promo codes in the discount box, or let the same hook handle it.

### PAY-03 Onepay callback route: `/api/collect` is served by the OLD route file, the hardened one is at `/collect`
- Severity: major
- Where: backend/src/api/api/collect/route.ts (served at /api/collect) vs backend/src/api/collect/route.ts (served at /collect)
- Steps / evidence: Medusa maps `src/api/<path>/route.ts` to `/<path>`. So `src/api/api/collect` is `/api/collect`, and `src/api/collect` is `/collect`. Project context says the Onepay callback is `/api/collect`. The old file (still present, unchanged by V2) does `listPaymentSessions({}, {take: 100})` and matches on `ipg_transaction_id` in memory, so once there are more than 100 sessions in the DB it silently finds nothing, and it does not use the attempts ledger or reconcileAttempt. The harness exercises only `src/api/collect/route.ts`. If a reverse proxy rewrites `/api/collect` to `/collect` this is fine; if not, the callback is the unhardened one. Which URL is registered with Onepay is unverified (needs Coolify or Onepay dashboard).
- Expected vs actual: callback hits the hardened handler; actual depends on routing.
- Suggested fix: confirm the callback URL registered in Onepay. Then either delete `src/api/api/collect/route.ts` and register `/collect`, or move the hardened file to `src/api/api/collect/route.ts` (and update the harness require path). Reconcile job still covers lost callbacks within a few minutes, which is why this is not a blocker.

### PAY-04 Leftover COD session blocks Koko / Mintpay / Onepay-return completion when total is over 8,000
- Severity: major
- Where: storefront/src/lib/data/cart.ts:648-657 (`codOverLimit`), 672, 772
- Steps / evidence: `codOverLimit` returns true if ANY non-canceled session has provider `pp_system_default`, not the selected one. The payment-button comment (line 63) confirms Medusa leaves several sessions "pending" when switching providers. Scenario: customer picks COD at LKR 7,500, adds an item (total 9,000), switches to Koko. The COD session is still pending, so `checkCartReady` returns the COD error before the Koko redirect (customer sees a COD message while Koko is selected). Worse, if it passes earlier, `placeOrder()` on the Koko and Mintpay return pages throws the COD message on all 8 retries and the page shows "Payment was processed, but we couldn't confirm your order" even though money was taken (server side recovery will later create the order). Runtime behaviour is unverified (needs browser).
- Expected vs actual: only the selected or latest session decides; actual checks any session.
- Suggested fix: pick the latest pending session like payment-button does:
```ts
const latest = sessions.filter((s:any)=>s.status==="pending").sort((a:any,b:any)=>+new Date(a.updated_at)-+new Date(b.updated_at)).pop()
const cod = String(latest?.provider_id||"").startsWith("pp_system_default")
```
and skip the check entirely in the Koko and Mintpay return flows (payment already taken). Better: move the check into the backend hook from PAY-01 which sees only the session that is being authorized.

### PAY-05 Koko and Mintpay amount is never verified against the cart total at completion
- Severity: major
- Where: backend/src/modules/koko-payment/service.ts:217-258, 404-417; mintpay-payment/service.ts:222-263
- Steps / evidence: Onepay's js-confirm compares the paid amount with `cart.total` (js-confirm/route.ts:~27). Koko authorize and webhook accept `status: SUCCESS` for the session id only; Mintpay accepts `Approved` only. Both return `amount: 0` (so Medusa captures the full session amount). The amount charged by the provider is the amount signed into the form when the session was created. If the cart total changes after the session was created and the session is not refreshed (Medusa refresh deletes sessions when `payment_collection.amount != cart.total`, so this is partly covered), nothing here confirms provider-amount equals order total. Koko's orderView response type has no amount field in types.ts, so it cannot be checked there; Mintpay status response might.
- Expected vs actual: provider-reported amount compared with total; actual trusts status only.
- Suggested fix: if the orderView or Mintpay status payload exposes an amount, compare to `session.amount` in authorizePayment and return `error` on mismatch. Otherwise document that Medusa's collection refresh is the control and add a unit test for it.

### PAY-06 Koko `updatePayment` re-uses the same `_orderId`
- Severity: minor
- Where: backend/src/modules/koko-payment/service.ts:341-345, 146-151
- Steps / evidence: `updatePayment` calls `initiatePayment`, whose `orderId` is the Medusa session id, which does not change on update. The comment says "Koko requires a unique _orderId per request". If Medusa ever calls update (amount change on same session) Koko may reject the duplicate id or treat it as the old order. Medusa's refresh normally deletes and recreates sessions instead, so likely rare.
- Suggested fix: append a counter or timestamp to `_orderId` and store the mapping, or throw in `updatePayment` so Medusa recreates the session.

### PAY-07 Koko and Mintpay `authorizePayment` return "authorized", not "captured" (Koko), and Koko webhook is the only capturer
- Severity: minor
- Where: backend/src/modules/koko-payment/service.ts:229-248
- Steps / evidence: Onepay and Mintpay comments explain that returning "authorized" leaves the payment authorized-but-uncaptured unless a webhook arrives. Koko still returns "authorized" for SUCCESS. The signed webhook (and the reconcile replay) does capture, so the end state is correct but delayed by ~5 s (event delay 5000) or up to 5 min. If a webhook never arrives and the order completes from the return page, the admin shows an uncaptured payment.
- Suggested fix: return `status: "captured"` for SUCCESS in both branches, same as Mintpay.

### PAY-08 Koko cancel page links to `/checkout` (missing country prefix) and does not reset session
- Severity: minor
- Where: storefront/src/app/[countryCode]/(checkout)/checkout/koko/cancel/page.tsx:41-45
- Steps / evidence: `href="/checkout"` has no `/lk`. With the default-region middleware this probably redirects, but Mintpay fail page has the same link. The Koko cancel page does not call `resetPaymentSession` (Mintpay fail does), so the old Koko session stays pending. Both are low impact since the Koko button rebuilds a session when the cart changes.
- Suggested fix: use `/${countryCode}/checkout` from params, and call `resetPaymentSession()` like the Mintpay fail page (note that it switches to COD; see PAY-04).

### PAY-09 Mintpay and Koko webhook entry points: Medusa default `/hooks/payment/<provider>` is also exposed
- Severity: minor
- Where: Medusa core route (`@medusajs/medusa/dist/api/hooks/payment`), backend/src/api/middlewares.ts
- Steps / evidence: the custom `/webhooks/koko` route has a rate limit and form parsing, but the default hook route accepts any POST for any provider id with no rate limit. Koko is protected by the RSA check (unsigned and tampered payloads return `not_supported`: `verifier.verify` throws or returns false, both give false, line 94-102). Mintpay's `getWebhookActionAndData` does no verification at all (service.ts:386-412); a forged `{session_id, status:"Approved"}` is safe only because the autocapture path calls `authorizePayment`, which live-polls Mintpay and throws when not approved. Onepay hook follows the same pattern. Safe today but worth noting because it relies on a core-flow detail.
- Suggested fix: add a rate limit matcher for `/hooks/payment/*` and a comment or test that documents the dependency. Optionally require a shared secret header for the reconcile-originated events.

### PAY-10 Delivery copy: homepage meta description says "Free delivery available"
- Severity: minor
- Where: storefront/src/app/[countryCode]/(main)/page.tsx:20
- Steps / evidence: the rule is island-wide LKR 500, 3-10 working days. Consistent everywhere else: shipping page (title text, line 8, 39, 71), footer (line 77), checkout shipping option copy "Approx. 3-10 working days" (shipping/index.tsx:115), product tab "3-10 Working Days" (product-tabs:210), JSON-LD LKR 500 with 0-2 handling plus 3-8 transit (product-json-ld:66+), FAQ (3-10, personalised +2-4 days). Only the meta description contradicts it, and it is shown in Google results. The actual LKR 500 amount comes from the Medusa shipping option data in the DB (not in code); unverified which amount the live and dev DBs hold. Shipping option name text is also DB-driven.
- Suggested fix: change to "Island-wide delivery for LKR 500." Verify the shipping option price in admin on both DBs.

### PAY-11 Place order buttons for COD, Koko and Mintpay rely on React state for double-click lock
- Severity: minor
- Where: storefront/src/modules/checkout/components/payment-button/index.tsx:419-445, 864-888, 976-999
- Steps / evidence: only Onepay has a synchronous `busyRef` lock (line 565). COD, Koko and Mintpay use `setSubmitting(true)` which disables the button after the next render, so two clicks in the same frame can start two `onPaymentCompleted` flows. Impact is limited: Medusa complete-cart takes a per-cart lock and a second call returns the same order. For Koko and Mintpay the form is submitted twice to the same session (same `_orderId`). Also after `form.submit()` the button stays "Redirecting..." forever if the customer uses the browser back button (bfcache) (unverified, needs browser).
- Suggested fix: add `const busy = useRef(false)` guard like OnepayButton, and reset `submitting` on `pageshow` when `event.persisted`.

## Checked and PASSED
- Delivery rule copy consistent across footer, shipping page, FAQ, checkout, product page and JSON-LD (except PAY-10).
- COD cap value LKR 8,000 consistent in constant, message, disabled radio and auto-switch away from COD when total grows (payment/index.tsx:49-57). Cap is compared against `cart.total` which includes delivery.
- Phone validation: `^(0\d{9}|(\+94|94)\d{9})$` after cleaning, required for shipping and billing, optional second number validated if typed. Email validated. Address needs first and last name, line 1, city, postal code, country. Button gating is live (`addressesComplete`) and rechecked server side in `assertCartContactSaved` and `placeOrder`.
- Payment session is not created (Koko, Mintpay) before a valid phone is saved (payment/index.tsx:207-217).
- Stock re-check and re-price before paying (`assertCartInStock`): if total moved, customer is stopped to review (cart.ts:574-590).
- Onepay link is created on click so it always matches the final total; amount compared with cart total; txn must belong to the cart (js-confirm).
- Koko: RSA-SHA256 (`crypto.createVerify("RSA-SHA256")`), verifies with Koko's PUBLIC key, signs requests with merchant private key, base64; `\n`-escaped PEM normalised; missing signature, malformed or tampered payload returns false (try/catch); verification covers orderId + trnId + status; unsigned or invalid gets `not_supported` and a Sentry warning. Webhook always answers 200 and enqueues with 3 attempts. Replay of a valid signed message cannot double-create an order (Medusa capture is idempotent and cart completion is locked).
- Session id handling: Koko `_orderId` = Medusa payment session id (unique, mapped back in webhook); Mintpay `order_id` = session id and purchase id kept in session data for reconcile.
- Reconcile jobs: Koko 2 min to 24 h window, Mintpay all pending, Onepay covered by harness. All use the same event path as real webhooks.
- No secrets found in the reviewed files (keys are read from env; `.env.template` entries are commented and empty).

## Not verifiable from code (needs browser or provider sandbox)
- Real Koko, Mintpay popup/redirect behaviour, return query params from Mintpay.
- Live values of NEXT_PUBLIC_PROMO_* env vars and of the shipping option price.
- Which callback URL Onepay has registered (PAY-03).
- Whether query.graph in koko-reconcile and mintpay-reconcile pages beyond the default limit when many pending sessions exist (no explicit pagination; fetch calls also have no timeout, so one hung provider request could stall a run).
