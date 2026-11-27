# QA report: Orders and Emails (prefix MAIL-)

Order emails exist and are mostly sound, but the confirmation email omits add-ons, packing and the COD amount due. Dead subscribers, a wrong reset-link expiry and a missing idempotency key are the main gaps.
Read-only review from code. Nothing was verified in a browser or against the dev environment.

STATUS: PASS WITH ISSUES
Counts: blocker 0, major 7, minor 10

## Email inventory (what exists)

| Email | Trigger | Subscriber | Status |
|---|---|---|---|
| Order confirmation | `order.placed` | order-placed.ts | works (see MAIL-02, 03, 05) |
| Order shipped | `order.fulfillment_created` | order-shipped.ts | fires on fulfillment creation, not on shipment (MAIL-06) |
| Order cancelled | `order.canceled` | order-cancelled.ts | works |
| Password reset | `auth.password_reset` | password-reset.ts | works, but wrong expiry text (MAIL-04) |
| Welcome | `customer.created` | customer-created.ts | works; also fires for guest customers (MAIL-13) |
| Admin invite | `invite.created`, `invite.resent` | invite-created.ts | works |
| Contact form (auto-reply + admin + support) | POST /store/contact | route | works, rate-limited 5 per 15 min |
| Payment failed | `payment.failed` | payment-failed.ts | DEAD (MAIL-07) |
| Order refund | none | template only, no subscriber | DEAD (MAIL-07) |
| Koko/Mintpay/Onepay payment emails | none | none | missing |

Provider selection:
- `medusa-config.ts` registers the Resend provider only when both `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set.
- SMTP is used only when Resend is not set.
- The `feed` local provider is always registered.

## Issues

### MAIL-01 Customers can read other people's orders (order history by email, and unauthenticated order read)
- Severity: major
- Where: backend/src/api/store/my-orders/route.ts:30-40; storefront/src/lib/data/orders.ts:8-17 (Medusa core `GET /store/orders/:id`)
- Evidence:
  - `filters: { $or: [{ customer_id }, { email: customer.email }] }` lists every order placed with that email, including guest orders.
  - Medusa emailpass registration does not verify the email address. Anyone can register with `victim@x.com`, open Account > Orders and then open any order's details.
  - `/store/orders/:id` is unauthenticated in core Medusa (the route has a TODO comment). The details page returns full PII: address, phone, `contact_phone_2`, email.
- Expected: guest orders are linked to a verified owner only. Actual: the email string is the only gate.
- Suggested fix:
  - Short term: drop the `{ email }` branch from `my-orders`, or link guest orders only after email verification.
  - Have the details page fetch through an authenticated route that checks `order.customer_id === actor_id`.
  - Keep the confirmation page working for guests with a signed token or the cart cookie.
  - Order IDs are long random values, so the unauthenticated read is not guessable. The email-match path is the realistic hole.

### MAIL-02 Order confirmation email omits add-ons and packing detail, and shows variant "Default" noise
- Severity: major
- Where: backend/src/modules/email-notifications/templates/order-placed.tsx:437-496
- Evidence:
  - The item row prints `item.product_title ?? item.title` and `item.title` (variant title). It never reads `item.metadata.addons` or `metadata.packing_name`.
  - Add-on prices are folded into `unit_price` (addon-items route), so the customer sees a higher price with no explanation.
  - Packing lines appear as a generic "Packing / Packing" row. The thumbnail is `item.thumbnail`, not `metadata.image`.
  - The storefront (`LineItemAddons`) and the print invoice both render these correctly. The email does not.
- Expected: each bag lists "+ Add-on name (LKR x)"; packing rows read "Packing: Gift box".
- Suggested fix:
  - Port the invoice logic into the template. Add `const addons = Array.isArray(item.metadata?.addons) ? item.metadata.addons : []` and render a `+ name (price)` line under the title.
  - For `metadata.packing === true`, title becomes `Packing: ${packing_name}` and the image becomes `metadata.image`.
  - Hide the variant title when it matches /default/i, as the invoice does.

### MAIL-03 Confirmation email is missing COD amount due, second phone, delivery estimate, order link for guests
- Severity: major
- Where: order-placed.tsx:343-540; order-placed.ts:64-78
- Evidence:
  - Payment method is shown, but for COD there is no "Amount to pay on delivery: LKR X".
  - There is no phone or `contact_phone_2` in the shipping card.
  - There is no "3-10 working days" text.
  - The CTA goes to `${shopUrl}/account/orders`, which a guest cannot use. Guests are the majority.
  - The shipping card has no phone, and `shippingAddress` fields are passed unescaped to JSX (safe, since React escapes them).
- Suggested fix:
  - Add the COD line when the provider id starts with `pp_system_default`.
  - Add the phone numbers.
  - Add the delivery window.
  - Link guests to the confirmation page `/lk/order/confirmed/{id}`.
  - Add a support line (hello@cardle.lk and WhatsApp).

### MAIL-04 Password-reset email says 30 minutes, token expires in 15
- Severity: major
- Where: subscribers/password-reset.ts:43 (`expiresInMinutes: 30`) vs core-flows `generate-reset-password-token.js:58` (`expiresIn: "15m"`)
- Evidence: the email promises 30 minutes while the JWT is signed for 15. Users who click at minute 20 get an invalid-link error with no explanation.
- Suggested fix: set `expiresInMinutes: 15`. Also make the storefront reset page show "link expired, request a new one" on a 401 from the update call.

### MAIL-05 No idempotency key on any email, so retries or double events produce duplicate emails
- Severity: major
- Where: subscribers/order-placed.ts:64-78 (and every other `createNotifications` call)
- Evidence:
  - `createNotifications` supports `idempotency_key`. The notification module skips a send when a key already exists with a SUCCESS status (notification-module-service.js:40-60). Cardle sets none.
  - Good news on the race: `completeCartWorkflow` takes a lock on the cart (`acquireLockStep`), checks `order_cart.order_id`, and emits `order.placed` only on first creation. A webhook plus browser race for Onepay, Koko or Mintpay therefore should not emit the event twice.
  - Duplicates are still possible: if the process crashes after sending but before the BullMQ job is acked, the job is redelivered and the customer gets a second email.
  - Medusa's own TODO says the idempotency check is not race-safe. So set the key and also keep the cart lock.
  - `order-placed.ts` calls `query.graph` outside its try/catch. If that throws, the handler rejects and may retry.
- Suggested fix: add `idempotency_key: \`order-placed-${order.id}\``. Use similar keys for shipped (`order-shipped-${fulfillment_id}`), cancelled (`order-cancelled-${order.id}`) and welcome (`welcome-${customer.id}`).

