/**
 * Onepay end-to-end stress harness.
 *
 * REAL code under test (imported unchanged from src/):
 *   - modules/onepay-payment/service.ts   (initiate / authorize / sibling recovery)
 *   - modules/onepay-payment/attempts.ts  (Redis ledger, real redis-server)
 *   - api/store/onepay/js-confirm/route.ts (popup confirm endpoint)
 *   - api/collect/route.ts                (Onepay server callback)
 *   - jobs/onepay-reconcile.ts            (5-min safety job)
 *
 * MODELLED: Onepay's API (fake HTTP server, same response shapes as live:
 * { status:200, data:{ status:true|false|null, amount, paid_on } }) and the
 * slice of Medusa the flow touches (payment sessions, cart lock, cart.complete,
 * processPayment on webhook). The model follows Medusa 2.13 semantics:
 * re-initiating deletes the old sessions; authorize statuses other than
 * captured/authorized mark the session "error" and fail completion; cart
 * completion is locked per cart and returns the existing order once completed.
 */
import http from "http"
import fs from "fs"

const PORT = 7341
process.env.REDIS_URL = "redis://127.0.0.1:6390"
process.env.ONEPAY_APP_ID = "TESTAPP"
process.env.ONEPAY_TOKEN = "testtoken"
process.env.ONEPAY_HASH_SALT = "salt"
process.env.ONEPAY_BASE_URL = `http://127.0.0.1:${PORT}`
process.env.ONEPAY_REDIRECT_URL = "https://dev.cardle.lk/lk/checkout/onepay/return"
process.env.ONEPAY_WATCH_WINDOW_MS = "0"

// silence the provider's very chatty request logging
const realLog = console.log
console.log = () => {}
console.warn = () => {}

const SRC = "/home/claude/medusajs-2.0-for-railway-boilerplate/backend/src"
// eslint-disable-next-line @typescript-eslint/no-var-requires
const OnepayService = require(`${SRC}/modules/onepay-payment/service`).default
const attempts = require(`${SRC}/modules/onepay-payment/attempts`)
const jsConfirm = require(`${SRC}/api/store/onepay/js-confirm/route`)
const collect = require(`${SRC}/api/collect/route`)
const reconcileMod = require(`${SRC}/jobs/onepay-reconcile`)
const { getRedisClient } = require(`${SRC}/lib/redis`)

// ───────────────────────── fake Onepay ─────────────────────────
type Txn = { id: string; amount: number; state: "open" | "paid" | "failed"; paid_on?: string; lagUntil?: number }
const onepay = {
  txns: new Map<string, Txn>(),
  down: false,
  seq: 0,
}
const server = http.createServer((req, res) => {
  let body = ""
  req.on("data", (c) => (body += c))
  req.on("end", () => {
    if (onepay.down) {
      res.writeHead(502)
      return res.end("<html>Bad gateway</html>")
    }
    const b = body ? JSON.parse(body) : {}
    res.setHeader("Content-Type", "application/json")
    if (req.url === "/v3/checkout/link/") {
      const id = `T${(++onepay.seq).toString(36).toUpperCase().padStart(6, "0")}${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      onepay.txns.set(id, { id, amount: Number(b.amount), state: "open" })
      return res.end(JSON.stringify({ status: 200, message: "ok", data: { ipg_transaction_id: id, gateway: { redirect_url: `https://gateway.test/pay/${id}` } } }))
    }
    if (req.url === "/v3/transaction/status/") {
      const t = onepay.txns.get(b.onepay_transaction_id)
      if (!t) return res.end(JSON.stringify({ status: 404, message: "not found" }))
      const lagging = t.lagUntil && Date.now() < t.lagUntil
      const status = t.state === "paid" && !lagging ? true : t.state === "failed" ? false : null
      return res.end(JSON.stringify({ status: 200, message: "Successfully get transaction status", data: { ipg_transaction_id: t.id, currency: "LKR", amount: t.amount, status, paid_on: status ? t.paid_on : null } }))
    }
    res.writeHead(404); res.end("{}")
  })
})

