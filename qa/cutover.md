# Cutover readiness (contabo -> V2), release engineer report

V2 can be upgraded in place on the live DB `railway`: same Medusa 2.13.6 as contabo, only 3 additive migrations (2 new modules), no core migrations. Cutover is safe only if migrations are run by hand, Redis is separated from dev, and a few env values are set to prod values (details below).

STATUS: PASS WITH ISSUES
Counts: blocker 3, major 5, minor 4. (Code review only; nothing here was verified against Coolify, Cloudflare, Onepay, Koko, Mintpay or the live DB. Items marked "unverified" need Nadun to check.)

Branch facts: merge-base c8362b6, V2 = 72 commits ahead of origin/contabo, contabo = 5 commits ahead of V2 (see CUT-09). `tsc --noEmit` and `next lint` pass on storefront (V2 turned off `ignoreBuildErrors` and `ignoreDuringBuilds`, so the build now fails on any TS/lint error; both are clean today).

---

## Issues

### CUT-01 Dev and live share one Redis with no namespacing
- Severity: blocker (unverified: depends on how REDIS_URL is set in Coolify)
- Where: backend/medusa-config.js:118-137 (event-bus-redis, workflow-engine-redis), backend/src/lib/redis.ts, backend/src/modules/onepay-payment/attempts.ts:36-38, backend/src/jobs/onepay-reconcile.ts (lock key `onepay:reconcile:lock`, `onepay:reconcile:full`)
- Evidence: Medusa's Redis event bus uses queue `events-queue` and the workflow engine uses `medusa-workflows` / `medusa-workflows-jobs` (defaults in @medusajs/event-bus-redis and workflow-engine-redis 2.13.6). Onepay ledger keys are `onepay:attempt:*`, `onepay:attempts`, `onepay:override:*`. Rate-limit keys are `ratelimit:*`. None take a prefix from env. CONTEXT.md says dev and live share ONE Redis.
- Expected vs actual: live and dev must not share queues. If both point at the same Redis DB index, (a) a dev backend can pick up live `order.placed` jobs, fail to find the order in `cardle_v2`, and the customer email never goes (dev has no email provider), (b) both run the every-minute `onepay-reconcile` job and fight over the lock, and dev would mark live Onepay attempts `needs_review`/"no cart link", (c) the live rate-limit counters mix with dev/QA traffic.
- Suggested fix: give prod its own Redis DB index (or its own Redis container) before cutover, e.g. dev `redis://redis:6379/1`, prod `redis://redis:6379/0` (a different DB index separates BullMQ keys and the app keys). Safer is a separate Redis container. Then check `redis-cli -n 0 keys 'onepay:*'` from prod only shows prod attempts. Also set `MEDUSA_WORKER_MODE=shared` on prod (single instance).

### CUT-02 Migrations do not run on Coolify start for the live DB
- Severity: blocker (process)
- Where: backend/package.json `start` = `init-backend && cd .medusa/server && medusa start`; node_modules/medusajs-launch-utils/src/initializeBackend.js
- Evidence: `seedOnce()` only runs `medusa db:migrate` when `SELECT 1 FROM "user"` fails ("relation user does not exist"). The live DB has a user table, so it logs "Database is already seeded. Skipping seeding." and never migrates.
- Expected vs actual: tables `cms_banner`, `cms_setting`, `addon`, `addon_product`, `packing_option` and column `cms_banner.text_color` must exist. Without them `/store/cms`, `/store/addons`, `/store/packing`, `/store/carts/:id/addon-items`, `/store/carts/:id/packing`, the admin CMS and Add-ons pages return 500. The storefront catches `/store/cms` errors (src/lib/data/cms.ts) and shows built-in content, but the checkout packing and add-on routes are not guarded the same way (unverified: needs browser).
- Suggested fix: run the migration step explicitly before switching traffic (commands in section "Data plan"). Add it to the checklist as a hard gate.

### CUT-03 Server-side rate limits key on one IP: all customers share a bucket
- Severity: blocker (code evidence strong; real behaviour unverified until a prod-like test)
- Where: backend/src/lib/rate-limit.ts:4-9 (key = first `x-forwarded-for` entry), backend/src/api/middlewares.ts:58-75, storefront/src/lib/config.ts (sdk has no client-IP forwarding), storefront/src/app/api/onepay/status/route.ts, storefront/src/modules/checkout/components/payment-button/index.tsx:724-730
- Evidence: the storefront calls the backend from the Next server (server actions and `/api/onepay/status` route handler), and no code forwards the customer's IP (only cart.ts:752/815 reads x-forwarded-for, for Meta CAPI). So the backend sees the storefront server's IP for everyone. Limits: `/store/onepay/*` 30 per minute, `/store/carts/:id/complete` 10 per minute, per IP. The popup polls `/api/onepay/status` every 2.5s per customer, and each poll calls `/store/onepay/js-confirm` = 24 calls/min per paying customer.
- Expected vs actual: 2 customers paying at once (48/min) exceed the 30/min `onepay-js` limit, the poll gets 429, the route returns `pending: true`, and the customer waits on the slower server watcher. Cart completion is capped at 10/min for the whole shop. contabo has the same `cart-complete` limit; the `/store/onepay/*` limit and the polling are new in V2.
- Suggested fix: key these limits per cart, not per IP, using the existing `keyFn` option, e.g. `keyFn: (req) => req.params.id ?? (req.body as any)?.cart_id ?? getClientIp(req)` for `onepay-js` and `cart-complete`. Alternative: raise `onepay-js` to 600/min. Re-run the load test with several parallel buyers from one source after the change.

