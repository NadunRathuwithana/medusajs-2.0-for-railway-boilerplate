# Cardle V2 pre-launch QA: shared context for every QA agent

Repo: /home/claude/medusajs-2.0-for-railway-boilerplate (branch v2-prelaunch-fixes, cut from v2).
- backend/  = Medusa v2.13.6 (custom modules: onepay-payment, koko-payment, mintpay-payment, cms, addons, minio-file, email-notifications; jobs, subscribers, api routes)
- storefront/ = Next.js 15 storefront (src/app, src/modules, src/lib)
- Live site today runs the OLD branch `contabo` (origin/contabo). V2 replaces it. `git diff origin/contabo...v2-prelaunch-fixes` shows what V2 changes.
- Environments: dev = dev.cardle.lk + api-dev.cardle.lk (Coolify apps "storefront"/"backend"); live = cardle.lk + api.cardle.lk (apps "storefront-prod"/"backend-prod"). Both run on ONE Contabo VPS and share ONE Postgres container (dev DB cardle_v2, live DB railway) and Redis.
- Shop: Sri Lanka, LKR only, region /lk default. Delivery: island-wide, LKR 500 flat, 3-10 working days. COD capped at LKR 8,000. Card (Onepay) gives 5% off (promo CARD_5). Buy 2 Get 1 promo exists on dev.
- Payments: Onepay (card, popup via Onepay.js, server watcher + reconcile job + /api/collect callback), Koko (BNPL, RSA-SHA256 signed webhook), Mintpay (BNPL), COD (pp_system_default). Onepay was hardened and stress-tested today: backend/.harness/onepay-harness.ts (21 scenarios, 525/525 pass) + 11 real test-card runs pass.
- Emails: Resend, from orders@cardle.lk (backend/src/modules/email-notifications + subscribers). Dev currently sends no emails.
- Tracking: Meta Pixel + Conversions API (CAPI), GA4.

## Hard rules
- This workspace CANNOT reach dev.cardle.lk / api-dev.cardle.lk / live (network blocked). Work from the code. Do not try to reach them.
- READ-ONLY on code: do NOT edit, create or delete source files, do NOT git commit/checkout/stash/reset. The lead applies all fixes. The ONLY file you write is your report: qa/<your-area>.md (and for load testing, files under qa/load/).
- Never write secrets, passwords, tokens, keys or real customer data into a report. If you see one in code, write "[REDACTED]" and report the location.
- You may run read-only commands: grep, git log/diff/show, tsc --noEmit, eslint, node scripts that don't touch the network.

## Report format (qa/<area>.md)
Start with a 2-line summary and a status line: `STATUS: PASS | PASS WITH ISSUES | FAIL`.
Then one section per issue:

### <AREA-NN> <short title>
- Severity: blocker | major | minor
  - blocker = loses orders/money, broken checkout, security hole, legal/SEO disaster at launch
  - major = clearly wrong for customers or ops, should fix before launch
  - minor = polish
- Where: file:line
- Steps / evidence: what in the code shows it (quote a few lines)
- Expected vs actual
- Suggested fix: concrete, ideally a small diff
Also list what you checked that PASSED (short bullets), so the lead can show coverage.
Keep it factual. No speculation presented as fact: mark "unverified (needs browser)" where you can't confirm from code.
