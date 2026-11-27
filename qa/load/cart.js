// Cart scenario: create cart, add items (plain + with add-ons via the custom
// /store/carts/:id/addon-items route), change qty, re-price (POST cart {}, which is
// what the storefront does on cart open), read cart. No checkout, so no orders.
// Carts are tagged metadata.qa_load=true for cleanup.
// 429 from the rate limiter is counted, not treated as an error.
import http from 'k6/http';
import { check } from 'k6';
import { buildOptions, loadCatalog, apiGet, apiPost, jsonOf, think, pick, RUN_ID, API_URL, apiHeaders, expect429 } from './lib.js';

expect429();

export const options = buildOptions(0.2, {
  'http_req_duration{kind:api}': ['p(95)<2000'],
});

export function setup() {
  const d = loadCatalog();
  // find a product that offers add-ons (custom module), using the public route
  d.addon = null;
  for (const p of d.products.slice(0, 25)) {
    const r = http.get(`${API_URL}/store/addons?product_id=${p.id}`, { headers: apiHeaders(), tags: { kind: 'api', name: 'setup addons' } });
    const list = r.status === 200 ? (jsonOf(r).addons || []) : [];
    if (list.length) { d.addon = { variant_id: pick(p.variant_ids), addon_ids: [list[0].id] }; break; }
  }
  if (!d.addon) console.warn('setup: no product with add-ons found, add-on step will be skipped');
  return d;
}

export default function (d) {
  const created = apiPost('/store/carts', { region_id: d.region_id, metadata: { qa_load: true, qa_run: RUN_ID } }, 'carts create');
  if (!check(created, { 'cart created': (r) => r.status === 200 })) return;
  const cartId = jsonOf(created).cart.id;

  const p = pick(d.products);
  const add = apiPost(`/store/carts/${cartId}/line-items`, { variant_id: pick(p.variant_ids), quantity: 1 }, 'line-items add');
  check(add, { 'line item added': (r) => r.status === 200 });
  think();

  if (d.addon) {
    const ai = apiPost(`/store/carts/${cartId}/addon-items`, { variant_id: d.addon.variant_id, quantity: 1, addon_ids: d.addon.addon_ids }, 'addon-items add');
    check(ai, { 'addon item added': (r) => r.status === 200 });
  }

  const cart = apiGet(`/store/carts/${cartId}?fields=*items,+items.metadata,+total`, 'cart read', 'api');
  const items = (jsonOf(cart) || { cart: { items: [] } }).cart.items || [];
  if (items.length) {
    const upd = apiPost(`/store/carts/${cartId}/line-items/${items[0].id}`, { quantity: 2 }, 'line-items update qty');
    check(upd, { 'qty changed': (r) => r.status === 200 });
  }

  // Storefront re-prices on every cart/checkout page view and when the cart drawer opens.
  const rp = apiPost(`/store/carts/${cartId}`, {}, 'cart reprice (empty update)');
  check(rp, { 'reprice ok': (r) => r.status === 200 });

  apiGet('/store/packing', 'packing', 'api');
  think();
}