### CUT-04 Old media hosts removed from next/image allow-list; live DB may still reference them
- Severity: major (unverified: needs a DB query)
- Where: storefront/next.config.js:44-80
- Evidence: V2 removes `bucket-uat-5fec.up.railway.app` and the medusa demo S3 hosts from `images.remotePatterns`. Only `media.cardle.lk`, the backend host, NEXT_PUBLIC_BASE_URL host and NEXT_PUBLIC_MINIO_ENDPOINT remain. The contabo comment says rows in the DB had the old host baked in until `backend/src/scripts/migrate-media-urls.ts` was run (dry-run by default).
- Expected vs actual: any product `thumbnail` or `image.url` still on the old host renders a broken image on V2 (next/image 400).
- Suggested fix: before cutover run on `railway`: `select count(*) from image where url like '%bucket-uat-5fec%'; select count(*) from product where thumbnail like '%bucket-uat-5fec%';` (also `%medusa-%.amazonaws.com%`). If non-zero, run `npx medusa exec ./src/scripts/migrate-media-urls.ts` (dry run) then `-- --execute`, or re-add the host to remotePatterns for the first week.

### CUT-05 Koko and Mintpay default to sandbox, Onepay default base URL changed
- Severity: major
- Where: backend/src/lib/constants.ts (KOKO_BASE_URL default `https://qaapi.paykoko.com`, MINTPAY_ENV default `sandbox`, ONEPAY_BASE_URL default changed from `https://merchant-api-live-v2.onepay.lk` to `https://api.onepay.lk`)
- Evidence: all three read env with these defaults. If the prod Coolify app has no explicit value, Koko and Mintpay silently talk to sandbox. For Onepay, a live env that relied on the old default now calls `api.onepay.lk` (the collect route already used that host, so the code is internally consistent, but Onepay account/keys must be valid on it).
- Expected vs actual: prod must set `KOKO_BASE_URL` to the live Koko API, `MINTPAY_ENV=live` (and `MINTPAY_BASE_URL` if used), and `ONEPAY_BASE_URL` explicitly.
- Suggested fix: set all three explicitly on `backend-prod` and confirm the live Koko public key/merchant id (webhook signature check) and Mintpay merchant id/secret are the live ones, not sandbox.

### CUT-06 Hidden "Packing" product leaks into sitemap, feeds and direct URL
- Severity: minor (only after packing is switched on in admin)
- Where: backend/src/modules/addons/packing-product.ts:18-38, storefront/src/app/sitemap.ts:13-18, backend/src/lib/meta-catalog-feed.ts:150-170, storefront/src/app/feed/google-merchant.xml/route.ts
- Evidence: the product `internal-packing` (status published, LKR 0, `metadata.internal = true`) is filtered only in `listProducts` (storefront/src/lib/data/products.ts:120). The sitemap and both feeds do not filter it. The feeds skip items with no image, so it is probably dropped there (unverified), but the sitemap lists `/lk/products/internal-packing` and the page is reachable.
- Expected vs actual: the product must not be indexable or purchasable on its own.
- Suggested fix: filter `p.metadata?.internal` in sitemap.ts and in both feed builders, and return 404 from the product page when `metadata.internal` is true.

### CUT-07 After migration the top promo bar disappears until it is re-created
- Severity: major
- Where: backend/src/api/store/cms/route.ts:19-21, storefront/src/lib/data/cms.ts:8-12
- Evidence: with empty `cms_setting`, `/store/cms` returns `promo_bar: null` which the storefront treats as "reachable and switched off (show nothing)". Banners are safe: empty banners fall back to the built-in hero slides (hero/index.tsx:23).
- Expected vs actual: contabo shows its built-in promo bar; V2 shows none until a `promo_bar` setting exists.
- Suggested fix: create the promo bar (and any hero/page banners wanted) in Admin > Site CMS right after migrating, or copy `cms_setting`/`cms_banner` rows from `cardle_v2` (see Data plan, step "backfill").