### MAIL-06 "Shipped" email is sent when the fulfillment is created, not when it ships, and ignores no_notification
- Severity: major
- Where: subscribers/order-shipped.ts:59 (`order.fulfillment_created`), :32-49
- Evidence:
  - In Medusa v2, creating a fulfillment (packing the order) emits `order.fulfillment_created`. Marking it shipped emits `shipment.created`, which is not subscribed.
  - Ops packing an order in admin triggers "Your order has been dispatched" days early.
  - `data.no_notification` is passed by the admin "send notification" toggle but is ignored.
  - `carrierName: fulfillment?.provider_id` prints raw ids such as `manual_manual`.
  - The tracking box shows only when a tracking number exists, so most emails have no tracking and no button.
  - The email promises "reply directly to this email" while reply-to is hello@cardle.lk (OK) but the from is orders@ (see MAIL-08).
- Suggested fix:
  - Subscribe to `shipment.created` (data `{ id, no_notification }`) and skip the send if `no_notification` is true.
  - Resolve the order through the fulfillment's order link.
  - Map the carrier id to a friendly name, or hide the row.

### MAIL-07 Dead notification code: payment-failed and order-refund
- Severity: minor
- Where: subscribers/payment-failed.ts:67 (`payment.failed`); templates/order-refund.tsx (no subscriber)
- Evidence:
  - Medusa v2 has no `payment.failed` event (utils events list has `payment.captured` and `payment.refunded` only). The subscriber never runs.
  - It also treats `data.id` as an order id, and hard-codes `checkoutUrl: 'https://cardle.lk'`.
  - The refund template is never used. `payment.refunded` has no subscriber.
