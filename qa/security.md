# Security and backend QA (SEC-)

Branch v2-prelaunch-fixes. Code review only (no network, no code changes). 1 blocker, 6 major, 7 minor. No live secret values found in the tree or in git history (see PASSED list); a few secret-handling and hardening problems found.

STATUS: FAIL (1 blocker: reflected XSS on the backend/admin origin; 6 majors to fix before launch)

| ID | Severity | Title |
|---|---|---|
| SEC-01 | blocker | Reflected XSS and fake "Payment Successful" page on backend `/collect` and `/api/collect` (same origin as Medusa admin) |
| SEC-02 | major | Onepay provider logs the hash input string (contains ONEPAY_HASH_SALT), full payloads and customer PII |
| SEC-03 | major | Rate limiter keyed on spoofable first `X-Forwarded-For` entry AND shared across all customers (storefront server-side calls) |
| SEC-04 | major | `/store/my-orders` matches by unverified email: account registered with a victim's email can read the victim's guest orders and payment data |
| SEC-05 | major | Onepay webhook `/webhooks/onepay` and `/collect` are unauthenticated and the provider does no verification of the webhook itself; can force-capture non-Onepay sessions (e.g. COD) |
| SEC-06 | major | No rate limiting on login, register, password reset, promo apply (credential stuffing, email flooding, promo brute force) |
| SEC-07 | major | Business rules enforced only in the storefront: COD cap (LKR 8,000) and card-only promo CARD_5 |
| SEC-08 | minor | Hardcoded coming-soon credentials and static gate cookie in storefront code |
| SEC-09 | minor | Legacy duplicate `/api/collect` route (scans 100 sessions, no ledger) still shipped |
| SEC-10 | minor | `/key-exchange` unauthenticated, does not filter key type, leaks error.message |
| SEC-11 | minor | Debug and scratch files tracked in git (fix-geo.js, test-*.ts, debug-subscriber.ts, scratch/, storefront/scratch.ts); passwords in them |
| SEC-12 | minor | CSP is report-only and allows `unsafe-inline` / `unsafe-eval`; no enforced CSP |
| SEC-13 | minor | Minio: public-read policy on whole bucket, no type/size validation in provider; admin banner links not scheme-checked |
| SEC-14 | minor | Contact form: unauthenticated mail relay to arbitrary address, leaks `error.message`, 3-4 s sleeps hold connections |
| SEC-15 | minor | Misc hardening: `/store/carts/:id/*` custom routes do not reject completed carts, hidden `internal-packing` product is purchasable via core API, cookie `removeAuthToken` lacks flags, js-token returns app token |

---

### SEC-01 Reflected XSS and spoofable success page on `/collect` and `/api/collect`
- Severity: blocker
- Where: backend/src/api/collect/route.ts:68-238 (renderSuccessPage, GET); backend/src/api/api/collect/route.ts:105-275 (same code)
- Steps / evidence: `GET /collect?transaction_id=<payload>` takes `transaction_id` from `req.query` and `renderSuccessPage(transactionId || "N/A", ...)` interpolates it raw into HTML:
  `<span class="detail-value">${transactionId}</span>` (line 199). The page is rendered with 200 and `Content-Type: text/html` even when the Onepay lookup fails or the id is made up (queryResult null gives amount "N/A"). No escaping, no auth, no rate limit on this route (not in middlewares.ts).
  The backend origin (api.cardle.lk) also hosts the Medusa admin (/app). A crafted link such as `https://api.cardle.lk/collect?transaction_id=<script>...</script>` runs script on the admin origin: an admin who clicks it can have their session used to call `/admin/*` (create users, change prices, read orders and customer PII). It can also serve a "Payment Successful" page for any id (phishing / refund-fraud screenshots).