### CUT-08 Storefront has no noindex switch; robots/sitemap hardcode cardle.lk
- Severity: major (SEO risk for dev, none for prod)
- Where: storefront/src/app/robots.ts:3, storefront/src/app/sitemap.ts:4, storefront/src/app/layout.tsx:58-67
- Evidence: `robots` allows all and `index: true` always; no env var toggles noindex, and the sitemap URL is hardcoded to https://cardle.lk. So dev.cardle.lk is indexable if Google finds it, and its robots.txt points crawlers at the live sitemap. Maintenance/coming-soon modes exist (NEXT_PUBLIC_ENABLE_*), but they are not noindex.
- Expected vs actual: dev should send noindex; prod must not. Prod is currently correct.
- Suggested fix: in Cloudflare add a Transform Rule on dev.cardle.lk / api-dev.cardle.lk adding `X-Robots-Tag: noindex, nofollow`, or put dev behind Cloudflare Access. No code change needed for prod.

### CUT-09 contabo has 5 commits V2 does not contain
- Severity: major (content/behaviour regression if not carried)
- Where: `git log HEAD..origin/contabo`
- Evidence: all 5 are present in V2 under different hashes (`git cherry` shows 2 content commits `+` = equivalent patch exists in V2, 3 `-` = not found by patch id but same subjects exist in V2 history: 375aae4 -> afe2e85, dc1cb59 -> eb8ea45, faeb529 -> 97d3e61). However `git diff HEAD origin/contabo --stat` shows differences in cart.ts, payment-button, addresses, shipping/footer etc. These are mostly V2 rewrites (Onepay popup, packing). 
- Expected vs actual: confirm nothing hotfixed on contabo after the split is lost (stock check before pay, address flush, LKR 500 / 3-10 days content). Unverified line by line.
- Suggested fix: the lead runs `git diff v2-prelaunch-fixes origin/contabo -- storefront/src/lib/data/cart.ts storefront/src/modules/checkout/components/addresses/index.tsx` and confirms the stock-verification and address-flush logic exist in V2 before tagging the release.

### CUT-10 Sentry environment tag cannot tell dev from prod; storefront has no Sentry
- Severity: minor
- Where: backend/src/lib/sentry.ts:18 (`environment: process.env.NODE_ENV`)
- Evidence: both Coolify backends run NODE_ENV=production, so events are tagged identically. @sentry/node is a backend dependency only.
- Suggested fix: use `process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV` and set `SENTRY_ENVIRONMENT=prod|dev`; or use a separate DSN for dev.

### CUT-11 Stale TODO and dual Resend env names
- Severity: minor
- Where: backend/medusa-config.js:~158 (TODO about onboarding@resend.dev), backend/src/lib/constants.ts:77 (`RESEND_FROM_EMAIL || RESEND_FROM`)
- Evidence: the email provider is only registered when BOTH `RESEND_API_KEY` and `RESEND_FROM_EMAIL`/`RESEND_FROM` are set. If prod has only one, no order emails are sent and nothing errors loudly. The prod from must be an address on a Resend-verified cardle.lk domain (orders@cardle.lk per CONTEXT).
- Suggested fix: confirm both vars on `backend-prod`; check the backend boot log shows the resend provider; delete the stale TODO.

### CUT-12 Dev-only helper files are shipped in the repo
- Severity: minor
- Where: backend/debug-subscriber.ts, backend/test-email.ts, backend/test-retrieve.ts, backend/fix-geo.js, storefront/scratch.ts, backend/.harness/
- Evidence: not imported by app code (medusa build compiles src/ only), so no runtime effect; `storefront/scratch.ts` is inside the TS project and compiles (tsc passes).
- Suggested fix: leave for after launch.

---

## 1. Data plan

Recommendation: in-place upgrade of the live DB `railway`. Do NOT move to a new DB.

Why:
- Medusa core is identical on both branches: @medusajs/medusa, framework, cli all 2.13.6 (backend/package.json lines 29-33 identical on contabo and V2); Next ^15.5.15 on both. `git diff origin/contabo...HEAD --stat -- '*package.json'` is empty. So there are NO core module migrations to run.
- V2 adds exactly 3 migration files, all idempotent and additive (`create table if not exists`, `add column if not exists`):
  - cms/Migration20261108205922: `cms_banner`, `cms_setting`
  - cms/Migration20261125000000: `cms_banner.text_color` (nullable)
  - addons/Migration20261108212445: `addon`, `addon_product`, `packing_option`
- No `src/links` (no link-table sync needed), no change to existing tables, no destructive step.
- A new DB would need orders, customers, carts, payment collections, inventory, product images, price lists, regions and promotions copied across; high risk of losing orders placed between copy and switch. `cardle_v2` is a dev DB with test data and test orders.

