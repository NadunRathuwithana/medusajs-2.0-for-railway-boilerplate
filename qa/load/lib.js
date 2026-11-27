// Shared helpers for the Cardle V2 k6 load scripts.
// Run these ONLY from the owner's own PC, off-peak. See run-guide.md.
//
// Env vars (never hardcode secrets):
//   STORE_URL        default https://dev.cardle.lk
//   API_URL          default https://api-dev.cardle.lk
//   MEDUSA_PK        Medusa publishable key (required)
//   BASIC_AUTH_USER / BASIC_AUTH_PASS   HTTP basic auth for dev (sent on every request)
//   TEST_TYPE        smoke | load | stress | spike | soak   (default smoke)
//   SCALE            multiplies target VUs (default per script)
//   CONFIRM_OVER_1000=YES   required for any stress step above 1000 VUs
//   THINK_MIN / THINK_MAX   think time seconds between pages (default 1 / 3)
import http from 'k6/http';
import encoding from 'k6/encoding';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

export const STORE_URL = (__ENV.STORE_URL || 'https://dev.cardle.lk').replace(/\/+$/, '');
export const API_URL = (__ENV.API_URL || 'https://api-dev.cardle.lk').replace(/\/+$/, '');
export const TEST_TYPE = (__ENV.TEST_TYPE || 'smoke').toLowerCase();
export const RUN_ID = __ENV.RUN_ID || `run-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}`;

const PK = __ENV.MEDUSA_PK || '';
const BASIC_USER = __ENV.BASIC_AUTH_USER || '';
const BASIC_PASS = __ENV.BASIC_AUTH_PASS || '';

export const rateLimited = new Counter('rate_limited_429');