// ───────────────────────── Medusa model ─────────────────────────
type Session = { id: string; provider_id: string; status: string; data: any; amount: number }
type Cart = { id: string; total: number; completed_at?: string; sessions: Session[]; payments: { data: any }[]; order?: string; lock: Promise<any> }
const carts = new Map<string, Cart>()
const sessions = new Map<string, Session>()
let sid = 0
const logger = { info() {}, warn() {}, error() {}, debug() {} }
const provider = new OnepayService({ logger } as any, {
  appId: "TESTAPP", token: "testtoken", hashSalt: "salt",
  baseUrl: `http://127.0.0.1:${PORT}`, redirectUrl: "https://dev.cardle.lk/lk/checkout/onepay/return",
})
const stats = { orders: 0, completeCalls: 0, failedAuth: 0 }
let failNextCompletionFor: string | null = null

function newCart(total: number): Cart {
  const c: Cart = { id: `cart_${Math.random().toString(36).slice(2, 10)}`, total, sessions: [], payments: [], lock: Promise.resolve() }
  carts.set(c.id, c)
  return c
}

/** Storefront startOnepayCheckout -> sdk initiatePaymentSession (deletes old sessions). */
async function startCheckout(c: Cart) {
  for (const s of c.sessions) sessions.delete(s.id)
  const s: Session = { id: `payses_${(++sid).toString().padStart(26, "0")}`, provider_id: "pp_onepay_onepay", status: "pending", data: {}, amount: c.total }
  const out = await provider.initiatePayment({ amount: c.total, currency_code: "lkr", data: { session_id: s.id, cart_id: c.id, email: "t@test.lk" }, context: {} } as any)
  s.data = out.data
  c.sessions = [s]
  sessions.set(s.id, s)
  return { txn: out.data.ipg_transaction_id as string, session: s }
}

/** Customer changes the cart while on checkout: Medusa deletes sessions on total change. */
function changeTotal(c: Cart, total: number) {
  if (total !== c.total) {
    for (const s of c.sessions) sessions.delete(s.id)
    c.sessions = []
  }
  c.total = total
}

function withLock<T>(c: Cart, fn: () => Promise<T>): Promise<T> {
  const run = c.lock.then(fn, fn)
  c.lock = run.catch(() => {})
  return run
}

/** cart.complete (authorize session, create order). Throws like Medusa when not authorized. */
async function completeCart(c: Cart): Promise<string> {
  stats.completeCalls++
  return withLock(c, async () => {
    if (c.completed_at) return c.order!
    const s = c.sessions.find((x) => x.provider_id === "pp_onepay_onepay")
    if (!s) throw new Error("No payment session")
    if (s.status !== "captured" && s.status !== "authorized") {
      const r = await provider.authorizePayment({ data: s.data } as any)
      s.data = r.data
      s.status = r.status
      if (r.status !== "captured" && r.status !== "authorized") {
        stats.failedAuth++
        throw new Error(`Payment authorization failed (${r.status})`)
      }
    }
    if (failNextCompletionFor === c.id) {
      failNextCompletionFor = null
      // e.g. a stock/inventory hiccup after payment was authorized
      s.status = "pending" // Medusa rolls back the session authorization on failure
      throw new Error("Simulated completion failure after authorize")
    }
    c.completed_at = new Date().toISOString()
    c.payments.push({ data: s.data })
    c.order = `order_${c.id}`
    stats.orders++
    return c.order
  })
}

/** Medusa processPaymentWorkflow on payment.webhook_received (captured). */
async function processWebhook(payload: any) {
  const action = await provider.getWebhookActionAndData({ data: payload, rawData: "", headers: {} })
  if (action.action !== "captured") return
  const s = sessions.get(action.data.session_id)
  if (!s) return // Medusa: session not found -> nothing
  const c = [...carts.values()].find((x) => x.sessions.includes(s))
  if (!c) return
  await completeCart(c).catch(() => {})
}

const eventBus = {
  queue: [] as Promise<any>[],
  async emit(ev: any) {
    this.queue.push(processWebhook(ev.data.payload.data))
  },
}
const query = {
  async graph({ entity, filters }: any) {
    if (entity === "cart") {
      const c = carts.get(filters.id)
      if (!c) return { data: [] }
      return { data: [{
        id: c.id, total: c.total, currency_code: "lkr", email: "t@test.lk", completed_at: c.completed_at ?? null,
        payment_collection: { id: "pc", payments: c.payments, payment_sessions: c.sessions.map((s) => ({ id: s.id, provider_id: s.provider_id, status: s.status })) },
      }] }
    }
    if (entity === "payment_session") {
      const s = sessions.get(filters.id)
      return { data: s ? [{ id: s.id, status: s.status }] : [] }
    }
    return { data: [] }
  },
}
const container: any = {
  resolve(k: string) {
    if (k === "logger") return logger
    if (k === "query") return query
    return eventBus // Modules.EVENT_BUS
  },
}
async function drain() { while (eventBus.queue.length) await eventBus.queue.shift() }

