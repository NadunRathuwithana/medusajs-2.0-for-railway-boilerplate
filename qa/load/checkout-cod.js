// Full COD checkout through the Medusa store API (no storefront):
// cart -> line item -> email + address -> shipping option -> payment collection ->
// session pp_system_default -> complete (twice, concurrently, to catch duplicate orders).
//
// Every order is tagged: email qa-load+<vu>@cardle.lk and metadata.qa_load=true (+qa_run).
// REAL ORDERS ARE CREATED ON DEV. They reserve stock, may fire the order.placed
// subscribers (Meta CAPI, Cardle Ops webhook). See run-guide.md before running.
//
// NOTE: POST /store/carts/:id/complete is rate limited to 10/min PER CART (keyFn in
// backend/src/api/middlewares.ts), so a double submit (2 completes) + 1 replay per cart
// stays under the limit. A 429 is counted in rate_limited_429, not treated as an error.
import { check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';
import { buildOptions, loadCatalog, apiGet, apiPost, jsonOf, pick, RUN_ID, API_URL, apiHeaders, expect429, rateLimited } from './lib.js';

expect429();

const duplicateOrders = new Counter('duplicate_orders');
const ordersCreated = new Counter('orders_created');
const checkoutOk = new Rate('checkout_success');
const completeTime = new Trend('cart_complete_duration', true);

export const options = buildOptions(0.02, {
  'http_req_duration{kind:api}': ['p(95)<2000'],
  duplicate_orders: ['count==0'],
  checkout_success: ['rate>0.95'],
});

export function setup() {
  return loadCatalog();
}

const DOUBLE_SUBMIT = (__ENV.DOUBLE_SUBMIT || '1') === '1';
const PACE_S = Number(__ENV.ORDER_PACE_S || 6);

function address(vu) {
  return {
    first_name: 'QA', last_name: `Load${vu}`, address_1: '1 Test Road', address_2: '', city: 'Kurunegala',
    postal_code: '60000', country_code: 'lk', phone: '0771234567',
  };
}

export default function (d) {
  const vu = __VU;
  const email = `qa-load+${vu}@cardle.lk`;
  const meta = { qa_load: true, qa_run: RUN_ID, qa_vu: vu };

  const c = apiPost('/store/carts', { region_id: d.region_id, email, metadata: meta }, 'carts create');
  if (!check(c, { 'cart created': (r) => r.status === 200 })) { checkoutOk.add(false); return; }
  const cartId = jsonOf(c).cart.id;

  const p = pick(d.products);
  const li = apiPost(`/store/carts/${cartId}/line-items`, { variant_id: pick(p.variant_ids), quantity: 1 }, 'line-items add');
  if (!check(li, { 'line item added': (r) => r.status === 200 })) { checkoutOk.add(false); return; }

  const up = apiPost(`/store/carts/${cartId}`, { email, shipping_address: address(vu), billing_address: address(vu), metadata: meta }, 'cart set address+email');
  if (!check(up, { 'address saved': (r) => r.status === 200 })) { checkoutOk.add(false); return; }

  const so = apiGet(`/store/shipping-options?cart_id=${cartId}`, 'shipping-options', 'api');
  const opts = (jsonOf(so) || {}).shipping_options || [];
  if (!check(so, { 'has shipping option': () => opts.length > 0 })) { checkoutOk.add(false); return; }
  const sm = apiPost(`/store/carts/${cartId}/shipping-methods`, { option_id: opts[0].id }, 'shipping-methods add');
  if (!check(sm, { 'shipping method set': (r) => r.status === 200 })) { checkoutOk.add(false); return; }

  const pc = apiPost('/store/payment-collections', { cart_id: cartId }, 'payment-collections create');
  if (!check(pc, { 'payment collection': (r) => r.status === 200 })) { checkoutOk.add(false); return; }
  const pcId = jsonOf(pc).payment_collection.id;
  const ps = apiPost(`/store/payment-collections/${pcId}/payment-sessions`, { provider_id: 'pp_system_default' }, 'payment-sessions create (COD)');
  if (!check(ps, { 'COD session': (r) => r.status === 200 })) { checkoutOk.add(false); return; }

  // Complete. Double submit = two concurrent completes for the SAME cart (customer double-click / retry).
  const reqs = [['POST', `${API_URL}/store/carts/${cartId}/complete`, '{}', { headers: apiHeaders(), tags: { kind: 'api', name: 'POST carts complete' } }]];
  if (DOUBLE_SUBMIT) reqs.push(reqs[0]);
  const t0 = Date.now();
  const res = http.batch(reqs);
  completeTime.add(Date.now() - t0);

  const orderIds = [];
  res.forEach((r) => {
    if (r.status === 429) { rateLimited.add(1); return; }
    const j = jsonOf(r);
    if (j && j.type === 'order' && j.order) orderIds.push(j.order.id);
  });

  if (!orderIds.length) {
    // maybe 409 (cart locked by the other request) or 429. Re-read via a sequential complete.
    const again = apiPost(`/store/carts/${cartId}/complete`, {}, 'carts complete (retry)');
    const j = jsonOf(again);
    if (j && j.type === 'order' && j.order) orderIds.push(j.order.id);
  }

  if (!orderIds.length) { checkoutOk.add(false); sleep(PACE_S); return; }

  const distinct = orderIds.filter((id, i) => orderIds.indexOf(id) === i);
  // DUPLICATE CHECK 1: concurrent completes of one cart must resolve to ONE order id
  const dupe = distinct.length > 1;
  if (dupe) duplicateOrders.add(1);
  check(null, { 'no duplicate order from double submit': () => !dupe });

  // DUPLICATE CHECK 2: a later complete must return the same order, never a new one
  const later = apiPost(`/store/carts/${cartId}/complete`, {}, 'carts complete (replay)');
  const lj = jsonOf(later);
  if (lj && lj.type === 'order' && lj.order && lj.order.id !== distinct[0]) {
    duplicateOrders.add(1);
    check(null, { 'replay returns same order': () => false });
  }

  const order = (lj && lj.order) || null;
  check(null, {
    'order carries qa_load metadata': () => !order || (order.metadata && String(order.metadata.qa_load) === 'true'),
    'order email is qa-load': () => !order || order.email === email,
  });

  ordersCreated.add(1);
  checkoutOk.add(true);
  sleep(PACE_S);
}