- Suggested fix: delete or wire them. For failed card payments, send from the Onepay failure path. For refunds, subscribe to `payment.refunded` and resolve the order.

### MAIL-08 From address, reply-to and mailbox consistency need verification
- Severity: major
- Where: medusa-config.ts:156 (comment `TODO: MUST change onboarding@resend.dev ... before going live`); `RESEND_FROM_EMAIL` env
- Evidence:
  - The `from` comes only from env `RESEND_FROM_EMAIL` (or `RESEND_FROM`). The code never forces `orders@cardle.lk`. The TODO comment still mentions `onboarding@resend.dev`.
  - If the env value is a Resend sandbox address, mail goes only to the account owner.
  - Reply-to is hard-coded to `hello@cardle.lk`. Contact auto-reply uses `support@cardle.lk` and the admin inbox defaults to `admin@cardle.lk`.
  - Four different mailboxes must exist and be monitored: orders@, hello@, support@, admin@.
  - Prod must set `RESEND_FROM_EMAIL="Cardle <orders@cardle.lk>"`.
  - If only `RESEND_API_KEY` is set without the FROM, no provider registers at all (see MAIL-09).
- Suggested fix: add a startup log that prints the active provider and from address. Fail loudly when the key is set and the FROM is empty. Move the reply-to into one constant.

### MAIL-09 Why dev sends nothing, and whether a failure can break order placement
- Severity: minor (behaviour is safe, but silent)
- Where: modules/email-notifications/index.ts:5-11; medusa-config.ts:155-190; subscribers/order-placed.ts:63-81
- Evidence:
  - The provider is registered only when `RESEND_API_KEY && RESEND_FROM_EMAIL` are both set. On dev they are not, so only the `feed` provider exists.
  - `createNotifications({channel:'email'})` then throws "Could not find a notification provider for channel: email" (notification-module-service.js:89). The subscribers catch it and log `[Email] Error sending ...`.
  - A failed notification row with status FAILURE is stored for each attempt.
  - Order placement is NOT affected. `order.placed` handlers run after the order exists, and each handler wraps the send in try/catch. The same holds when Resend returns an error: `ResendNotificationService.send` throws and the subscriber swallows it.
  - Failures are only visible in logs. Nothing retries a failed email and nothing alerts ops.
  - `invite-created.ts` calls `retrieveInvite` outside its try/catch. Low risk.
- Suggested fix:
  - Set dev to a Resend test key and a verified-domain from address, or add a log-only provider so dev shows the rendered email.
  - Add a nightly job that lists notifications with `status = failure` and alerts ops.

### MAIL-10 Dev emails link to live cardle.lk (wrong env var name)
- Severity: minor
- Where: subscribers/password-reset.ts:29, customer-created.ts:32 use `NEXT_PUBLIC_BASE_URL`; templates use `STORE_URL`; payment-failed.ts:57 hard-codes the URL
- Evidence:
  - `NEXT_PUBLIC_BASE_URL` is a storefront variable and is probably not set on the backend app. The reset link then falls back to `https://cardle.lk` even on dev.
  - A dev reset token sent to the live site is useless for testing.
  - Images and links in templates use `STORE_URL || https://cardle.lk`, so two different variables control the same thing.
- Expected: dev emails link to dev.cardle.lk. Prod links to cardle.lk, never localhost (none found in the code; two `localhost` strings exist only in comments in the welcome and invite templates).
- Suggested fix: use one backend variable, `STORE_URL`, everywhere (`https://dev.cardle.lk` on dev, `https://cardle.lk` on prod). Confirm it is set on both Coolify backend apps.

### MAIL-11 Footer and deliverability content
- Severity: minor
- Where: templates/base.tsx:128-228
- Evidence:
  - The footer shows "(c) Cardle YEAR, Sri Lanka" only. There is no contact email, phone, postal address or support line.
  - There is no unsubscribe link. That is acceptable for transactional mail but not for the welcome email if it ever carries marketing.
  - The top nav has three labels (TOTE BAGS, BEST SELLERS, NEW ARRIVALS) that all link to `/store`.
  - The Google Fonts `@import` is ignored by Gmail and Outlook.
  - Hero images are 600x400 JPEGs fetched from the storefront. If the storefront is slow or down they show as broken.
  - Plain-text part: `emailOptions.text` is never set. Resend usually generates a text part from the HTML (unverified; confirm in a test send). The SMTP provider sends HTML only.