Rehearsal (do once, 10 min, no impact on live): `createdb cardle_rehearsal`, restore a fresh `railway` dump into it, point a throwaway backend run (or `npx medusa db:migrate` with DATABASE_URL set to it) at that DB, and confirm the 3 migrations apply cleanly and `/store/cms` answers.

Backfills / data to check on `railway` (the DB keeps all existing products, customers, orders, price lists, regions, shipping options; these are data, not code):
| Item | Where it lives | Needed action |
|---|---|---|
| CMS banners / promo bar | `cms_banner`, `cms_setting` (new, empty) | Re-create in Admin > Site CMS, or copy rows from `cardle_v2` (see below). Hero falls back to built-in slides if empty; promo bar does not (CUT-07). |
| Add-ons | `addon`, `addon_product` (new, empty) | Recreate in Admin > Add-ons if wanted at launch; empty = feature invisible. |
| Packing | `packing_option` + `cms_setting` key `packing` | Default is disabled (`enabled:false` when no row). Enable only after smoke test; first enable creates hidden product `internal-packing` (CUT-06). |
| Promo CARD_5 (5% card) | Promotion module data | Unverified on `railway`. Storefront applies the code from `NEXT_PUBLIC_PROMO_ONEPAY_CODE`; contabo used the same mechanism so likely exists on live. Check in admin: code exists, active, 5% off, not capped, no campaign end date in the past. |
| Promo BUY2GET1 | Promotion module | Exists on dev only. `/store/offers` returns `buy2get1:false` when absent, so the free-third popup stays hidden: safe default. Create it on live only if the offer should launch. |
| Shipping option LKR 500, 3-10 days | Fulfillment module data | The text changes are in code on both branches; the actual shipping option price is data. Check the live option is LKR 500 flat and that checkout total shows it. |
| Regions (LK / LKR) | Region module | Unchanged; verify `/lk` resolves and `META_CATALOG_REGION_ID` is set if more than one region exists. |
| Price lists, sale prices | Pricing module | Unchanged. |
| Media URLs | `image.url`, `product.thumbnail` | See CUT-04. |

Copy CMS rows from dev to live (optional, instead of re-entering): `pg_dump -U <user> -d cardle_v2 --data-only --table=cms_banner --table=cms_setting --table=addon --table=addon_product --table=packing_option -Fc -f cms_addons.dump`, then `pg_restore -d railway --data-only cms_addons.dump` AFTER migrations. Caveats: `cms_setting.packing` carries a `variant_id` from the dev DB which does not exist on live: delete that row (`delete from cms_setting where key='packing';`) and image URLs must be on media.cardle.lk. `addon_product.product_id` refers to dev product ids; only valid if dev products were cloned from live ids, otherwise re-link in admin.

Exact commands (run on the VPS; names of containers are placeholders, check in Coolify):
```
# 1. backup (see section 4), then deploy V2 backend image to backend-prod WITHOUT sending traffic yet
# 2. migrate, from the backend app dir that `medusa start` uses (.medusa/server in the built image)
docker exec -it <backend-prod-container> sh -c "cd /app/.medusa/server && npx medusa db:migrate"
#   (if the image runs from /app, drop the cd). Expected: 3 migrations executed, no errors.
# 3. sync links (no custom links, harmless, keeps core links up to date)
docker exec -it <backend-prod-container> sh -c "cd /app/.medusa/server && npx medusa db:sync-links"
# 4. verify
docker exec -it <postgres-container> psql -U <user> -d railway -c "\dt cms_* addon* packing_option"
docker exec -it <postgres-container> psql -U <user> -d railway -c "select name from mikro_orm_migrations order by id desc limit 5;"
```
Do not run `npm run seed`; it is a demo seeder.

## 2. Env var diff (names only)

Method: `git grep process.env` on origin/contabo vs HEAD for backend/ and storefront/.

NEW in V2 (not read on contabo):
- Backend: `ONEPAY_WATCH_WINDOW_MS` (optional, default 50000; leave unset on prod)
- Storefront: `NEXT_PUBLIC_ONEPAY_JS` (build-time; "true" enables the Onepay popup), `MEDUSA_BACKEND_URL` (optional server-side backend URL for free-third offers check; falls back to NEXT_PUBLIC_MEDUSA_BACKEND_URL)
- (`OUT`, `RUNS` are from the harness, ignore.)
- Behaviour change without env change: ONEPAY_BASE_URL default (CUT-05).