- Expected vs actual: untrusted input must be HTML-escaped; the page should only state success for a verified transaction. Actual: raw interpolation, always shows success.
- Suggested fix:
  ```ts
  const esc = (s: unknown) => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]!))
  // use ${esc(transactionId)} ${esc(amount)} ${esc(currency)} ${esc(dateTime)}
  ```
  Also: only render the success view when `queryResult` is truthy, otherwise render a neutral "We are confirming your payment" page; validate `transaction_id` with `/^[A-Za-z0-9_-]{1,64}$/`; add `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com` and `X-Content-Type-Options: nosniff` on this response; add `rateLimit` for `/collect`. If Onepay's redirect URL only needs a thank-you page, redirect to the storefront return page instead. Longer term serve admin from a different origin than public HTML endpoints.

### SEC-02 Onepay provider logs the salt-bearing hash input, full payloads and PII
- Severity: major
- Where: backend/src/modules/onepay-payment/service.ts:148-149, 162-163, 234-256; backend/src/api/collect/route.ts:9-19
- Steps / evidence:
  - Line 234 builds `hashInput = appId + currency + amount + this.options_.hashSalt` and line 240 does `console.log("[4] Hash input string :", hashInput)`. That prints ONEPAY_HASH_SALT in plaintext to container logs (Coolify log viewer, any log drain). The salt is documented as "NEVER expose".
  - Lines 148-149 and 245-246 log the full request body (customer name, phone, email, reference, session id, hash); 162-163 and 254-256 log full responses (redirect URL, transaction ids).
  - `collect/route.ts:9-19` logs `req.headers` (cookies, authorization, forwarded IPs) and the full body/query on every call, three times per request (incl. the Onepay status response).
  - Dev and live share one VPS and one Coolify, so logs from both are readable by the same operators.
- Expected vs actual: secrets and PII never in logs; actual: salt and PII logged on every payment initiation and every status call.
- Suggested fix: delete lines 234-247 (hashInput and the banner block) and 254-256; in `onepayRequest` log only method, path and HTTP status; in collect log only `transactionId` and outcome. If a debug trace is wanted, gate it on `process.env.ONEPAY_DEBUG === "1"` and still never print the salt, token, hash or contact fields. Rotate the Onepay hash salt after the log lines are removed if logs were ever shipped off-box or shared (unverified: whether live logs contain it; it will have logged on every live initiate).

### SEC-03 Rate limiter is spoofable and effectively global
- Severity: major
- Where: backend/src/lib/rate-limit.ts:5-10 (getClientIp), backend/src/api/middlewares.ts:58-75
- Steps / evidence:
  1. `getClientIp` returns the FIRST entry of `x-forwarded-for`. Behind Traefik/Coolify the proxy appends the real peer, so the first entry is whatever the client sent. A client that sends `X-Forwarded-For: <random>` gets a fresh bucket per request, so every limit (contact 5/15 min, webhooks 60/min, feeds, onepay-js 30/min, cart-complete 10/min) can be bypassed. No `trust proxy` configuration anywhere in backend.
  2. The opposite problem for server-to-server calls: `/store/onepay/*` (js-token/js-confirm), `/store/carts/:id/complete` are called by the Next.js server (server actions `placeOrder`, `/api/onepay/status`, `/api/onepay/finish`) via the Medusa SDK, which sends no client IP header. All customers therefore share ONE bucket: 30 req/min total for `/store/onepay/*` and 10 completions/min total for the whole shop. The checkout poll alone is `statusCheck` every 2.5 s (24 req/min per paying customer) plus up to 6-8 more in `finish` and `onClosed` loops. Roughly 2 concurrent card payers exhaust the 30/min bucket; the 429 is swallowed (`catch { return pending }` in storefront/src/app/api/onepay/status/route.ts:24), so payments are not detected live and fall back to the slower return-page/server watcher. 10 order completions per minute shop-wide could also reject orders during an ad spike (placeOrder gets 429).