// ---- HARD GUARD: never run against live ---------------------------------
function assertDevOnly(label, url) {
  const u = String(url).toLowerCase();
  if (!/^https?:\/\//.test(u)) throw new Error(`${label} must start with http(s)://, got "${url}"`);
  if (u.includes('cardle.lk') && !u.includes('dev.')) {
    throw new Error(`REFUSING TO RUN: ${label}="${url}" looks like LIVE (contains cardle.lk without "dev."). Load tests are dev only.`);
  }
}
assertDevOnly('STORE_URL', STORE_URL);
assertDevOnly('API_URL', API_URL);

if (!PK) throw new Error('MEDUSA_PK env var is required (Medusa publishable key). Set it in PowerShell: $env:MEDUSA_PK="pk_..."');
if (__VU === 0 && (!BASIC_USER || !BASIC_PASS)) {
  console.warn('WARNING: BASIC_AUTH_USER / BASIC_AUTH_PASS not set. Dev is behind basic auth, expect 401s.');
}

const BASIC = BASIC_USER ? 'Basic ' + encoding.b64encode(`${BASIC_USER}:${BASIC_PASS}`) : '';
const UA = 'cardle-qa-load/1.0 (k6; owner-run)';

export function htmlHeaders(extra) {
  const h = { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' };
  if (BASIC) h.Authorization = BASIC;
  return Object.assign(h, extra || {});
}
export function apiHeaders(extra) {
  const h = { 'User-Agent': UA, Accept: 'application/json', 'Content-Type': 'application/json', 'x-publishable-api-key': PK };
  if (BASIC) h.Authorization = BASIC;
  return Object.assign(h, extra || {});
}

// ---- stages --------------------------------------------------------------
export function stagesFor(type, scale) {
  const sc = scale === undefined ? 1 : scale;
  const n = (v) => Math.max(1, Math.round(v * sc));
  switch (type) {
    case 'smoke': // 1-5 VUs, 1 minute, never scaled
      return [{ duration: '10s', target: 1 }, { duration: '40s', target: 5 }, { duration: '10s', target: 0 }];
    case 'load': // ramp to 500, hold 10 min
      return [{ duration: '5m', target: n(500) }, { duration: '10m', target: n(500) }, { duration: '2m', target: 0 }];
    case 'stress': {
      const top = n(5000);
      if (__VU === 0) {
        console.warn('\n########################################################################');
        console.warn('# STRESS TEST: steps 500 / 1000 / 2500 / 5000 VUs (after SCALE).        #');
        console.warn('# Dev and LIVE share ONE VPS and ONE Postgres. This can slow or take    #');
        console.warn('# down live cardle.lk. Watch live-watch.ps1 and stop on any degradation. #');
        console.warn('# Cloudflare may also block your PC IP.                                  #');
        console.warn('########################################################################\n');
      }
      if (top > 1000 && __ENV.CONFIRM_OVER_1000 !== 'YES') {
        throw new Error('Stress above 1000 VUs needs explicit owner confirmation: set $env:CONFIRM_OVER_1000="YES". Use SCALE=0.2 to cap at 1000.');
      }
      return [
        { duration: '3m', target: n(500) }, { duration: '5m', target: n(500) },
        { duration: '3m', target: n(1000) }, { duration: '5m', target: n(1000) },
        { duration: '3m', target: n(2500) }, { duration: '5m', target: n(2500) },
        { duration: '3m', target: n(5000) }, { duration: '5m', target: n(5000) },
        { duration: '3m', target: 0 },
      ];
    }
    case 'spike': // 50 -> 2000 -> 50
      return [
        { duration: '1m', target: n(50) }, { duration: '30s', target: n(2000) },
        { duration: '3m', target: n(2000) }, { duration: '30s', target: n(50) }, { duration: '3m', target: n(50) },
        { duration: '30s', target: 0 },
      ];
    case 'soak': // moderate, 60 min
      return [{ duration: '5m', target: n(100) }, { duration: '60m', target: n(100) }, { duration: '5m', target: 0 }];
    default:
      throw new Error(`Unknown TEST_TYPE "${type}". Use smoke|load|stress|spike|soak`);
  }
}

export function buildOptions(defaultScale, thresholds) {
  const scale = __ENV.SCALE !== undefined ? Number(__ENV.SCALE) : defaultScale;
  if (!(scale > 0)) throw new Error('SCALE must be > 0');
  const stages = stagesFor(TEST_TYPE, scale);
  if (__VU === 0) console.log(`TEST_TYPE=${TEST_TYPE} SCALE=${scale} STORE_URL=${STORE_URL} API_URL=${API_URL} RUN_ID=${RUN_ID}`);
  return {
    scenarios: { main: { executor: 'ramping-vus', startVUs: 0, stages, gracefulRampDown: '30s', gracefulStop: '30s' } },
    thresholds: Object.assign(
      {
        // soft threshold + hard safety stop: abort the whole run if more than 10% fail after 1 min
        http_req_failed: ['rate<0.01', { threshold: 'rate<0.10', abortOnFail: true, delayAbortEval: '1m' }],
        checks: ['rate>0.99'],
      },
      thresholds || {}
    ),
    summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
    userAgent: UA,
  };
}

// 429 is an expected answer from the rate limiter (counted separately, not an error)
export function expect429() {
  http.setResponseCallback(http.expectedStatuses({ min: 200, max: 399 }, 429));
}

export function think() {
  const lo = Number(__ENV.THINK_MIN || 1), hi = Number(__ENV.THINK_MAX || 3);
  sleep(lo + Math.random() * Math.max(0, hi - lo));
}
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---- request wrappers (tags drive thresholds: kind = page|api|static|image) ----
export function page(path, name) {
  const r = http.get(STORE_URL + path, { headers: htmlHeaders(), tags: { kind: 'page', name: `PAGE ${name}` } });
  if (r.status === 429) rateLimited.add(1);
  check(r, { [`${name} 200`]: (x) => x.status === 200 });
  return r;
}
export function apiGet(path, name, kind) {
  const r = http.get(API_URL + path, { headers: apiHeaders(), tags: { kind: kind || 'api', name: `GET ${name}` } });
  if (r.status === 429) rateLimited.add(1);
  return r;
}
export function apiPost(path, body, name, opts) {
  const r = http.post(API_URL + path, JSON.stringify(body || {}), Object.assign({ headers: apiHeaders(), tags: { kind: 'api', name: `POST ${name}` } }, opts || {}));
  if (r.status === 429) rateLimited.add(1);
  return r;
}
export function jsonOf(r) {
  try { return r.json(); } catch (e) { return null; }
}

// Fetch a few static assets + optimized images referenced by an HTML page.
export function loadAssets(htmlRes, maxStatic, maxImages) {
  if (!htmlRes || typeof htmlRes.body !== 'string') return;
  const body = htmlRes.body;
  const uniq = (re, lim) => {
    const out = [];
    let m;
    while ((m = re.exec(body)) && out.length < lim) {
      const v = m[1].replace(/&amp;/g, '&');
      if (out.indexOf(v) === -1) out.push(v);
    }
    return out;
  };
  const statics = uniq(/["'](\/_next\/static\/[^"'\s?]+\.(?:js|css|woff2))["']/g, maxStatic || 6);
  const images = uniq(/["'](\/_next\/image\?[^"'\s]+)["']/g, maxImages || 4);
  const reqs = [];
  statics.forEach((p) => reqs.push(['GET', STORE_URL + p, null, { headers: htmlHeaders({ Accept: '*/*' }), tags: { kind: 'static', name: 'STATIC _next/static' } }]));
  images.forEach((p) => reqs.push(['GET', STORE_URL + p, null, { headers: htmlHeaders({ Accept: 'image/avif,image/webp,*/*' }), tags: { kind: 'image', name: 'IMAGE _next/image' } }]));
  if (reqs.length) http.batch(reqs);
}

// ---- catalog discovery (run once in setup) ------------------------------
export function loadCatalog() {
  const reg = http.get(`${API_URL}/store/regions`, { headers: apiHeaders(), tags: { kind: 'api', name: 'setup regions' } });
  if (reg.status !== 200) {
    throw new Error(`setup: GET /store/regions returned ${reg.status}. Check API_URL, MEDUSA_PK and basic auth. Body: ${String(reg.body).slice(0, 200)}`);
  }
  const regions = jsonOf(reg).regions || [];
  const region = regions.find((r) => (r.countries || []).some((c) => c.iso_2 === 'lk')) || regions[0];
  if (!region) throw new Error('setup: no regions found');

  const pr = http.get(
    `${API_URL}/store/products?limit=100&region_id=${region.id}&fields=id,handle,title,+metadata,*variants,+variants.inventory_quantity`,
    { headers: apiHeaders(), tags: { kind: 'api', name: 'setup products' } }
  );
  if (pr.status !== 200) throw new Error(`setup: GET /store/products returned ${pr.status}`);
  const products = (jsonOf(pr).products || [])
    .filter((p) => !(p.metadata && p.metadata.internal))
    .map((p) => ({
      id: p.id,
      handle: p.handle,
      variant_ids: (p.variants || [])
        .filter((v) => !v.manage_inventory || v.allow_backorder || (v.inventory_quantity || 0) > 5)
        .map((v) => v.id),
    }))
    .filter((p) => p.handle && p.variant_ids.length);
  if (!products.length) throw new Error('setup: no sellable products found on dev');

  const cr = http.get(`${API_URL}/store/product-categories?limit=100&fields=id,handle,name`, { headers: apiHeaders(), tags: { kind: 'api', name: 'setup categories' } });
  const categories = cr.status === 200 ? (jsonOf(cr).product_categories || []).map((c) => c.handle).filter(Boolean) : [];

  return { region_id: region.id, currency_code: region.currency_code, products, categories };
}