// ───────────────────────── customer-side actions (real routes) ─────────────────────────
async function callJsConfirm(c: Cart, txn: string): Promise<{ code: number; body: any }> {
  return new Promise((resolve) => {
    const res: any = { code: 200, status(n: number) { this.code = n; return this }, json(b: any) { resolve({ code: this.code, body: b }) } }
    jsConfirm.POST({ body: { cart_id: c.id, transaction_id: txn }, scope: container } as any, res).catch((e: any) => resolve({ code: 500, body: { error: e.message } }))
  })
}
async function callCollect(txn: string) {
  const res: any = { status() { return this }, json() {}, setHeader() {}, send() {} }
  const lg = { info() {}, warn() {}, error() {} }
  await collect.POST({ method: "POST", url: "/api/collect", headers: {}, query: {}, params: {}, body: { transaction_id: txn }, scope: { resolve: (k: string) => (k === "logger" ? lg : container.resolve(k)) } } as any, res)
}
/** Storefront popup finish: confirm (retries) then placeOrder. */
async function popupFinish(c: Cart, txn: string, tries = 8) {
  let ok = false
  for (let i = 0; i < tries && !ok; i++) {
    const r = await callJsConfirm(c, txn)
    ok = r.body?.ok === true
    if (!ok) await sleep(20)
  }
  if (!ok) return { ok: false as const }
  try { return { ok: true as const, order: await completeCart(c) } } catch (e: any) { return { ok: false as const, err: e.message } }
}
/** Return page: check order, confirm txn, placeOrder, retry. */
async function returnPage(c: Cart, txn?: string, rounds = 6) {
  for (let i = 0; i < rounds; i++) {
    if (c.completed_at) return c.order
    if (txn) await callJsConfirm(c, txn)
    try { return await completeCart(c) } catch { await sleep(20) }
  }
  return null
}
async function reconcileNow() {
  // the job ignores attempts younger than 90s: age every attempt past that
  const r = getRedisClient()
  const ids: string[] = await r.zrange("onepay:attempts", 0, -1)
  for (const id of ids) {
    const a = await attempts.getAttempt(id)
    if (a && Date.now() - a.created_at < 100_000) {
      a.created_at = Date.now() - 100_000
      await r.set("onepay:attempt:" + id, JSON.stringify(a))
      await r.zadd("onepay:attempts", a.created_at, id)
      await r.zadd("onepay:cart:" + (a.cart_id || "none"), a.created_at, id)
    }
  }
  await r.del("onepay:reconcile:lock")
  await reconcileMod.default(container)
  await drain()
}
const pay = (txn: string, lagMs = 0) => { const t = onepay.txns.get(txn)!; t.state = "paid"; t.paid_on = new Date().toISOString(); if (lagMs) t.lagUntil = Date.now() + lagMs }
const decline = (txn: string) => { onepay.txns.get(txn)!.state = "failed" }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const amt = () => Math.round((1500 + Math.random() * 12000) * 100) / 100

// ───────────────────────── scenarios ─────────────────────────
type Check = (c: Cart, ctx: any) => string | null // null = pass, else failure reason
type Scenario = { id: string; name: string; expect: string; run: () => Promise<{ c: Cart; ctx: any }>; check: Check }

const orderPaidWith = (c: Cart, txn: string) => c.payments.length === 1 && c.payments[0].data?.ipg_transaction_id === txn
const status = async (txn: string) => (await attempts.getAttempt(txn))?.status