- Expected vs actual: per-customer limits that clients cannot evade; actual: trivially bypassed by direct callers and over-restrictive for the storefront server.
- Suggested fix: (a) take the RIGHT-most untrusted hop: `const parts = xff.split(",").map(s=>s.trim()); return parts[parts.length - 1 - TRUSTED_HOPS]` (TRUSTED_HOPS=1 for Traefik only), or use `req.ip` with `app.set("trust proxy", 1)`. (b) For storefront-originated routes key on the cart id: `keyFn: req => (req.body as any)?.cart_id ?? req.params.id ?? getClientIp(req)` for js-token/js-confirm/complete, with higher caps (e.g. 120/min per cart for js-confirm, 10/min per cart for complete). (c) Forward the shopper IP from storefront in a custom header ONLY if you also authenticate that header (shared secret), otherwise skip.

### SEC-04 `/store/my-orders` trusts unverified email
- Severity: major
- Where: backend/src/api/store/my-orders/route.ts:22-50
- Steps / evidence: filter is `$or: [{ customer_id }, { email: customer.email }]` and returns `items.*`, `items.variant.*`, `items.product.*`, `payment_collections.*`, `payment_collections.payments.*`. Medusa's emailpass registration does not verify email ownership. Anyone can register `victim@gmail.com` (if the victim has no account) and then list every guest order placed under that email, including line items, totals, and the full payment record `data` (Onepay `ipg_transaction_id`, `redirect_url`, `onepay_details`, Koko/Mintpay references). Registration also needs no email confirmation on the storefront (unverified: check register flow).
- Expected vs actual: only the account's own orders; actual: cross-account read of guest orders.
- Suggested fix: filter by `customer_id` only (attach guest orders to the customer at registration only after email verification), and trim fields: drop `payment_collections.payments.*` and `items.product.*`; return `payment_collections.payments.provider_id,amount,captured_at` only.

### SEC-05 Webhook trust boundary: Onepay webhook accepted without verification, and applied to any payment session id
- Severity: major
- Where: backend/src/api/webhooks/onepay/route.ts:5-43; backend/src/modules/onepay-payment/service.ts:589-620; backend/src/api/collect/route.ts (unauthenticated trigger)
- Steps / evidence: `/webhooks/onepay` emits `PaymentWebhookEvents.WebhookReceived` with whatever JSON arrives. `getWebhookActionAndData` returns `captured` for `status===1 && status_message==="SUCCESS"` and uses `payload.additional_data` as `session_id`, with no signature, no ledger lookup and no call to Onepay. Medusa's `processPaymentWorkflow` acts on `data.session_id` for ANY provider: for a session with no Payment yet it runs `authorizePaymentSessionStep` then `capturePaymentWorkflow` (amount taken from the payload) and completes the cart. For Onepay sessions the provider's own `authorizePayment` re-verifies with Onepay (good, so a forged webhook cannot fake a card payment). But for a `pp_system_default` (COD) session authorize returns authorized unconditionally, so a forged webhook with that session id flips the payment to captured/paid with an attacker-chosen amount. Session ids (`payses_...`) are visible to the cart owner in the cart payload. Impact is mislabelled "paid" COD orders (ops may skip collecting cash or auto-fulfil on payment status); unverified whether any automation keys on payment_status.
  Koko webhook is correctly verified (RSA-SHA256, fails closed, SEC check in koko-payment/service.ts:370-392).
- Expected vs actual: only genuine Onepay notifications may produce a capture; actual: unauthenticated.
- Suggested fix: in `getWebhookActionAndData` first `getAttempt(payload.transaction_id)`; reject (`not_supported`) unless an attempt exists with `session_id === payload.additional_data`, then confirm with Onepay status API before returning `captured`; ignore the payload `amount` (use `attempt.amount`). Optionally in the webhook route reject when the session's provider_id is not `pp_onepay_onepay`. Keep the 200 response so Onepay does not retry.

### SEC-06 No rate limiting on auth, password reset, promo apply
- Severity: major
- Where: backend/src/api/middlewares.ts (no matcher for `/auth/customer/emailpass`, `/auth/customer/emailpass/reset-password`, `/store/customers`, `/store/carts/:id/promotions`, `/store/carts/:id/line-items`)
- Steps / evidence: only webhooks, onepay-js, contact, cart-complete and two feeds are limited. Login and register are unlimited (credential stuffing, account enumeration by timing/response), reset-password triggers a Resend email per call (email bombing a victim, burns Resend quota and sender reputation for orders@cardle.lk), promo apply can be used to brute-force codes.
- Suggested fix: add `rateLimit` entries, keyed by IP (after SEC-03 fix) and for login/reset also by lower-cased email in the body: `/auth/customer/emailpass` 10/min, `/auth/customer/emailpass/reset-password` 3 per 15 min per email, `/store/customers` POST 5 per 10 min, `/store/carts/:id/promotions` 20/min per cart. Add Cloudflare/Traefik rate rules as a second layer.

