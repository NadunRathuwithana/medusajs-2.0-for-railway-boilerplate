# Cardle V2 load test and capacity analysis

Code-based capacity analysis plus ready-to-run k6 scripts for a 100,000-user launch. **No load test was run** from the QA workspace or the VPS (owner decision: dev and live share one VPS and one Postgres). The owner runs the scripts in `qa/load/` from a Windows PC, off-peak, following `qa/load/run-guide.md`.

STATUS: PASS WITH ISSUES (analysis complete, measurements pending owner run)

Everything marked "unverified" needs a dev run or server access to confirm. Nothing here contains secrets.

## 1. What was delivered

| File | Purpose |
|---|---|
| `qa/load/lib.js` | Shared helpers: env config, **live guard**, basic auth, stages per TEST_TYPE, catalog discovery |
| `qa/load/browse.js` | Home, `/lk/store`, category, product pages, `/store/products` API, `_next/static`, `_next/image` |
| `qa/load/cms.js` | `/store/cms`, `/store/offers`, `/store/packing`, `/store/addons`, `/store/products/best-selling`, regions, collections |
| `qa/load/cart.js` | Create cart, add items, add item with add-ons (`/store/carts/:id/addon-items`), change qty, reprice, read |
| `qa/load/checkout-cod.js` | Full COD checkout via store API, double submit + replay duplicate-order checks, QA tagging |
| `qa/load/webhooks.js` | Fake Onepay and Koko webhooks and `/collect`, `/api/collect`, same vs different ids, concurrent bursts |
| `qa/load/live-watch.ps1` | 1 request per 10 s canary against live, to run in a second window |
| `qa/load/run-guide.md` | Install, env, commands, order, VPS watching, stop rules, sharing results, cleanup |

Safety built into the scripts:
- Refuse to start if `STORE_URL` or `API_URL` contains `cardle.lk` without `dev.` (checked at init, throws).
- `MEDUSA_PK`, `BASIC_AUTH_USER`, `BASIC_AUTH_PASS` come from env only. `MEDUSA_PK` missing aborts.
- `TEST_TYPE=smoke|load|stress|spike|soak`. Stress prints a loud warning and **throws** above 1000 VUs unless `CONFIRM_OVER_1000=YES`.
- Hard abort if more than 10% of requests fail after the first minute (`abortOnFail`).
- Default VU scale per script: browse 1.0, cms 1.0, cart 0.2, checkout 0.02, webhooks 0.02 (override with `-e SCALE=`).
- Checkout orders: email `qa-load+<vu>@cardle.lk`, `metadata.qa_load=true`, `metadata.qa_run=<RUN_ID>`.

Thresholds (all scripts): p95 below 800 ms for pages, static; below 1500 ms images; below 2000 ms API and cart; `http_req_failed` below 1%; `checks` above 99%; checkout adds `duplicate_orders == 0`.

Scripts were syntax checked with Node only. They have **not** been executed against k6 (no k6 and no network here). Expect to fix small things on the first smoke run. Two points to confirm on the first smoke run: the Medusa store payload shapes (`POST /store/payment-collections`, `.../payment-sessions`, `.../complete`) and that `http.setResponseCallback` accepts the 429 exemption on your k6 version.

## 2. Scenarios

| # | Scenario | Script | Real user equivalent | Writes data? |
|---|---|---|---|---|
| S1 | Browse: home, store listing, category, 2 products, assets | browse.js | Anonymous visitor, most traffic | no |
| S2 | CMS decoration endpoints | cms.js | Nav/hero/promo bar on every page | no |
| S3 | Cart: add, add-ons, qty, reprice | cart.js | Shopper adds bags | carts (tagged) |
| S4 | COD checkout, double submit | checkout-cod.js | Buyer pays cash on delivery | **orders (tagged)** |
| S5 | Webhook/collect burst, same and different ids | webhooks.js | Onepay/Koko callbacks, bots | no (fake ids) |
| S6 | Soak: 100 VUs for 60 min | browse.js soak | Steady evening traffic, leaks | no |
| S7 | Spike: 50 to 2000 to 50 | browse.js spike | Meta ad or influencer burst | no |