const scenarios: Scenario[] = [
  {
    id: "S01", name: "Pay success in popup", expect: "1 order, paid with that txn",
    run: async () => { const c = newCart(amt()); const { txn } = await startCheckout(c); pay(txn); const r = await popupFinish(c, txn); return { c, ctx: { txn, r } } },
    check: (c, { txn, r }) => (!r.ok ? `popup finish failed: ${r.err}` : !orderPaidWith(c, txn) ? "order not paid with txn" : null),
  },
  {
    id: "S02", name: "Card declined", expect: "no order, popup gets 'failed', ledger failed after job",
    run: async () => { const c = newCart(amt()); const { txn } = await startCheckout(c); decline(txn); const conf = await callJsConfirm(c, txn); let threw = false; try { await completeCart(c) } catch { threw = true }; await reconcileNow(); return { c, ctx: { txn, conf, threw, st: await status(txn) } } },
    check: (c, { conf, threw, st }) => (c.completed_at ? "ORDER CREATED FOR DECLINED CARD" : !conf.body?.failed ? "confirm did not report failed" : !threw ? "complete did not throw" : st !== "failed" ? `ledger ${st}` : null),
  },
  {
    id: "S03", name: "Popup closed without paying", expect: "no order, button resets, retry works with a new link",
    run: async () => { const c = newCart(amt()); const { txn } = await startCheckout(c); const conf = await callJsConfirm(c, txn); await reconcileNow(); const second = await startCheckout(c); pay(second.txn); const r = await popupFinish(c, second.txn); return { c, ctx: { txn, conf, r, second: second.txn } } },
    check: (c, { conf, r, second }) => (conf.body?.ok ? "confirm said ok for unpaid" : !conf.body?.pending ? "confirm not pending" : !r.ok ? "retry after close failed" : !orderPaidWith(c, second) ? "retry order wrong txn" : null),
  },
  {
    id: "S04", name: "Paid, then closed popup before it finished", expect: "close-check finds payment, 1 order",
    run: async () => { const c = newCart(amt()); const { txn } = await startCheckout(c); pay(txn, 60); const first = await callJsConfirm(c, txn); let r: any = { ok: false }; for (let i = 0; i < 10 && !r.ok; i++) { await sleep(15); r = await popupFinish(c, txn, 1) } return { c, ctx: { txn, first, r } } },
    check: (c, { txn, r }) => (!r.ok ? "background close-check never finished the order" : !orderPaidWith(c, txn) ? "wrong txn" : null),
  },
  {
    id: "S05", name: "Paid, tab closed, Onepay callback arrives", expect: "callback alone creates 1 order",
    run: async () => { const c = newCart(amt()); const { txn } = await startCheckout(c); pay(txn); await callCollect(txn); await drain(); return { c, ctx: { txn } } },
    check: (c, { txn }) => (!orderPaidWith(c, txn) ? "no order from callback" : null),
  },
  {
    id: "S06", name: "Paid, tab closed, NO callback", expect: "5-min job creates 1 order",
    run: async () => { const c = newCart(amt()); const { txn } = await startCheckout(c); pay(txn); await reconcileNow(); return { c, ctx: { txn, st: await status(txn) } } },
    check: (c, { txn }) => (!orderPaidWith(c, txn) ? "job did not create order" : null),
  },
  {
    id: "S07", name: "THE BUG: paid an older link, checkout made a newer one", expect: "return page creates 1 order with the paid (old) txn",
    run: async () => { const c = newCart(amt()); const a = await startCheckout(c); const b = await startCheckout(c); await startCheckout(c); pay(a.txn); const o = await returnPage(c); return { c, ctx: { paid: a.txn, other: b.txn, o } } },
    check: (c, { paid, o }) => (!o ? "return page failed" : !orderPaidWith(c, paid) ? "order not on paid txn" : null),
  },
  {
    id: "S08", name: "Old link paid, session already errored, popup confirm", expect: "popup confirm accepts sibling, 1 order",
    run: async () => { const c = newCart(amt()); const a = await startCheckout(c); await startCheckout(c); try { await completeCart(c) } catch {} ; pay(a.txn); const r = await popupFinish(c, a.txn); return { c, ctx: { paid: a.txn, r } } },
    check: (c, { paid, r }) => (!r.ok ? `popup finish failed ${r.err}` : !orderPaidWith(c, paid) ? "wrong txn" : null),
  },
  {
    id: "S09", name: "Old link paid, customer gone, no callback", expect: "job attaches to current session, 1 order",
    run: async () => { const c = newCart(amt()); const a = await startCheckout(c); await startCheckout(c); try { await completeCart(c) } catch {}; pay(a.txn); await reconcileNow(); return { c, ctx: { paid: a.txn } } },
    check: (c, { paid }) => (!orderPaidWith(c, paid) ? "job did not recover" : null),
  },
  {
    id: "S10", name: "Paid, then cart changed (item added) before order", expect: "NO auto order (amount differs), flagged needs_review",
    run: async () => { const c = newCart(amt()); const a = await startCheckout(c); pay(a.txn); changeTotal(c, c.total + 2500); await startCheckout(c); const o = await returnPage(c, undefined, 2); await reconcileNow(); return { c, ctx: { o, st: await status(a.txn) } } },
    check: (c, { st }) => (c.completed_at ? "ORDER CREATED WITH UNDERPAYMENT" : st !== "needs_review" ? `ledger ${st}, expected needs_review` : null),
  },
  {
    id: "S11", name: "Customer paid twice (two links)", expect: "1 order, the extra payment flagged DUPLICATE for refund",
    run: async () => { const c = newCart(amt()); const a = await startCheckout(c); const b = await startCheckout(c); pay(a.txn); pay(b.txn); await returnPage(c); await reconcileNow(); const used = c.payments[0]?.data?.ipg_transaction_id; const extra = used === a.txn ? b.txn : a.txn; return { c, ctx: { extra, st: await status(extra), note: (await attempts.getAttempt(extra))?.note } } },
    check: (c, { st, note }) => (c.payments.length !== 1 ? `${c.payments.length} orders` : st !== "needs_review" || !String(note).includes("DUPLICATE") ? `duplicate not flagged (${st})` : null),
  },
  {
    id: "S12", name: "Race: popup + return page + callback + job at once", expect: "exactly 1 order",
    run: async () => { const c = newCart(amt()); const { txn } = await startCheckout(c); pay(txn); await Promise.all([popupFinish(c, txn), returnPage(c, txn), callCollect(txn), reconcileNow()]); await drain(); return { c, ctx: { txn } } },
    check: (c, { txn }) => (c.payments.length !== 1 ? `${c.payments.length} orders!` : !orderPaidWith(c, txn) ? "wrong txn" : null),
  },
  {
    id: "S13", name: "Attacker posts another cart's paid txn", expect: "rejected (409), no order",
    run: async () => { const victim = newCart(5000); const v = await startCheckout(victim); pay(v.txn); const c = newCart(5000); await startCheckout(c); const conf = await callJsConfirm(c, v.txn); let threw = false; try { await completeCart(c) } catch { threw = true } return { c, ctx: { conf, threw } } },
    check: (c, { conf }) => (conf.code !== 409 ? `confirm returned ${conf.code}` : c.completed_at ? "ORDER CREATED WITH STOLEN TXN" : null),
  },
  {
    id: "S14", name: "Unknown / made-up transaction id", expect: "rejected, no order",
    run: async () => { const c = newCart(amt()); await startCheckout(c); const fake = `FAKE${Date.now()}`; onepay.txns.set(fake, { id: fake, amount: c.total, state: "paid", paid_on: "x" }); const conf = await callJsConfirm(c, fake); try { await completeCart(c) } catch {} return { c, ctx: { conf } } },
    check: (c, { conf }) => (conf.body?.ok ? "unknown txn accepted" : c.completed_at ? "ORDER CREATED" : null),
  },
  {
    id: "S15", name: "Onepay API down while customer finishes", expect: "no wrong order, not marked failed; job recovers once API is back",
    run: async () => { const c = newCart(amt()); const { txn } = await startCheckout(c); pay(txn); onepay.down = true; const r = await popupFinish(c, txn, 2); const o = await returnPage(c, txn, 2); const stDown = await status(txn); onepay.down = false; await reconcileNow(); return { c, ctx: { txn, r, o, stDown } } },
    check: (c, { txn, r, stDown }) => (r.ok ? "finished while API down?" : stDown === "failed" ? "marked failed while API down" : !orderPaidWith(c, txn) ? "not recovered after API back" : null),
  },
  {
    id: "S16", name: "Order completion fails once after payment authorized", expect: "retry still creates 1 order (sibling not lost)",
    run: async () => { const c = newCart(amt()); const a = await startCheckout(c); await startCheckout(c); pay(a.txn); failNextCompletionFor = c.id; const o = await returnPage(c); return { c, ctx: { paid: a.txn, o } } },
    check: (c, { paid, o }) => (!o ? "retry failed (sibling lost)" : !orderPaidWith(c, paid) ? "wrong txn" : null),
  },
  {
    id: "S17", name: "Onepay reports payment late (status lag)", expect: "return page waits, then 1 order",
    run: async () => { const c = newCart(amt()); const { txn } = await startCheckout(c); pay(txn, 80); const o = await returnPage(c, txn, 12); return { c, ctx: { txn, o } } },
    check: (c, { txn, o }) => (!o ? "gave up during lag" : !orderPaidWith(c, txn) ? "wrong txn" : null),
  },
  {
    id: "S18", name: "Unpaid link left 24h+", expect: "no order, ledger expired",
    run: async () => { const c = newCart(amt()); const { txn } = await startCheckout(c); const r = getRedisClient(); const a = await attempts.getAttempt(txn); a.created_at = Date.now() - 25 * 3600_000; await r.set("onepay:attempt:" + txn, JSON.stringify(a)); await r.zadd("onepay:attempts", a.created_at, txn); await r.del("onepay:reconcile:lock"); await r.del("onepay:reconcile:full"); await reconcileMod.default(container); return { c, ctx: { st: await status(txn) } } },
    check: (c, { st }) => (c.completed_at ? "ORDER CREATED" : st !== "expired" ? `ledger ${st}` : null),
  },
  {
    id: "S19", name: "Double click Place order (two links) then pay the newest", expect: "1 order",
    run: async () => { const c = newCart(amt()); const [a, b] = await Promise.all([startCheckout(c), startCheckout(c)]); const cur = c.sessions[0].data.ipg_transaction_id; pay(cur); const r = await popupFinish(c, cur); return { c, ctx: { cur, r, a: a.txn, b: b.txn } } },
    check: (c, { cur, r }) => (!r.ok ? "failed" : !orderPaidWith(c, cur) ? "wrong txn" : null),
  },
  {
    id: "S21", name: "YOUR CASE: pay, close the tab instantly, no callback", expect: "server alone creates the order within ~5-10s",
    run: async () => {
      const c = newCart(amt()); const { txn } = await startCheckout(c)
      const r = getRedisClient(); await r.del("onepay:reconcile:lock")
      process.env.ONEPAY_WATCH_WINDOW_MS = "16000"
      const t0 = Date.now()
      setTimeout(() => pay(txn), 2000) // customer pays 2s into the minute, then closes the tab
      const job = reconcileMod.default(container)
      let at = 0
      while (!c.completed_at && Date.now() - t0 < 16000) { await sleep(100); await drain() }
      at = Date.now() - t0
      await job; process.env.ONEPAY_WATCH_WINDOW_MS = "0"
      return { c, ctx: { txn, secs: Math.round((at - 2000) / 100) / 10 } }
    },
    check: (c, { txn, secs }) => (!orderPaidWith(c, txn) ? "no order without the browser" : secs > 10 ? `order took ${secs}s after payment` : null),
  },
  {
    id: "S20", name: "Failed old link + paid new link", expect: "1 order on the paid one, failed one ignored",
    run: async () => { const c = newCart(amt()); const a = await startCheckout(c); decline(a.txn); const b = await startCheckout(c); pay(b.txn); const r = await popupFinish(c, b.txn); await reconcileNow(); return { c, ctx: { b: b.txn, r, sa: await status(a.txn) } } },
    check: (c, { b, r, sa }) => (!r.ok ? "failed" : !orderPaidWith(c, b) ? "wrong txn" : sa !== "failed" ? `old link ${sa}` : null),
  },
]