Build-time (Next inlines at `next build`; changing them needs a storefront REBUILD, not just restart):
`NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` (build fails without it), `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_DEFAULT_REGION`, `NEXT_PUBLIC_ONEPAY_JS`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_MINIO_ENDPOINT`, `NEXT_PUBLIC_PROMO_{STRIPE,ONEPAY,KOKO,MINTPAY,MANUAL}_{CODE,TAG}`, `NEXT_PUBLIC_MINTPAY_CASHBACK_PERCENT`, `NEXT_PUBLIC_SITEWIDE_DISCOUNT_PERCENT`, `NEXT_PUBLIC_ENABLE_COMING_SOON`, `NEXT_PUBLIC_ENABLE_MAINTENANCE_MODE`, `NEXT_PUBLIC_FEATURE_SEARCH_ENABLED`, `NEXT_PUBLIC_SEARCH_*`, `NEXT_PUBLIC_INDEX_NAME`, `NEXT_PUBLIC_STRIPE_KEY`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`. In Coolify mark them "Build Variable" and rebuild after any change. The CSP header in next.config.js also bakes in NEXT_PUBLIC_MEDUSA_BACKEND_URL and NEXT_PUBLIC_SEARCH_ENDPOINT at build time.

Runtime (restart is enough):
- Storefront: `MEDUSA_BACKEND_URL`, `ENABLE_COMING_SOON`, `ENABLE_MAINTENANCE_MODE`, `PORT`, `NODE_ENV`.
- Backend: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `BACKEND_PUBLIC_URL`, `MEDUSA_WORKER_MODE`, `MEDUSA_DISABLE_ADMIN`, `NODE_ENV`, `MINIO_ENDPOINT/ACCESS_KEY/SECRET_KEY/BUCKET`, `ONEPAY_APP_ID/TOKEN/HASH_SALT/BASE_URL/REDIRECT_URL`, `KOKO_*` (API_KEY, MERCHANT_ID, BASE_URL, PRIVATE_KEY, PUBLIC_KEY, PLUGIN_NAME, PLUGIN_VERSION, RETURN_URL, CANCEL_URL, RESPONSE_URL), `MINTPAY_*` (MERCHANT_ID, MERCHANT_SECRET, ENV, BASE_URL, SUCCESS_URL, FAIL_URL), `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (or `RESEND_FROM`), `ADMIN_EMAIL`, `STORE_URL` (email templates; default https://cardle.lk), `NEXT_PUBLIC_BASE_URL` (used by customer/password emails; default https://cardle.lk), `META_PIXEL_ID`, `META_CONVERSIONS_API_ACCESS_TOKEN`, `META_TEST_EVENT_CODE`, `META_CATALOG_REGION_ID`, `SENTRY_DSN`, `CARDLE_OPS_WEBHOOK_URL/SECRET`, optional Stripe, SMTP, Sendgrid, Meilisearch.

Must DIFFER between dev and prod:
| Variable | Dev | Prod |
|---|---|---|
| `DATABASE_URL` | DB `cardle_v2` | DB `railway` |
| `REDIS_URL` | own DB index (CUT-01) | different index/container |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | api-dev.cardle.lk | api.cardle.lk |
| `NEXT_PUBLIC_BASE_URL`, `STORE_URL` | dev.cardle.lk | https://cardle.lk |
| `STORE_CORS` | dev origin | must include https://cardle.lk (and https://www.cardle.lk if www serves content; www currently 301s to apex) |
| `ADMIN_CORS`, `AUTH_CORS` | dev | https://api.cardle.lk and any admin origin; AUTH_CORS includes cardle.lk |
| `BACKEND_PUBLIC_URL` | api-dev | https://api.cardle.lk (admin and local file URLs) |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | dev key | the live DB's publishable key (keys are DB rows, a dev key will not exist on `railway`) |
| `NEXT_PUBLIC_ONEPAY_JS` | true | `true` for the popup (build-time) |
| `ONEPAY_APP_ID/TOKEN/HASH_SALT` | test | live merchant app |
| `ONEPAY_BASE_URL` | explicit | explicit (CUT-05) |
| `ONEPAY_REDIRECT_URL` | dev return URL | `https://cardle.lk/lk/checkout/onepay/return` (unverified exact path: confirm against what contabo used; the popup builds its own `/checkout/onepay/return?txn=` URL client-side) |
| `KOKO_BASE_URL`, `KOKO_*_URL`, keys | sandbox | live; return/cancel/response URLs on cardle.lk / api.cardle.lk |
| `MINTPAY_ENV`, `MINTPAY_*` | sandbox | `live`, success/fail on cardle.lk |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | unset (no email) | set, orders@cardle.lk |
| `META_PIXEL_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_TEST_EVENT_CODE` | test code set | real pixel, test event code UNSET |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | blank or test | live GA4 id |
| `SENTRY_DSN` | dev DSN | prod DSN (+ environment, CUT-10) |
| `NEXT_PUBLIC_ENABLE_COMING_SOON`, `..._MAINTENANCE_MODE` | any | must be `false`/unset at go-live |
| `NEXT_PUBLIC_MINIO_ENDPOINT`, `MINIO_*` | same bucket or dev bucket | prod bucket with existing media (media.cardle.lk) |
| `CARDLE_OPS_WEBHOOK_*` | blank | live ops webhook |
| noindex | none exists in code | not needed on prod (CUT-08) |