Not scripted (needs a browser or real gateway, so not safe or not possible with k6): Onepay popup payment, Koko and Mintpay redirects, login/account pages, search (Meilisearch).

## 3. 100,000-user launch math

### Assumptions (change them, the formulas stay)

- 100,000 visitors (sessions) in 24 h. All traffic Sri Lanka, evening heavy, Meta ads drive bursts.
- Profiles: **A average day** (flat), **B peak hour** (15% of the day in one hour), **C ad spike** (8% of the day, 8,000 sessions, in 15 minutes).
- Session: 5 page views, 180 s long (think time about 36 s per page).
- Per first page view: about 40 `_next/static` files (browser caches them afterwards), 12 `_next/image` requests per page.
- Funnel: 8% of sessions add to cart, 3% reach checkout, 1.5% place an order (1,500 orders/day).
- API calls: SSR makes about 2 uncached backend calls per page (cart for visitors with a cart cookie, categories, customer). Cart session about 12 calls, checkout session about 14 calls.
- Concurrency (Little's law): concurrent sessions = arrival rate x session duration.

### Result

| Metric | A average | B peak hour | C ad spike |
|---|---|---|---|
| Arrival rate (sessions/s) | 1.16 | 4.17 | 8.9 |
| Concurrent sessions (x180 s) | 208 | 750 | 1,600 |
| HTML pages/s (x5), all reach origin (see 4.1) | 5.8 | 20.8 | 44.5 |
| `_next/static` req/s (about 40 per session, if not cached by CDN) | 46 | 167 | 356 |
| `_next/image` req/s (about 60 per session) | 70 | 250 | 534 |
| Backend API req/s from SSR (x2 per page) | 12 | 42 | 89 |
| Backend API req/s from carts and checkout | 1.6 | 5.8 | 12 |
| **Backend API total req/s** | **about 14** | **about 48** | **about 100** |
| Orders per minute | 1.0 | 3.8 | 8.0 |

How to read the k6 numbers against this: a k6 VU is far busier than a human. With a 1-3 s think time one VU loads about 0.4 pages/s, so **the modeled spike (44 pages/s) is only about 110 k6 VUs**, and the `load` test at 500 VUs is roughly 4 to 5 times the modeled ad spike. 2,500 and 5,000 VUs are far beyond launch needs and are mostly a way to find the breaking point, not a target. A reasonable launch target: spike profile passes at SCALE 0.25 to 0.5 (500 to 1,000 VUs) with thresholds met, with live untouched.

Pass criteria to pencil in: at 110 to 250 VUs (profile C and 2x headroom) page p95 below 800 ms, API p95 below 2000 ms, errors below 1%, Postgres connections below 60% of `max_connections`, VPS CPU below 70%.

## 4. Code-based bottleneck analysis

Severity here means launch capacity risk, not correctness.

### 4.1 Every HTML page is rendered by the Next.js origin (high)

- `storefront/next.config.js:124` sets `Cache-Control: no-store, must-revalidate` on everything except `_next/static`, `_next/image` and `favicon.ico`. That includes all HTML. Cloudflare will not cache any page and neither will browsers.
- The pages are also dynamic in practice: the nav renders `CartButton` which calls `retrieveCart()` (reads the `_medusa_cart_id` cookie, `src/modules/layout/components/cart-button/index.tsx`), and `src/middleware.ts` runs on every page request.
- `generateStaticParams` exists on product, category, collection pages but does not help once the layout reads cookies (unverified at build, check `next build` output for "ƒ (Dynamic)" markers).
- Result: every page view is an SSR render in one Node process. Profile C is about 45 SSR/s. That is the single biggest CPU consumer on the storefront container, together with images (4.2).
- The Next data cache does protect the backend: products revalidate every 300 s (`products.ts` `PRODUCTS_REVALIDATE_SECONDS`), regions 3600 s, collections, CMS 60 s, addons/packing 60 s, offers 60 s, best-selling 3600 s. So a warm page costs close to zero backend calls except the uncached ones below.

Uncached per-request calls from SSR (from code):
- `retrieveCart()` for any visitor with a cart cookie: `sdk.store.cart.retrieve(...)`, only tags, no revalidate, runs on every page via the nav (`cart.ts:18`).
- `getCustomer()` on account, cart, checkout pages.
- `src/lib/data/categories.ts`: `listCategories`, `getCategoriesList`, `getCategoryByHandle` and the first call in `listNavCategories` have only `tags`, no `revalidate`. On Next 15 an untagged-by-time fetch is not cached by default, so these likely hit the backend on every render (unverified, depends on Next version behavior; confirm with backend access logs during the browse smoke).
- `listNavCategories` then fires one `product.list` per top-level category (N+1, cached 300 s).

### 4.2 Image optimizer on the same VPS (high)

- `next.config.js` enables `formats: ["image/avif","image/webp"]` and no `minimumCacheTTL`, so the default of 60 s applies. Product uploads are about 1638x2048.
- AVIF encoding with sharp is CPU heavy. At profile C about 530 image requests/s arrive at `/_next/image`. Unless Cloudflare caches `/_next/image` responses, every miss re-encodes (after 60 s TTL, again).
- This is the most likely first thing to saturate the VPS CPU, and it shares CPU with live.

### 4.3 Medusa read endpoints (medium)

- `GET /store/products` with `*variants.calculated_price,+variants.inventory_quantity,*variants.images` (`products.ts`) is the heaviest read: runs the pricing module with region context and inventory availability. The storefront asks for 12 on the home/store pages and up to 100 on `getProductsListWithSort` (`products.ts:162`, then sorts in Node). Stampede risk exists when the 300 s revalidate expires for many routes at once (stale-while-revalidate softens this).
- `GET /store/products/best-selling` (`backend/src/api/store/products/best-selling/route.ts`) runs `order_item` join `order_line_item` join `order`, group by, over all non-cancelled orders on every call, no limit, no cache header. The storefront caches 1 h, so it is fine now, but cost grows linearly with order history and a bot can call it directly. Add `Cache-Control` and a row limit. (cms.js measures it separately.)
- `/store/cms`, `/store/packing`, `/store/addons` have `Cache-Control: public, max-age=30, s-maxage=60` and are cheap: 1 to 3 simple queries. `/store/offers` loads a promotion with relations every call (cache 60 s header, storefront fetch cache 60 s).
- `addons` indexes exist (`addon_product.product_id`, unique `addon_id,product_id`). No index concern found on the custom tables.

### 4.4 Cart and checkout cost (medium to high)

- Repricing: `retrieveLiveCart()` (`cart.ts:204`) is called by both the cart page and the checkout page. If the cart is older than 15 s it does `POST /store/carts/:id` (a full `updateCart` workflow: pricing, promotions, tax) and then re-fetches the cart. The cart drawer's `syncCart()` does the same at most every 20 s per tab. So each cart or checkout page view is about 2 heavy API calls on top of the normal ones, and every checkout step calls `revalidateTag("cart")` which re-renders the page and re-runs them.
- `placeOrder()` (`cart.ts:764`) makes up to 6 sequential backend calls before `cart.complete` (stock check, contact check, COD limit check, fresh cart read, optional address update, optional metadata update).
- `cart.complete` is the heaviest single call (order creation workflow, inventory reservation, payment authorize, locks), followed by `order.placed` subscribers: email (Resend), Meta CAPI Purchase, `cardle-ops-webhook` fetch, `order-placed-enrich` query. These run in the same process in `shared` worker mode.
- Rate limits (`backend/src/api/middlewares.ts`): `cart-complete` 10/min **per cart id** (good: customers do not share a bucket), `/store/onepay/*` 60/min keyed per cart or txn (the comment says the storefront server makes the calls so there is no client IP; this was a real risk with per-IP keys and is now addressed). `/webhooks/*` are per source IP, 60/min: gateway callbacks come from a few IPs, which is fine at 8 orders/min but would throttle a burst of callbacks.
- Packing route does delete then add then update, 3 workflows per call.
- COD limit (LKR 8,000) is enforced only in the storefront `placeOrder` (`codOverLimit`). A grep of `backend/src` finds no server-side check, so a direct API call can place a larger COD order (minor, not capacity).
- Onepay polling: while the popup is open the browser calls `/api/onepay/status` every 2.5 s (`payment-button/index.tsx:730`), which calls `/store/onepay/js-confirm` (Onepay API call each time). 120 concurrent card checkouts means 48 Onepay status calls/s from this path alone. Fine for a normal day, a risk at spike.

### 4.5 Onepay every-minute watcher (`backend/src/jobs/onepay-reconcile.ts`) (high at scale)

How it works: cron `* * * * *`. It takes a Redis lock (`onepay:reconcile:lock`, `EX 58`), settles all "retryable" attempts (full sweep every 5 minutes over links up to 48 h old, otherwise last 30 min), then loops for about 50 s: every 5 s it lists attempts younger than 15 min that are `pending` or `recovered` and settles each.

`settle()` is a **sequential** `for` loop and each attempt does a real Onepay status HTTP call (`fetchStatus`, no timeout set on `fetch`).

Load model at launch (profile B/C, 40% card, abandoned link rate about 2x orders; assumptions):
- Attempts created per day: about 1,500 orders x 40% card x 3 = about 1,800 (plus retries).
- Links "hot" in a 15 min window at peak: about 60 to 90. A sweep at about 0.4 s per call is 24 to 36 s, so the 5 s cadence stretches to roughly one sweep per 30 s, delaying server-side order creation after a customer closes the tab (design target was about 5 s).
- Status stays `pending` until Onepay says failed, or paid, or it is older than 24 h and not paid (`expired`). So pending attempts accumulate up to 24 h x 1,800/day. The 5-minute full sweep covers all of them sequentially: about 1,800 x 0.4 s = **12 minutes of work per sweep, every 5 minutes**.
- The lock TTL is 58 s and is never renewed. A sweep that runs longer than 58 s lets the next minute's runner start while the first is still going, so runners overlap and multiply Onepay API calls. Overlap protection only holds while a run is under 58 s.
- Outbound: with 1,800 pending in the 24 h window, every 5 minutes about 1,800 Onepay status calls (6/s average, with overlap more), using the production token. Risk: Onepay rate limiting or blocking the token, which would also break the customer-facing confirm path.
- Redis cost per sweep: `zrangebyscore` + `mget` of all attempts, cheap. `query.graph` runs only for paid attempts.
- It runs in the same Node process as the API (`MEDUSA_WORKER_MODE` default `shared`, `constants.ts:165`). Long awaited HTTP does not block the event loop, but holds a worker slot and fills the Medusa DB pool only when it queries.

Not a problem today (about 100 orders/day) but it is a launch-day scaling cliff. Suggestions in section 7.

Legacy callback: `backend/src/api/api/collect/route.ts` (served as `/api/collect`) is the **old** implementation still in the tree. It lists the first 100 payment sessions and first 100 payments (`take: 100`) and matches in memory, so any session beyond the 100th is never found, and it does not use the attempts ledger. `backend/src/api/collect/route.ts` (served as `/collect`) is the hardened one. If Onepay's dashboard callback URL points at `/api/collect`, payments after the first 100 sessions will not be settled by the callback (the watcher still catches them). Check which URL Onepay uses and delete or redirect the other. Both `/collect` routes have **no rate limit** and each call makes an outbound Onepay API call, so an attacker or load test can drive calls to Onepay with the production token and fill the logs with `logger.info(JSON.stringify(headers...))` (the incoming headers are logged in full, check no secrets get logged).

### 4.6 Webhook idempotency (medium)

- `/webhooks/onepay` and `/webhooks/koko` emit one `payment.webhook_received` event per call with `delay: 5000, attempts: 3`. There is no dedupe of repeated identical callbacks: 5 identical callbacks produce 5 queued jobs. Idempotency relies on downstream: Onepay `authorizePayment` re-verifies with Onepay's status API and the cart completion is locked per cart, so duplicates should be harmless but cost queue and Onepay calls. webhooks.js measures this: what to look for is in section 6.
- `/webhooks/onepay` accepts any body claiming `status:1 SUCCESS` and queues it. The authenticity check happens later (authorize re-queries Onepay). The fake `payses_QA_FAKE_*` ids therefore queue jobs that fail to find a session. Expect failed-job log lines and retries (3 attempts), not orders.
- Koko with an invalid signature logs a warning **and** calls `Sentry.captureMessage` on every request (`koko-payment/service.ts:391`). A flood of junk requests would burn Sentry quota. The rate limit (60/min per IP) bounds this per IP only.

### 4.7 Database and Redis (high because shared)

- Pool: `medusa-config.js` sets no `databaseDriverOptions`. In `pg-connection-loader.js:24-25` the pool max comes from `driverOptions.pool.max` (undefined) so the Knex/tarn default max (about 10) applies (unverified at runtime). One backend process serves API, subscribers, event bus and the every-minute job, all on that pool. At about 100 API req/s with 100-300 ms workflow calls, 10 connections is tight. Symptom: latency climbs while Postgres CPU is low and logs show "Knex: Timeout acquiring a connection".
- One Postgres serves live (`railway` DB) and dev (`cardle_v2`) so `max_connections`, shared_buffers, page cache and WAL IO are shared. Dev load takes live's IO and connection slots directly.
- Redis is the event bus, workflow engine, rate limiter and the Onepay attempts ledger (`onepay:attempt:*`, `onepay:attempts`, `onepay:reconcile:lock`, 14 day TTL). The ledger is described as "durable-ish": a Redis restart or an eviction policy other than `noeviction` loses attempts that the watcher needs to recover paid-but-unmatched orders.
- Shared Redis between dev and live (stated in CONTEXT) is a correctness risk, not only a capacity one, **if both use the same DB index and BullMQ prefix** (unverified, check `REDIS_URL` of both apps). Same index would mean: dev and live compete for the same `onepay:reconcile:lock`, dev's watcher would process live payment attempts (carts not found in the dev DB so it flags "PAID BUT NOT MATCHED" and sends Sentry errors), and dev workers could consume live events from the same queue. Verify before running any dev test that writes: `run-guide.md` step 3.5.
- Indexes: Medusa core tables are indexed for these flows. No missing index found in custom modules. `order_item`/`order_line_item` aggregation for best-selling is a full scan (acceptable at current size).

### 4.8 Static assets (low)

`/_next/static` is excluded from the no-store header, so Next serves it with immutable caching. Fonts from Google and media from `media.cardle.lk` (MinIO) are off the VPS web path but MinIO origin bandwidth is not checked (unverified).

## 5. Risk of the shared VPS (dev and live)

- One host: dev and live Next.js and Medusa containers, Postgres, Redis, probably MinIO and Coolify itself compete for the same CPU, RAM, disk IO and network. Any dev load is also live load. Coolify (builds, health checks) can also go unresponsive.
- One Postgres: connection slots and IO shared. A dev test that holds 50 connections takes 50 slots from live.
- Memory: the Linux OOM killer chooses by memory size, not by importance. A dev backend growing under load can get the **live** Postgres or backend killed.
- Cloudflare: both `cardle.lk` and `dev.cardle.lk` are in the same zone. Heavy test traffic from one IP can trigger zone-wide WAF/bot rules for that IP and shows up in live analytics only if it reaches live.
- Dev orders trigger real side effects if the env is copied from live: Meta CAPI Purchase, Cardle Ops webhook, Resend emails (dev sends none today). Check env before the checkout test.
- Test traffic cannot be told apart from real traffic in shared logs: use the `User-Agent: cardle-qa-load/1.0` and `qa_run` metadata to filter.
- Mitigations in the tooling: live guard, stop rules, live canary, hard abort at 10% errors, conservative default scales. Residual risk remains; the real fix is a separate server (section 7.8).

## 6. What to look for in each run

| Script | Good | Bad / report |
|---|---|---|
| browse | page p95 below 800 ms, 0 errors, VPS CPU flat | page p95 above 800 ms from the first VU (expected: no-store plus SSR), `/_next/image` p95 climbing, CPU of `storefront` container pegged |
| cms | all 200, p95 below 300 ms | `best-selling` slow, `rate_limited_429` rising |
| cart | line-item and reprice p95 below 2 s | reprice (POST cart `{}`) much slower than add, DB connection wait errors |
| checkout-cod | `duplicate_orders == 0`, every order has `qa_load`, the replay returns the same id | any duplicate order id, 5xx on complete, lock timeouts, inventory negative |
| webhooks | every response 200 (or 429 past 60/min), no new rows in `payment`, `"order"`, no `onepay:attempt:QA_FAKE*` keys | 5xx, order or payment created from a fake id (blocker), event queue (BullMQ) growing and not draining, Sentry flooded, `/api/collect` and `/collect` outbound calls to Onepay (watch backend logs for `Querying OnePay transaction status`) |

Webhook "same vs different" expectation: SAME (5 identical concurrent callbacks) must create zero orders and at most the same number of failed retry jobs, not 5 orders. DIFFERENT behaves the same. If any backend log shows `Found Medusa payment session` for a QA_FAKE id, stop and report.

## 7. Recommendations

1. **Cloudflare cache rules (biggest win).**
   - Cache `/_next/static/*` (already immutable) and `/_next/image*` for at least 7 days, "Cache Everything", cache key includes the query string, Edge TTL override, ignore the origin's 60 s. Then raise `images.minimumCacheTTL` in `next.config.js` to 31 days as well so Next stops re-encoding.
   - Cache `media.cardle.lk/*` for 30 days.
   - HTML: either keep dynamic (cookie reader) or cache anonymous HTML at the edge for 60 s with a rule "no `_medusa_cart_id` cookie" and bypass on cart, checkout, account, order, `/api`. That cuts profile C origin pages from 45/s to a few per minute. Requires dropping the global `no-store` for those routes (use `s-maxage=60, stale-while-revalidate=300`).
   - Cache GET `api.cardle.lk/store/cms|offers|packing|addons|regions|collections|product-categories` for 60 s (the routes already send `s-maxage=60`), never cache `/store/carts*`, `/store/payment*`, `/store/onepay*`, `/webhooks*`, `/collect`.
   - Enable Cloudflare rate-limit rules: 100 req/min per IP on `/lk/*` HTML, tight on `/collect`, `/api/collect`, `/webhooks/*`, `/store/contact`.
2. **ISR / static where possible.** Move the cart cookie read out of the layout (render the cart button client side from a small API route) so product, category, collection, home and store pages can be statically rendered with `revalidate = 300` and `generateStaticParams`. That removes SSR from the hot path entirely and is the structural fix for 4.1. Add `revalidate` to the four category fetches in `categories.ts`.
3. **DB pool and Postgres.** Set `projectConfig.databaseDriverOptions = { pool: { min: 2, max: 25 } }` (or env equivalent) for the live backend, and confirm Postgres `max_connections` at least 150 with PgBouncer in transaction mode if you add a second backend instance. Watch `pg_stat_activity` during the run. Give live and dev different Postgres roles with `CONNECTION LIMIT` so dev cannot take live's slots.
4. **Run server and worker separately for live.** Two containers from the same image with `MEDUSA_WORKER_MODE=server` and `worker`, so subscribers and the Onepay watcher never compete with API requests, and `MEDUSA_DISABLE_ADMIN=true` on the server instance.
5. **Onepay watcher hardening.** Process attempts with limited concurrency (5 to 10 in parallel), add a `fetch` timeout (5 s), cap work per run, renew or lengthen the lock for the whole run, expire unpaid links after the real Onepay link validity (for example 2 h, not 24 h), and back off checks by age (every minute below 15 min, every 5 min below 2 h, every 30 min after). Delete or redirect `src/api/api/collect/route.ts`, add a rate limit and a size cap to `/collect`, and stop logging full headers.
6. **Indexes and queries.** No missing index found in custom modules. Add `Cache-Control` and `LIMIT` to `best-selling`, or precompute daily. Drop `limit: 100` plus Node sort in `getProductsListWithSort` if the catalog grows.
7. **Redis hygiene.** `maxmemory-policy noeviction`, persistence (AOF everysec), and separate Redis instances (or at least DB index and `keyPrefix`) for dev and live. Add a Redis memory alert.
8. **Separate VPS for dev** (or run dev only on demand). Until then do not run anything above `load` SCALE 0.2 against dev. A second small VPS also lets you load test from a separate box and not your PC.
9. **VPS sizing.** For profile C with the fixes above (CDN cached assets, images and anonymous HTML), 4 vCPU and 8 GB for storefront + backend + worker, plus a separate 2 vCPU for Postgres + Redis, is a sensible start. Without the CDN rules, expect the Next.js container to need 8+ vCPU at 45 SSR/s plus image encoding. Verify with the k6 numbers rather than guessing: use the `browse.js` spike results and docker stats to compute CPU-seconds per page and extrapolate.
10. **Launch-day operations.** Pre-warm the Next cache (hit the top 30 URLs) before announcing. Raise `cart-complete` and `onepay-js` limits only if 429s appear in logs. Put a status check on `/health`. Have the maintenance flag (`ENABLE_MAINTENANCE_MODE`) ready as a pressure valve. Schedule ad bursts to ramp, not start at full spend.

## 8. Results (to fill after the owner run)

Environment: dev, shared VPS. Date/time window: pending owner run. PC and connection: pending owner run.

### Smoke

| Script | Result | p95 page | p95 API | Error % | Notes |
|---|---|---|---|---|---|
| browse | pending owner run | pending | pending | pending | |
| cms | pending owner run | n/a | pending | pending | |
| cart | pending owner run | n/a | pending | pending | |
| checkout-cod | pending owner run | n/a | pending | pending | duplicates: pending |
| webhooks | pending owner run | n/a | pending | pending | orders created from fake ids: pending |

### Load, spike, soak, stress

| Test | Peak VUs | p95 page | p95 API | p95 image | Error % | 429 count | Peak VPS CPU | Peak PG conns | Live canary baseline / peak | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| browse load | 500 | pending owner run | pending | pending | pending | pending | pending | pending | pending | pending |
| cms load | 500 | pending owner run | n/a | n/a | pending | pending | pending | pending | pending | pending |
| cart load | 100 | pending owner run | n/a | n/a | pending | pending | pending | pending | pending | pending |
| browse spike | 2000 | pending owner run | pending | pending | pending | pending | pending | pending | pending | pending |
| browse soak (60 min) | 100 | pending owner run | pending | pending | pending | pending | pending | pending | pending | memory trend: pending |
| browse stress | 1000 / 2500 / 5000 | pending owner run (owner decision) | | | | | | | | |

### Capacity conclusion

Maximum sustainable concurrent sessions on dev (shared VPS): pending owner run.
Breaking point and first failing component: pending owner run.
Headroom against profile C (1,600 concurrent sessions, about 100 API req/s, 45 pages/s): pending owner run.
Cleanup done (orders cancelled, carts deleted, Redis checked): pending owner run.

## 9. Top 5 capacity risks (summary)

1. **All HTML is SSR on one Next process with `no-store` everywhere** (`next.config.js:124`, cart cookie read in the nav). 45 renders/s at the ad spike with no CDN help.
2. **Image optimizer (AVIF) on the same VPS, 60 s default cache TTL**: about 530 image requests/s at the spike, CPU bound, takes live down with it.
3. **Onepay watcher scales as O(pending attempts), sequential, with a 58 s lock that is never renewed**: at launch volume sweeps take minutes, overlap, hammer Onepay with the production token and delay order creation. Legacy `/api/collect` still scans 100 sessions and `/collect` has no rate limit.
4. **Shared VPS, Postgres and Redis between dev and live**: dev load directly steals live CPU, RAM, IO and connection slots; a shared Redis index would also mix the Onepay ledger, lock and event queue (unverified).
5. **Default DB pool (no `max` configured) with API, subscribers and job in one process** and heavy cart/checkout workflows (repricing on every cart and checkout view, double reprice per step): connection starvation before CPU runs out.
