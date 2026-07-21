# CI/CD Recommendations (Phase 14 — not implemented)

Per your earlier decision, no pipeline files were created — this repo has no CI/CD today
(`.github/` contains only `FUNDING.yml`), and I don't know your actual deploy setup
(Railway auto-deploy from a branch push? A separate build step?). What follows is a
concrete plan based on what's actually in this repo, for you or whoever sets up the
pipeline to implement.

## Important finding: the existing E2E suite doesn't test your real payment methods

`storefront/e2e/` already has a real, reasonably thorough Playwright suite
(`playwright.config.ts` + fixtures + `tests/public/checkout.spec.ts` and others). It's
easy to assume "checkout has E2E coverage" — but looking at what it actually does:

- It references generic demo products ("Sweatshirt", "Sweatpants") and a "FakeEx
  Standard" shipping option — this is the stock Medusa starter template's seed data,
  not Cardle's real tote-bag catalog. `e2e/data/seed.ts`/`reset.ts` would need to be
  confirmed/updated to work against your actual product data.
- The payment step in every test is just `checkoutPage.submitPaymentButton.click()`
  immediately followed by `submitOrderButton.click()` — there's no interaction with a
  payment method selector, no Koko, no OnePay, and no realistic Stripe/PayPal flow.
  This suite was never updated after the custom Koko/OnePay integration was built.

So the existing suite covers checkout **mechanics** well (address forms, edit-in-place,
price carry-over, back/forward navigation state) but gives no actual coverage of the
three payment methods that matter for this store. New tests are needed specifically for
Koko, OnePay, and COD — Stripe/PayPal are configured but (per the Phase 12 audit) may
not be the primary live payment methods for cardle.lk.

## Recommended pipeline (GitHub Actions example)

```yaml
# .github/workflows/ci.yml (not created — reference only)
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm, cache-dependency-path: storefront/pnpm-lock.yaml }
      - run: pnpm install --frozen-lockfile
        working-directory: storefront
      - run: pnpm run build:next
        working-directory: storefront
        env:
          NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: ${{ secrets.STAGING_PUBLISHABLE_KEY }}
          NEXT_PUBLIC_MEDUSA_BACKEND_URL: ${{ secrets.STAGING_BACKEND_URL }}

  lighthouse:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # ... build steps, then:
      - run: npx @lhci/cli autorun
        env:
          LHCI_BUILD_CONTEXT__CURRENT_BRANCH: ${{ github.head_ref }}

  e2e:
    needs: build
    runs-on: ubuntu-latest
    # Only block merges for this job on paths that touch checkout/payment code —
    # see "Gating" below.
    steps:
      - uses: actions/checkout@v4
      # ... setup, then:
      - run: pnpm exec playwright test
        working-directory: storefront
```

## Lighthouse budget (`lighthouserc.json`)

Based on the Phase 1 baseline (PDP was Performance 48, LCP 10.2s, TBT 1.36s before this
session's fixes) and post-fix expectations, reasonable failure thresholds:

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/lk", "http://localhost:3000/lk/products/SLUG", "http://localhost:3000/lk/store"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 300 }],
        "categories:performance": ["warn", { "minScore": 0.85 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

Use `error` (fails the build) for the three Core Web Vitals specifically, since those
are the ones with direct business/SEO impact; keep the overall performance *score* as a
`warn` so an unrelated third-party outage doesn't block unrelated PRs.

## New Playwright tests needed (not written — need real/sandbox payment credentials)

1. **COD checkout** — easiest to automate now, no external gateway involved. Extend
   the existing checkout flow test to actually select "Cash on delivery" at the payment
   step and assert the order confirms.
2. **Koko** — needs Koko's QA environment (`qaapi.paykoko.com`, already the default per
   `backend/.env`'s `KOKO_BASE_URL`) and a way to complete their hosted form in a test
   browser context. Koko's flow is a real cross-domain redirect + form POST, which is
   inherently flakier to automate reliably than an in-page widget — consider whether
   Koko provides a documented test-mode "auto-approve" flow before investing heavily
   here versus relying on a manual smoke-test checklist.
3. **OnePay** — similarly needs their sandbox/test credentials and redirect handling.
4. **Webhook idempotency regression test** (backend, not Playwright) — a Jest test that
   POSTs the same signed Koko webhook payload twice and asserts the payment is only
   captured once — this one doesn't need a browser or live gateway, just the existing
   `koko-payment` service's `getWebhookActionAndData` in isolation, and would directly
   protect the Phase 12 fix from regressing.

## Gating checkout/payment changes specifically

Once tests exist, use GitHub's path-based workflow triggers plus branch protection
"required status checks" so a PR touching payment code can't merge without the E2E job
passing:

```yaml
on:
  pull_request:
    paths:
      - 'storefront/src/modules/checkout/**'
      - 'storefront/src/modules/products/components/product-actions/**'
      - 'backend/src/modules/koko-payment/**'
      - 'backend/src/modules/onepay-payment/**'
      - 'backend/src/api/webhooks/**'
```

Combine with a required status check named e.g. `e2e / checkout` in the repo's branch
protection rules (Settings → Branches) so GitHub blocks the merge button until it's
green — this is a manual one-time setup step in the GitHub UI, not something committable
as a file.