## 3. Coolify, DNS/Cloudflare, SSL, media, payment dashboards

Coolify (apps `backend-prod`, `storefront-prod`; unverified what is configured today):
- Deploy branch: change both prod apps from `contabo` to the V2 release branch/tag (a tag, not a moving branch, e.g. `v2.0.0`, so rollback is exact).
- Backend build: `npm run build` (= `medusa build && node src/scripts/postBuild.js`; postBuild copies pnpm-lock and runs `pnpm i --prod --frozen-lockfile` inside .medusa/server, so the build image needs pnpm). Start: `npm run start`. Health: backend `/health` returns 200; storefront `build` runs `await-backend` against NEXT_PUBLIC/ backend URL for up to 20 min, so the prod backend must be up (and reachable from the build container) BEFORE the storefront rebuild.
- Order of deploy: backend first (new image, run migrations, check /health), storefront second (rebuild with prod build vars).
- Persistent storage: media is on MinIO (not the container). If no MINIO_* vars are set the backend silently falls back to local `static/` (ephemeral); confirm they are set on prod.
- Keep one backend instance (the reconcile job and cron jobs run in every instance not in worker mode; Redis lock covers overlap, but keep one).
- Do not enable Coolify auto-deploy on push for prod while QA fixes are still landing on the branch.