- Suggested fix: add a footer line "Questions? hello@cardle.lk | +94 ..." and an order-help link. Generate text with `render(el, { plainText: true })` and pass it as `text`. Make the nav links distinct or drop them.

### MAIL-12 DNS and deliverability checklist (cannot be checked from code)
- Severity: major (launch gate)
- Where: DNS for cardle.lk and Resend dashboard
- Must verify:
  - Resend domain `cardle.lk` shows Verified.
  - SPF TXT includes `include:amazonses.com` (Resend sends via SES), with one SPF record only. Check the existing mailbox provider's SPF and merge them.
  - DKIM CNAME or TXT `resend._domainkey` is present and verified.
  - Return-path or custom MAIL FROM subdomain (MX + SPF) is set. This is what makes DMARC alignment pass.
  - DMARC TXT `_dmarc.cardle.lk` exists. Start with `p=none; rua=mailto:...` and move to `quarantine` after a week of clean reports.
  - Test mail to Gmail and Outlook shows spf=pass, dkim=pass, dmarc=pass and lands in the inbox.
  - Mailboxes orders@, hello@, support@ and admin@ receive mail, or are aliased.
  - A production Resend API key is used (not the dev key), with sending limits sized for launch (free plan 100 per day).
  - The contact route sleeps 3s plus 1s between sends because of Resend's 2 requests per second limit. Order bursts can hit this limit: the notification module sends sequentially per event, with no retry.

### MAIL-13 Welcome email also fires for guest checkouts
- Severity: minor
- Where: subscribers/customer-created.ts:42 (`customer.created`)
- Evidence: Medusa creates a guest customer record during cart completion (`find-or-create-customer.js:71 createCustomers({email})`). That emits `customer.created`. Guests receive "Welcome to Cardle! Your account has been created" although they have no account. Names default to 'Customer'.
- Suggested fix: skip when `customer.has_account === false`.

### MAIL-14 Admin shows only a payment-method badge; add-ons, packing and phones are not visible on the order page
- Severity: major
- Where: backend/src/admin/widgets/order-payment-method.tsx (the only order widget; the other widgets are product/variant)
- Evidence:
  - Admin order page shows line items from Medusa defaults. Line-item `metadata.addons` is not rendered, so staff packing an order cannot see which add-ons to include.
  - Packing lines show as an item called "Packing" and `metadata.packing_name` is not shown.
  - `metadata.contact_phone_2`, `payment_gateway*`, `phone_missing` and `phone_restored_from_backup` (set by order-placed-enrich.ts) are not displayed in admin. Staff would have to open Cardle Ops.
  - The widget falls back to the string "Unknown" (`|| "Unknown"` at line 18), so the `!providerId` guard on line 20 never triggers. Orders without a payment record show a green "Unknown" badge.
  - Provider ids map correctly: `pp_onepay_onepay`, `pp_koko_koko`, `pp_mintpay_mintpay`, `pp_system_default` (matches storefront `paymentInfoMap`).
- Suggested fix: add a second widget on `order.details.side.before`: a "Packing and add-ons" card listing, per line, `metadata.addons[]` (name, price) and packing names; plus second phone, gateway ids and a red banner when `metadata.phone_missing`. Remove the "Unknown" default.

### MAIL-15 Order totals on the account order page can double-count shipping in "Subtotal"
- Severity: major (unverified: needs browser or a real order)
- Where: storefront/src/modules/order/components/order-summary/index.tsx:129 (`order.subtotal`), :148-163
- Evidence:
  - Medusa's cart totals add shipping into `subtotal` (`totals/cart/index.js:87 subtotal = subtotal + shippingMethodTotals.subtotal`). Order totals are built the same way, so `order.subtotal` likely includes the LKR 500 delivery fee.
  - The component prints Subtotal = `order.subtotal`, Discount, Shipping and Total. The visible lines would then not add up: for LKR 2,500 of items, Subtotal 3,000, Shipping 500, Total 3,000.
  - The confirmation page uses `CartTotals`, which correctly uses `item_subtotal` (with the comment "pre-shipping subtotal"). The email uses `item_subtotal ?? subtotal`, and the invoice sums the lines. Only the account details page is affected.