### SEC-07 COD cap and card-only promo are client-side rules
- Severity: major
- Where: storefront/src/lib/data/cart.ts (`codOverLimit` inside `placeOrder` server action); storefront/src/modules/checkout/components/payment/index.tsx:108-160 (payment-promo sync via `NEXT_PUBLIC_PROMO_*_CODE`); backend has no equivalent (`grep 8000|COD|pp_system_default` in backend/src finds only the seed script)
- Steps / evidence: `POST /store/carts/:id/complete` is public Medusa API. A caller can skip `placeOrder`, choose COD and complete a cart above LKR 8,000. Likewise the CARD_5 code (name also exposed via NEXT_PUBLIC_PROMO_ONEPAY_CODE) can be applied with `POST /store/carts/:id/promotions` and then COD/Koko selected, so non-card orders get 5% off. Unless the promotion in the DB has a rule restricting it (unverified, needs admin check; Medusa promotion rules cannot test payment provider).
- Suggested fix: add a backend guard: a `completeCartWorkflow.hooks.validate` hook (src/workflows/hooks/validate-cart.ts) that throws when the cart's active payment session provider is `pp_system_default` and total > 8000, and when a payment-promo code is applied but the session provider does not match the code's provider. 

### SEC-08 Hardcoded coming-soon credentials and guessable gate cookie
- Severity: minor
- Where: storefront/src/app/coming-soon/actions.ts:11-13; storefront/src/middleware.ts:133
- Steps / evidence: server action compares to a literal username and password ([REDACTED], both in source and in git). On success it sets `storefront_access=1`; middleware grants access if the cookie equals "1", so anyone can set that cookie by hand and bypass the coming-soon/maintenance gate without any password. Only matters if ENABLE_COMING_SOON / maintenance mode is on in live.
- Suggested fix: read the password from a server env var (`COMING_SOON_PASSWORD`), set the cookie to an HMAC of a server secret (or random token stored in Redis) and verify it in middleware; make sure both flags are false on live.

### SEC-09 Legacy `/api/collect` duplicate
- Severity: minor
- Where: backend/src/api/api/collect/route.ts
- Steps / evidence: older copy of `/collect` (see SEC-01): hardcodes `https://api.onepay.lk`, scans `listPaymentSessions({}, { take: 100 })` (misses any session beyond the newest 100), emits an unverified WebhookReceived event with `headers: req.headers`, same XSS. The hardened path is `/collect` (ledger + `reconcileAttempt`).
- Suggested fix: delete the file after confirming Onepay's configured callback URL is `/collect` (env ONEPAY_REDIRECT_URL / Onepay dashboard).

### SEC-10 `/key-exchange` open and unfiltered
- Severity: minor
- Where: backend/src/api/key-exchange/route.ts:5-17
- Steps / evidence: unauthenticated `GET` lists ALL API keys and returns the token of the first whose title is "Webshop" without checking `type === "publishable"`; if someone ever creates a secret key with that title its token leaks. Returns `error.message` on 500. Publishable keys are public by design, so impact is low today.
- Suggested fix: delete the route if unused (storefront uses `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`), or `listApiKeys({ type: "publishable", title: "Webshop" })` and return a generic 500 message. Same for the boilerplate stubs `store/custom` and `admin/custom` (remove).