// ───────────────────────── runner ─────────────────────────
async function main() {
  await new Promise<void>((r) => server.listen(PORT, r))
  const RUNS = Number(process.env.RUNS || 20)
  const results: any[] = []
  const t0 = Date.now()
  for (const sc of scenarios) {
    let pass = 0
    const fails: string[] = []
    for (let i = 0; i < RUNS; i++) {
      try {
        const { c, ctx } = await sc.run()
        await drain()
        const why = sc.check(c, ctx)
        if (why) fails.push(`run ${i + 1}: ${why}`)
        else pass++
      } catch (e: any) {
        fails.push(`run ${i + 1}: threw ${e?.message}`)
      }
    }
    results.push({ id: sc.id, name: sc.name, expect: sc.expect, runs: RUNS, pass, fail: RUNS - pass, fails: fails.slice(0, 5) })
    realLog(`${sc.id} ${pass === RUNS ? "PASS" : "FAIL"} ${pass}/${RUNS}  ${sc.name}${fails.length ? "\n     " + fails.slice(0, 3).join("\n     ") : ""}`)
  }
  const out = { ranAt: new Date().toISOString(), ms: Date.now() - t0, totalRuns: results.reduce((a, r) => a + r.runs, 0), totalPass: results.reduce((a, r) => a + r.pass, 0), stats, results }
  fs.writeFileSync(process.env.OUT || "/tmp/onepay-results.json", JSON.stringify(out, null, 2))
  realLog(`\nTOTAL ${out.totalPass}/${out.totalRuns} in ${out.ms}ms`)
  server.close()
  getRedisClient()?.disconnect()
  process.exit(out.totalPass === out.totalRuns ? 0 : 1)
}
main()
