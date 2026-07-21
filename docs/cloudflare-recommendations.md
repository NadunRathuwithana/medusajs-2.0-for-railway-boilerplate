# Cloudflare Configuration Recommendations

Not yet applied — waiting on `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ZONE_ID`. Once
provided, these will be applied via the Cloudflare API directly; until then,
apply manually in the dashboard for `cardle.lk`.

## Phase 8 — WAF / bot challenge

- **Rate limiting rule** (Security → WAF → Rate limiting rules): challenge or
  block an IP issuing more than ~30 requests in 10s to `/checkout*`,
  `/api/*`, or the backend's `/store/carts/*/complete` and `/webhooks/*`
  paths. This is a second layer on top of the Redis-backed application-level
  limiting added in Phase 8 — Cloudflare's version blocks before the request
  even reaches Railway.
- **Bot Fight Mode / Super Bot Fight Mode** (Security → Bots): enable at
  minimum "Definitely automated" → Block. Do not block "Likely automated"
  outright at first — start with a Managed Challenge for that tier, since a
  false positive there would block real customers on checkout.
- **Security Level**: Medium is a reasonable default for a storefront; High
  only if you're seeing active abuse, since it increases challenge frequency
  for legitimate visitors.
- **Do NOT bot-challenge**: `/webhooks/koko`, `/webhooks/onepay` — these are
  server-to-server calls from the payment gateways, not browsers, and can't
  solve a challenge. Add a WAF skip/allow rule for these two paths (or
  allowlist the gateways' documented IP ranges if they publish one) before
  turning on Bot Fight Mode broadly, or their payment confirmations will
  silently fail to reach the backend.

## Phase 9 — Edge caching rules

Configure via Rules → Cache Rules (replaces the legacy Page Rules UI):

| Path pattern | Cache behavior | Edge TTL | Notes |
|---|---|---|---|
| `/_next/static/*` | Cache everything | 1 year | Immutable, content-hashed filenames — safe to cache forever |
| `/_next/image*` | Cache everything | 1 day | Next's own image-optimization output; respects the `s-maxage` Next already sets |
| `/*.{jpg,png,webp,avif,svg,ico}` (public/ assets) | Cache everything | 30 days | Static brand/marketing images that change rarely |
| `/products/*`, `/collections/*`, `/categories/*`, `/store` | Cache everything, respect origin headers | Match origin `Cache-Control` | Next already sends the right `Cache-Control`/`s-maxage` for these ISR-backed pages — a "Cache Everything" rule mainly ensures Cloudflare doesn't apply its own default (which excludes HTML by default) |
| `/cart`, `/checkout`, `/account/*` | **Bypass cache** | — | Per-user/session content; must never be cached at the edge |
| `/api/revalidate` | **Bypass cache** | — | Mutating endpoint |

**Important**: do not blanket-enable "Cache Everything" at the zone level —
it would cache `/cart`/`/checkout`/`/account` HTML too unless those are
explicitly excluded, which could leak one customer's cart/session HTML to
another from a shared edge cache. Use path-scoped Cache Rules, not a global
override.

## Phase 9 — CDN cache hit ratio

Once the API token is available, pull from `GET /zones/{zone_id}/analytics/dashboard`
or the GraphQL Analytics API (`httpRequests1hGroups`) to report:
- Overall cache hit ratio (requests served from edge vs. passed to Railway origin)
- Bandwidth saved
- Split by content type (static assets should be >95% hit ratio; HTML pages
  will be lower and depend on how many distinct product/collection URLs are
  actually being crawled/visited)

This can't be reported yet — it requires the token and at least a few days
of traffic after the cache rules above are applied, to get a meaningful ratio.