### SEC-11 Debug and scratch files tracked in git
- Severity: minor
- Where: backend/fix-geo.js:2 and backend/test-retrieve.ts:8 (DB connection strings with a literal local password, [REDACTED]); backend/debug-subscriber.ts, backend/test-email.ts, scratch/test-sdk-auth.js, storefront/scratch.ts, storefront/src/lib/data/onboarding.ts:5 (redirects to `http://localhost:7001`), storefront/.github/** (CI test DB creds, harmless)
- Suggested fix: `git rm` them (the lead applies); keep `backend/.harness/` out of the production image (add to .dockerignore). Local-only passwords, no live credentials found.

### SEC-12 CSP not enforced, allows unsafe-inline/unsafe-eval
- Severity: minor
- Where: storefront/next.config.js:14-17, 112
- Steps / evidence: `Content-Security-Policy-Report-Only` with `script-src 'self' 'unsafe-inline' 'unsafe-eval' ...`. Even if enforced it would not stop inline-script XSS. Baseline headers (HSTS etc.) are set (not re-verified line by line). Eight `dangerouslySetInnerHTML` uses (JSON-LD and CMS?) should be confirmed to be fed only static or JSON.stringify'd data (unverified).
- Suggested fix: acceptable for launch; plan nonce-based CSP later. Make sure CMS-supplied text (banner `body`, `cta_href`, promo bar) is never put through `dangerouslySetInnerHTML`.

### SEC-13 Minio provider and admin CMS inputs
- Severity: minor
- Where: backend/src/modules/minio-file/service.ts:130-170, 193-235; backend/src/modules/cms/fields.ts:24-46; backend/src/api/admin/cms/settings/route.ts:19-23
- Steps / evidence: whole bucket is set public-read on every boot (intended for product images). Upload key is `sanitised-base + ulid + [A-Za-z0-9.]-only ext`, so path traversal is not possible (PASS). No MIME allow-list or size cap in the provider: `Content-Type` comes from the admin's upload (`file.mimeType`) so an admin can host `text/html` or SVG with script on the media host; only admins can upload (Medusa `/admin/uploads` auth), so low risk. Banner `cta_href`, image URLs and promo-bar `href` are free strings: a `javascript:` URL is possible from a compromised admin account.
- Suggested fix: reject mime types outside `image/jpeg|png|webp|gif|avif`, `video/mp4`, `application/pdf` and files over e.g. 10 MB in `upload`; serve media from a separate domain (it is: MINIO endpoint); in `pickBannerInput` and promo route accept only `/`-relative or `https://` hrefs.

### SEC-14 Contact form
- Severity: minor
- Where: backend/src/api/store/contact/route.ts:18-118
- Steps / evidence: anyone can make orders@cardle.lk send an auto-reply to an arbitrary address with the attacker's `name` in it (spam relay, reputation risk); limit is 5 per 15 min per (spoofable, SEC-03) IP. Handler sleeps 3 s + 1 s per request while holding the connection. Failure branch returns `details: error?.message` with status 400. No max length on name/message/subject.
- Suggested fix: cap lengths (name 100, subject 150, message 5000), drop `details`, return 500 on server errors, send the customer auto-reply via a queued job, consider a captcha/honeypot.

### SEC-15 Misc hardening notes
- Severity: minor
- Where / evidence:
  - backend/src/api/store/carts/[id]/addon-items/route.ts and packing/route.ts do not reject completed carts and have no ownership check. Cart ids are unguessable bearer values like in core Medusa, so this is the normal Medusa model (no IDOR beyond knowing the id); pricing is computed server-side (PASS). Add a `completed_at` check anyway.
  - The hidden product `internal-packing` (handle) is `published` in the default sales channel with a LKR 0 variant; it can be added through core `POST /store/carts/:id/line-items`. Make sure it is excluded from feeds, sitemap and search (unverified) and consider unpublishing it from the sales channel and adding items only through the server route.
  - storefront/src/lib/data/cookies.ts:25-30: `removeAuthToken` sets the cookie without httpOnly/secure/sameSite/path (deletes fine in practice).
  - `/store/onepay/js-token` returns `apptoken` (= ONEPAY_TOKEN, the same Authorization token used for server API calls) to the browser, and computes a hash for the cart total, so a shopper can mint a hash for chosen totals. This is how Onepay.js works, so accepted; confirm with Onepay whether a separate public token exists. The salt itself never reaches the client (PASS).
  - `/api/onepay/status` and `/api/onepay/finish` (storefront) act only on the cart in the httpOnly `_medusa_cart_id` cookie, so they cannot complete or probe other carts (PASS); `js-confirm` re-verifies amount and that the txn is in the ledger for that cart (PASS). No storefront-side rate limit; only the shared backend bucket (SEC-03).
  - Medusa stack defaults: `defineConfig` falls back to JWT/cookie secret "supersecret" if env is missing; backend/src/lib/constants.ts uses `assertValue` so missing secrets fail at boot (PASS). Confirm live env has long random values and that dev and live use DIFFERENT JWT/COOKIE secrets (shared VPS) (unverified, needs env review).
  - Dependency audit not run (no network). `@medusajs/*` is 2.13.6 (current line); check `npm audit`/Dependabot in CI.

---

## Checked and PASSED
- Secrets: no live keys, tokens or private keys in the working tree (`git grep` for sk_/re_/AKIA/PEM/EAA/connection strings found only local placeholders listed in SEC-11). Env files are git-ignored; only `.env.template` / `.env.local.template` / `e2e/.env.example` tracked.
- History: 353 commits searched with `git log -S/-G`. A Koko RSA key and Onepay salt appear only as truncated documentation placeholders (`MIICXAIBAAKBgQCfxX3U...`, `your_hash_salt_here`) in a markdown file added then deleted (commits 03ad924, 2782661). No real Resend, Meta (EAA), Stripe or Onepay tokens ever committed. Early templates contained only dummy values ("supersecret" JWT/cookie, local DB password).
- NEXT_PUBLIC_* inventory (28 vars): only IDs/URLs/promo codes/publishable keys; no secret-named variable. Search key defaults to "test_key" (fine). ONEPAY_HASH_SALT is imported only from backend `lib/constants`; hashing happens server-side (`lib/onepay-js.ts`), never returned to the browser.
- No `"use client"` file imports `server-only` modules or reads non-public env vars (scripted check); `lib/data/cookies.ts` is `server-only`.
- Cookies: `_medusa_jwt` and `_medusa_cart_id` are httpOnly, sameSite=strict, secure in production, 7-day maxAge. Server actions use Next's built-in origin check (Origin vs Host) for CSRF; sameSite=strict adds a second layer; route handlers `/api/onepay/*` read cookies only and `finish` is POST-only (status is a GET with no side effects other than recording an override that requires a paid txn).
- CORS: STORE/ADMIN/AUTH CORS come from env via `defineConfig` (comma-separated origins or regex). No wildcard in code. Env values not reviewable here (unverified: ensure live STORE_CORS is only https://cardle.lk and dev has its own).
- Admin routes `/admin/*` get Medusa's default user authentication; banner input is allow-listed (`pickBannerInput`), promo text length-capped; `/store/my-orders` has an `authenticate("customer")` middleware.
- Koko webhook: RSA-SHA256 signature verification fails closed; Mintpay and Koko reconcile re-verify with the provider.
- Onepay `js-confirm`: re-checks status with Onepay, amount equals cart total, txn must exist in our ledger and belong to this cart; `js-token` requires an active Onepay session on an uncompleted cart.
- add-on and packing prices are computed from the catalog on the server; quantity clamped to 1-50; add-on ids validated against product links and active flag.
- Minio keys: ASCII-sanitised base + ULID + sanitised extension (no traversal).
- Rate limiting exists (Redis sliding window) for contact, cart-complete, onepay js, webhooks and both feeds; fails open when Redis is down.
- TODO scan: only upstream-starter TODOs in the storefront account pages; backend medusa-config.js:156 TODO "change onboarding@resend.dev to a verified cardle.lk address" is stale-looking (context says orders@cardle.lk is used); confirm live RESEND_FROM_EMAIL.
- Production-hygiene: `ignoreBuildErrors:false`, `ignoreDuringBuilds:false` in next.config.js.
