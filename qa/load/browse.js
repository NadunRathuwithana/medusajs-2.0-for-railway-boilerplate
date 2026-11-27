// Browse scenario: home, /lk/store, category, product pages (storefront SSR)
// + /store/products API + static assets + _next/image.
// Run: k6 run -e TEST_TYPE=smoke qa\load\browse.js   (see run-guide.md)
import { buildOptions, loadCatalog, page, apiGet, loadAssets, think, pick } from './lib.js';

export const options = buildOptions(1, {
  'http_req_duration{kind:page}': ['p(95)<800'],
  'http_req_duration{kind:static}': ['p(95)<800'],
  'http_req_duration{kind:image}': ['p(95)<1500'],
  'http_req_duration{kind:api}': ['p(95)<2000'],
});

export function setup() {
  return loadCatalog();
}

export default function (d) {
  const home = page('/lk', 'home');
  loadAssets(home, 6, 4);
  think();

  const store = page('/lk/store', 'store');
  loadAssets(store, 2, 6);
  apiGet(`/store/products?limit=12&region_id=${d.region_id}&fields=*variants.calculated_price,+variants.inventory_quantity`, 'products list', 'api');
  think();

  if (d.categories.length) {
    page('/lk/categories/' + pick(d.categories), 'category');
    think();
  }

  for (let i = 0; i < 2; i++) {
    const p = pick(d.products);
    const pr = page('/lk/products/' + p.handle, 'product');
    loadAssets(pr, 2, 4);
    apiGet(`/store/products?handle=${encodeURIComponent(p.handle)}&region_id=${d.region_id}&fields=*variants.calculated_price,+variants.inventory_quantity`, 'product by handle', 'api');
    think();
  }
}
