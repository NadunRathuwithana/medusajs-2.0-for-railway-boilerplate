// CMS / banners / promo / offers / packing / addons / best-selling fetches.
// These are the small "decoration" endpoints every page view depends on.
import { check } from 'k6';
import { buildOptions, loadCatalog, apiGet, page, think, pick } from './lib.js';

export const options = buildOptions(1, {
  'http_req_duration{kind:api}': ['p(95)<2000'],
  'http_req_duration{kind:page}': ['p(95)<800'],
  // best-selling runs an unbounded aggregate over all order items, tracked separately
  'http_req_duration{name:GET best-selling}': ['p(95)<2000'],
});

export function setup() {
  return loadCatalog();
}

export default function (d) {
  const cms = apiGet('/store/cms', 'cms', 'api');
  check(cms, { 'cms 200': (r) => r.status === 200, 'cms has banners key': (r) => { try { return Array.isArray(r.json('banners')); } catch (e) { return false; } } });

  const offers = apiGet('/store/offers', 'offers', 'api');
  check(offers, { 'offers 200': (r) => r.status === 200 });

  const packing = apiGet('/store/packing', 'packing', 'api');
  check(packing, { 'packing 200': (r) => r.status === 200 });

  const p = pick(d.products);
  const addons = apiGet(`/store/addons?product_id=${p.id}`, 'addons', 'api');
  check(addons, { 'addons 200': (r) => r.status === 200 });

  const best = apiGet('/store/products/best-selling', 'best-selling', 'api');
  check(best, { 'best-selling 200': (r) => r.status === 200 });

  apiGet('/store/regions', 'regions', 'api');
  apiGet('/store/collections?limit=3', 'collections', 'api');

  // storefront side: nav + footer + banners are rendered into every page
  page('/lk', 'home (cms render)');
  think();
}