- Suggested fix: use `order.item_subtotal ?? order.subtotal - order.shipping_total`.

### MAIL-16 Print invoice: totals reconcile with order totals, with caveats
- Severity: minor
- Where: storefront/src/modules/order/components/print-invoice/index.tsx:78-90, 166, 278-289
- Evidence (passes):
  - Subtotal is the sum of `unit_price * quantity`, which includes add-on-inflated unit prices and packing lines, so it agrees with `item_subtotal`.
  - Discount uses `order.discount_total`, shipping uses `order.shipping_total`, and Total uses `order.total` (not recomputed).
  - Add-ons are listed as sub-lines with prices already inside the unit price. Packing lines are labelled "Packing: name". The second phone prints as "phone / phone2". COD shows "Pay on delivery", with no "Amount paid".
- Caveats:
  - `o.promotions` is not requested in `retrieveOrder` fields, so the "Offers" row (CARD_5, B2G1) likely never prints (unverified).
  - `compare_at_unit_price` is a core line field, but whether the storefront fetches it is unverified. If it is absent, the "Sale discount" line never shows, which is harmless.
  - A Buy 2 Get 1 free item has its discount in item adjustments. Medusa includes it in `discount_total`, so the numbers hold.
  - "Payment: Paid" and "Amount Paid" are shown for any non-COD order without checking the payment's captured state.
  - The logo and QR load from `/invoice/*`, which exist in public/.
- Suggested fix: add `+promotions.code` (or `*promotions`) and `+items.compare_at_unit_price` to the `retrieveOrder` fields. Show "Paid" only when `payment.captured_at` is set.

### MAIL-17 Order pages: packing lines have no image, and product links lose the country code
- Severity: minor
- Where: storefront/src/modules/order/components/item/index.tsx:38-47, 52
- Evidence:
  - `item.thumbnail` is used for the picture, and `metadata.image` (set for packing options) is ignored, so packing rows show a grey box. Add-on images are not shown on the web page (the invoice shows them).
  - `href={\`/products/${handle}\`}` has no `/lk` prefix and opens a new tab. It works through the middleware redirect, but costs an extra redirect.
  - Item name shows `item.title`, which for add-on lines is the product title, so the add-on is only in the sub-list (fine).
- Suggested fix: use `item.thumbnail || metadata.image` and `LocalizedClientLink`.

### MAIL-18 Cardle Ops webhook is fire-and-forget; a failure silently loses the order in Ops
- Severity: major
- Where: subscribers/cardle-ops-webhook.ts:11-47
- Evidence:
  - If `CARDLE_OPS_WEBHOOK_URL` or the secret is missing, it only warns. A 10s timeout, a non-2xx response or a network error is logged and dropped. There is no retry and no outbox.
  - Ops (ops.cardle.lk) is the team's order management tool, so a missed order means it is not in the packing queue even though the customer paid.
  - The file's own comment admits this.
  - `order-placed-enrich.ts` reads and then rewrites the whole `metadata` object (read-modify-write). If Ops or another handler writes metadata in between, its keys can be overwritten.
- Suggested fix: emit with `{ attempts: 5 }`-style retry by making the handler throw on failure (the Redis bus retries per subscriber when `attempts` is set at emit time; `order.placed` is emitted with default attempts of 1, so add a reconcile job that pushes orders from the last 24h to Ops). At minimum, log to Sentry and alert when the env vars are missing in prod.

### MAIL-19 Dev and live share one Redis: event queue cross-talk
- Severity: major (unverified: needs deployment config)
- Where: CONTEXT.md (shared Redis) and medusa-config.ts:119-135 (`event-bus-redis` with default queue name `events-queue`)
- Evidence:
  - The queue name is the BullMQ default `events-queue` unless overridden. If dev and live backends point at the same Redis with the same queue and the same key prefix, a dev worker can consume a live `order.placed` job (and the reverse).
  - The dev worker would then run with dev's DB and dev's email config. The live order would send no confirmation email, or the wrong one, and the live customer would never get it.
  - This is also a plausible explanation for "dev sends no emails" confusion.
