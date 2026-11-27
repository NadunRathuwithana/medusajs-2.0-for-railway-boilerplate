// Webhook / callback burst with FAKE payloads. Nothing here can be a real payment:
//  - Onepay txn ids are "QA_FAKE_*" and session ids "payses_QA_FAKE_*" (no such rows exist)
//  - Koko calls carry an invalid RSA signature, so signature verification rejects them
// Expected: every call answers 200 (or 429 once the limiter bites) and NO order/payment is created.
//
// Targets:
//   POST {API_URL}/webhooks/onepay   (rate limit 60/min/IP)
//   POST {API_URL}/webhooks/koko     (form-urlencoded, rate limit 60/min/IP)
//   POST {API_URL}/collect  and  /api/collect   (NO rate limit; each call makes a REAL outbound
//        request to Onepay's status API with the dev token when ONEPAY_* env is set on dev.
//        Kept low volume on purpose. Disable with COLLECT=0.)
//
// Phases per iteration (iteration number decides):
//   SAME    : the identical txn + session id fired 5x concurrently (idempotency)
//   DIFFERENT: 5 distinct txn/session ids fired concurrently
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { buildOptions, API_URL, apiHeaders, expect429, rateLimited, RUN_ID, loadCatalog } from './lib.js';

expect429();

const accepted = new Counter('webhook_accepted_200');
const COLLECT = (__ENV.COLLECT || '1') === '1';

export const options = buildOptions(0.02, {
  'http_req_duration{kind:webhook}': ['p(95)<2000'],
  'http_req_duration{kind:collect}': ['p(95)<5000'],
});

export function setup() {
  return {};
}

function hdr(extra) {
  const h = apiHeaders(extra);
  return h;
}

function onepayBody(txn, session) {
  return JSON.stringify({ transaction_id: txn, status: 1, status_message: 'SUCCESS', additional_data: session, amount: '1000.00' });
}
function kokoBody(order, trn) {
  return `orderId=${encodeURIComponent(order)}&trnId=${encodeURIComponent(trn)}&status=SUCCESS&desc=qa-fake&signature=QUFBQQ%3D%3D`;
}

export default function () {
  const n = `${RUN_ID}-${__VU}-${__ITER}`;
  const same = __ITER % 2 === 0;
  const ids = same ? [0, 0, 0, 0, 0].map(() => 'SAME') : [1, 2, 3, 4, 5].map((i) => `D${i}`);
  const reqs = [];

  ids.forEach((k, i) => {
    const txn = same ? `QA_FAKE_TXN_${RUN_ID}_SAME` : `QA_FAKE_TXN_${n}_${k}`;
    const session = same ? `payses_QA_FAKE_${RUN_ID}_SAME` : `payses_QA_FAKE_${n}_${k}`;
    reqs.push(['POST', `${API_URL}/webhooks/onepay`, onepayBody(txn, session), { headers: hdr(), tags: { kind: 'webhook', name: `POST webhooks/onepay ${same ? 'same' : 'diff'}` } }]);
    reqs.push(['POST', `${API_URL}/webhooks/koko`, kokoBody(session, `QA_FAKE_TRN_${same ? 'SAME' : n + k}`), { headers: hdr({ 'Content-Type': 'application/x-www-form-urlencoded' }), tags: { kind: 'webhook', name: `POST webhooks/koko ${same ? 'same' : 'diff'}` } }]);
    if (COLLECT && i < 2) {
      reqs.push(['POST', `${API_URL}/api/collect`, JSON.stringify({ transaction_id: txn }), { headers: hdr(), tags: { kind: 'collect', name: 'POST api/collect' } }]);
      reqs.push(['POST', `${API_URL}/collect`, JSON.stringify({ transaction_id: txn }), { headers: hdr(), tags: { kind: 'collect', name: 'POST collect' } }]);
    }
  });

  const res = http.batch(reqs);
  res.forEach((r) => {
    if (r.status === 429) rateLimited.add(1);
    if (r.status === 200) accepted.add(1);
    check(r, { 'webhook answered 200 or 429 (never 5xx)': (x) => x.status === 200 || x.status === 429 });
  });
  sleep(5); // keep the burst modest: the Onepay status API is a real third party
}