DNS / Cloudflare (unverified):
- cardle.lk, www.cardle.lk, api.cardle.lk proxied (orange) to the VPS; SSL/TLS mode Full (strict) with a valid origin cert (Coolify Let's Encrypt or Cloudflare Origin CA). www redirect to apex is handled in next.config.js (301).
- Cache: storefront HTML is `Cache-Control: no-store` already (next.config.js:118-130); static assets under `/_next/static` and `/_next/image` can be cached. Add a Cache Rule: bypass cache for `api.cardle.lk/*` (all of it: carts, `/store/onepay/*`, `/collect`, `/webhooks/*`, `/auth/*`, `/admin/*`), and for `cardle.lk/api/*`, `/*/checkout*`, `/*/cart*`, `/*/account*`. The only cacheable backend GETs are `/store/cms`, `/store/packing`, `/feed/*.xml`, which send their own Cache-Control.
- Turn OFF: Rocket Loader, Auto Minify, "Always Online", Email Obfuscation on the checkout pages, and Bot Fight Mode / Super Bot Fight rules or WAF challenges on `api.cardle.lk/collect`, `/webhooks/*` and `/store/onepay/*` (Onepay, Koko and Mintpay servers would get challenged).
- Cloudflare WAF rate-limit rules, if any, must exempt the payment provider callbacks.
- TTFB: keep proxy on; the Onepay popup and checkout use no websockets.
- Real client IP: Cloudflare sets CF-Connecting-IP and appends to x-forwarded-for; the backend takes the first x-forwarded-for entry, which is the real client IP only for requests that come from a browser through Cloudflare. See CUT-03 for server-originated calls.

Media: existing product images use absolute URLs on `media.cardle.lk` stored in the DB. The V2 minio provider does not change URL shape; it only sanitises NEW upload keys (ASCII, lowercased) so existing objects are untouched. Keep the same bucket, bucket policy (public read) and the `media.cardle.lk` DNS/Cloudflare entry. Check old-host rows (CUT-04). The CSP header is Report-Only, so it blocks nothing on launch; watch console reports for a week before enforcing.

Onepay dashboard (prod app):
- Callback / notification URL: `https://api.cardle.lk/collect` (code serves `/api/collect`?? confirm: file is backend/src/api/collect/route.ts, which Medusa serves at `/collect`, not `/api/collect`. Verify against the URL currently saved in the Onepay dashboard and what contabo expects; the request said `/api/collect`, so check the dashboard value matches a route that exists). Also `/webhooks/onepay` exists as a route (rate limited 60/min).
- Redirect URL: the backend env `ONEPAY_REDIRECT_URL` must point at cardle.lk (not dev). Also confirm the Onepay merchant allows the popup (Onepay.js) from the domain cardle.lk (domain whitelist, unverified).
- Use the live app id/token/hash salt; do a LKR minimum real transaction after cutover and refund it.

Koko: production merchant id, API key, RSA private key (ours) and Koko public key set; return/cancel URLs on https://cardle.lk, response (webhook) URL https://api.cardle.lk/webhooks/koko (confirm route name in backend/src/api/webhooks); give Koko the prod webhook URL and make sure Cloudflare does not challenge it.
Mintpay: `MINTPAY_ENV=live`, live merchant id/secret, success/fail URLs on cardle.lk; ask Mintpay to whitelist the domain if required.

## 4. Backups and rollback

Backup before cutover (on the VPS, Postgres container; all values by name, not shown here):
```
docker exec <postgres-container> pg_dump -U <user> -d railway -Fc -f /tmp/railway_pre_v2.dump
docker cp <postgres-container>:/tmp/railway_pre_v2.dump /root/backups/railway_pre_v2_$(date +%F_%H%M).dump
# copy off the VPS too (rclone/scp). Also dump schema-only: pg_dump -s ...
# verify: pg_restore -l /root/backups/<file> | head; and restore into cardle_rehearsal (see above)
```
Also snapshot the Contabo VPS if available, and note the currently deployed contabo commit/image tag in Coolify.

Restore (only if data was damaged):
```
# stop backend-prod first
docker exec <postgres-container> psql -U <user> -d postgres -c "select pg_terminate_backend(pid) from pg_stat_activity where datname='railway';"
docker exec <postgres-container> dropdb -U <user> railway && docker exec <postgres-container> createdb -U <user> railway
docker exec -i <postgres-container> pg_restore -U <user> -d railway --no-owner < /root/backups/<file>
```
Restoring loses every order placed after the dump; avoid unless data is corrupted.

Rollback plan (code only, normal case): in Coolify redeploy `backend-prod` and `storefront-prod` at the previous contabo commit/tag (storefront needs a rebuild; backend rebuild). DB stays as is.

Is V2 backward compatible with contabo code?
- Yes for the schema: the 3 migrations only ADD tables/a nullable column; contabo code never queries them and Medusa core tables are untouched, so contabo runs fine on the migrated DB. You do NOT need to run `db:rollback` or restore the dump to go back to contabo.
- Data written by V2 that contabo handles badly: (a) orders placed by V2 with add-on lines (`metadata.addons`, unit_price = bag + add-ons) and packing lines display as normal line items on contabo; (b) the hidden product `internal-packing` (if packing was enabled) shows up as a purchasable LKR 0 "Packing" product on the contabo storefront (contabo does not filter `metadata.internal`): set it to `draft` before rolling back; (c) Onepay attempts in Redis are ignored by contabo, so any payment in flight during rollback relies on the old webhook path; roll back only when no popup payments are pending; (d) `cms_*` rows are ignored.
- If you must drop the new tables for a full revert: `npx medusa db:rollback` is not needed; manual `drop table cms_banner, cms_setting, addon, addon_product, packing_option;` plus delete their rows from `mikro_orm_migrations` (only after backend is on contabo). Not recommended; leaving them is harmless.
- Rollback triggers: payment confirmations failing, orders not created after a paid Onepay transaction, 5xx on cart/checkout, images broken site-wide.

## 5. Post-launch smoke test (in order, run on cardle.lk with Cloudflare cache bypass)

1. `https://api.cardle.lk/health` returns 200; backend log shows migrations done, resend provider registered, Redis connected, no `[redis] Connection error`.
2. `https://cardle.lk` redirects to `/lk`, home loads, hero (CMS or default), promo bar, no console errors; `https://www.cardle.lk` 301s to apex.
3. `curl -s https://cardle.lk/robots.txt` and `/sitemap.xml` are the live ones; response headers show `x-robots-tag` absent and HSTS present.
4. Collection and product pages show images from media.cardle.lk (no broken thumbnails); check 3 old products and the newest product.
5. Product page: add to cart (with an add-on if configured); cart shows LKR prices; delivery shows LKR 500, 3-10 working days.
6. Admin login at api.cardle.lk/app: products list loads, Site CMS and Add-ons pages open, an image upload works and the file opens from media.cardle.lk.
7. Checkout address step saves; shipping option LKR 500; COD shown for total <= 8,000, blocked above.
8. Select card: CARD_5 5% is applied, total updates; popup opens (NEXT_PUBLIC_ONEPAY_JS), pay a minimum real card transaction, order is created, success page shows, confirmation email arrives from orders@cardle.lk. Refund it.
9. Close the popup right after paying on a second test: order is still created within about 10 s (server watcher) and exactly one order exists.
10. COD order: place one, check email, Meta CAPI Purchase event arrives (Events Manager, test event code unset so it shows as live), GA4 purchase fires.
11. Koko and Mintpay: start a session each and confirm they redirect to the LIVE provider page (not sandbox), then abandon; check callback URLs resolve.
12. Webhook reachability: from outside, `curl -i -X POST https://api.cardle.lk/webhooks/onepay` returns 4xx from the app (not a Cloudflare challenge page); same for `/collect`.
13. Order appears in admin, invoice page prints with logo and QR, order lookup in account works; customer login/registration works (STORE_CORS/cookies).
14. Feeds: `/feed/meta-catalog.xml` (api) and `/feed/google-merchant.xml` return XML, no `internal-packing` item.
15. Watch logs 30 min: no 429 on `/store/onepay/*` (CUT-03), no `needs_review` lines from `[onepay-reconcile]`, no Redis cross-talk with dev.

## 6. Go-live checklist (rough total about 90 min, no-traffic prep can happen the day before)

Day before
- [ ] (Nadun, 10) Decide the quiet window (low orders, e.g. late night SL time); tell family/ops no orders can be taken for about 15 min.
- [ ] (Claude, 10) Fix CUT-01 (Redis separation config), CUT-03 (per-cart rate-limit keys), CUT-06 (filter internal product) on the branch; rerun tsc/lint; tag `v2.0.0`.
- [ ] (Nadun, 15) Check live DB: old media host rows (CUT-04), CARD_5 promo, LKR 500 shipping option, publishable key value. Note the live key for the storefront build var.
- [ ] (Nadun, 15) Collect prod values for every var in section 2 table (Koko live, Mintpay live, Onepay live, Resend, Meta, GA, Sentry) and prepare them in Coolify prod apps (do not deploy yet).
- [ ] (Nadun, 10) Cloudflare: SSL Full (strict), cache bypass rules, WAF exemptions for `/collect`, `/webhooks/*`, `/store/onepay/*`, dev noindex header rule.
- [ ] (Nadun, 10) Onepay/Koko/Mintpay dashboards: prepare live callback and redirect URLs; confirm domain whitelisting for the popup.
- [ ] (Claude + Nadun, 20) Rehearsal: dump `railway`, restore into `cardle_rehearsal`, run `db:migrate` against it, call `/store/cms`.

Go-live
- [ ] (Nadun, 5) Take pg_dump of `railway` (section 4), copy it off the VPS, verify with `pg_restore -l`; note the current contabo commit/image.
- [ ] (Nadun, 2) Set storefront-prod to maintenance mode (`ENABLE_MAINTENANCE_MODE=true`, runtime) or accept no maintenance for a short window.
- [ ] (Nadun, 8) Deploy backend-prod from tag `v2.0.0` with prod env; wait for healthy.
- [ ] (Claude/Nadun, 3) `npx medusa db:migrate` then `db:sync-links` in the backend container; verify tables with psql.
- [ ] (Nadun, 5) Re-create promo bar / banners in Admin > Site CMS (or restore the cms rows), keep packing disabled for now.
- [ ] (Nadun, 12) Deploy storefront-prod from `v2.0.0` with build vars (NEXT_PUBLIC_ONEPAY_JS=true, prod backend URL, publishable key, pixel/GA); wait for build and healthy.
- [ ] (Nadun, 2) Turn off maintenance mode; purge Cloudflare cache once.
- [ ] (Nadun, 20) Run smoke tests 1-15 (section 5); Claude reads the backend log alongside.
- [ ] (Nadun, 5) Switch Onepay/Koko/Mintpay dashboard callback URLs to final prod values if not already; remove any test event code.

After
- [ ] (Nadun, 5) Enable packing and the Buy 2 Get 1 promo only after step 8-9 of the smoke test pass.
- [ ] (Claude, 10) Monitor logs and Sentry for 1 h; check Onepay ledger for `needs_review`.
- [ ] (Nadun, 5) Keep the pre-V2 dump and the contabo tag for 7 days; then clean up. Submit new sitemap and Google Merchant feed in Search Console and Merchant Center.
- [ ] (Nadun, 5) If a rollback trigger hits (section 4): redeploy contabo tag on both apps, set `internal-packing` product to draft, no DB restore needed.

---

## What was checked and passed
- Medusa core and Next versions identical between contabo and V2 (no core migrations).
- All 3 V2 migrations are additive and idempotent (`if not exists`), include down() methods, and match the model definitions (cms_banner.text_color, cms_setting unique key, addon unique index).
- No custom module links (`src/links` absent), so `db:sync-links` is a no-op for custom code.
- Storefront degrades safely when CMS tables are empty or the endpoint fails (built-in hero; getCms catches errors); `/store/offers` returns false safely if BUY2GET1 is missing; packing returns `enabled:false` until switched on.
- Storefront `tsc --noEmit` clean; `next lint` clean (needed because V2 enforces both at build).
- HTML responses are `no-store`; baseline security headers present; CSP is Report-Only so it cannot block checkout on launch.
- www to apex 301 present; robots.txt disallows checkout/account/cart/api under `/` and `/lk`.
- File provider change only affects new upload keys; existing media URLs keep working.
- Env var inventory complete (grep of both branches); only 3 new names.