- Suggested fix: use separate Redis logical DBs (`/0` for live and `/1` for dev) or set `queueName: "events-queue-dev"` for dev in the event bus options. Same for the workflow engine. Confirm the current `REDIS_URL` values on both Coolify apps.

### MAIL-20 Cancellation email, subjects and other polish
- Severity: minor
- Where: subscribers/order-cancelled.ts:34, order-shipped.ts:43, password-reset.ts:39
- Evidence:
  - Subjects begin with emoji (X, truck, lock). The cancel and failed subjects are more likely to be marked as spam.
  - The confirmation subject is "Order Confirmed — #123" and does not include the brand.
  - Dates use `toLocaleDateString('en-US')` of the UTC value, and the server timezone may shift the day (use `Asia/Colombo`).
  - The cancellation email has no refund or next-step text.
- Suggested fix: drop emoji from subjects, use the brand in the subject ("Cardle order #123 confirmed"), pass `timeZone: 'Asia/Colombo'`.

### MAIL-21 SMTP fallback disables TLS certificate verification
- Severity: minor
- Where: modules/email-notifications/services/smtp.ts:198-200 (`rejectUnauthorized: false`)
- Evidence: only used when `RESEND_API_KEY` is absent but SMTP vars are set. It allows a man-in-the-middle on the mail link.
- Suggested fix: remove the option, or set it only for local dev.

## Ops/admin: what is missing
- Admin view of add-ons and packing per order (MAIL-14), the second phone, gateway ids and the phone-missing flag.
- An internal "new order" alert email or WhatsApp message to the team. Today only the customer is emailed; ops depends on the Ops webhook (MAIL-18).
- A visible list of failed emails with a "resend" button. Failure rows exist in the notification table, with no UI (MAIL-09).
- Print buttons in Medusa admin for invoice and packing slip (only the storefront and Ops have them).
- A payment-failed or abandoned-checkout follow-up (MAIL-07), and refund and COD-collected status emails.
- Shipment tracking entry with a carrier picker, and a `no_notification` toggle that is honoured (MAIL-06).
- A per-order internal notes field and a delivery-estimate field.

## Checked and passed
- Subscribers wrap sends in try/catch: a missing or failing email provider cannot block or roll back an order.
- `order.placed` is emitted once per cart by `completeCartWorkflow` (cart lock plus order_cart check), so the Onepay, Koko and Mintpay webhook/browser/reconcile race does not double-fire the event (hardening still advised in MAIL-05).
- Confirmation email totals logic: Item Subtotal, Shipping, Discount (with adjustment fallback) and Total (`order.total`) reconcile, and the payment-method mapping covers COD, Onepay, Koko and Mintpay.
- Default template URLs fall back to `https://cardle.lk`. No localhost or dev URLs are used in any email (only commented-out lines).
- Password-reset link format `/account/reset-password?token=&email=` matches the existing storefront routes (`@login/reset-password` and `@dashboard/reset-password`), and the email is URL-encoded.
- Invite link uses `BACKEND_URL/app/invite?token=`, the correct admin path.
- Contact form: validation, rate limit (5 per 15 min), auto-reply to the customer, admin and support copies.
- Confirmation page `PurchaseTracker`, `CartTotals` (uses `item_subtotal`), add-on and packing sub-lines via `LineItemAddons`, second phone (`metadata.contact_phone_2`) on the Delivery card, COD "To be paid on delivery" text.
- Print invoice: totals, add-on and packing lines, second phone, COD vs paid state, payment label mapping, print CSS hides the rest of the page.
- Admin payment widget maps the four provider ids correctly (aside from the "Unknown" fallback).
- Email image assets (`logo`, `social/*`, `email/hero*.jpg`) exist in storefront/public.
- No secrets found in the reviewed files (the only Redis URL in the repo, in the test harness, is a local address).
- Not verified (needs a browser or a real send): rendered email appearance, Resend auto plain-text part, DNS records, Redis queue config on Coolify, invoice rendering in print preview, admin widget display.
