import { getRedisClient } from "../../lib/redis"

/**
 * Durable-ish ledger of every Onepay payment link we hand out.
 *
 * Why: when checkout changes (cart edit, method switch, re-price) Medusa
 * cancels the payment session and creates a new Onepay link. A customer who
 * still pays on the OLD link produces a real Onepay transaction that no
 * payment session points at, so the webhook/return page can never match it
 * and the order is never placed. This ledger remembers every transaction
 * (even for deleted sessions) so the reconcile job can find paid-but-orphaned
 * ones and finish the order.
 */

export type OnepayAttemptStatus =
  | "pending" // link issued, outcome unknown
  | "failed" // Onepay says failed/cancelled
  | "done" // paid and the cart has an order
  | "recovered" // paid, we completed the order from the job
  | "needs_review" // paid but could not be matched safely (manual refund / fix)
  | "expired" // never paid within the window

export type OnepayAttempt = {
  txn_id: string
  session_id: string
  cart_id?: string | null
  reference: string
  amount: number
  currency: string
  email?: string
  phone?: string
  created_at: number
  status: OnepayAttemptStatus
  note?: string
  updated_at?: number
}

const ATTEMPT_PREFIX = "onepay:attempt:"
const INDEX_KEY = "onepay:attempts"
const OVERRIDE_PREFIX = "onepay:override:"
const TTL_SECONDS = 14 * 24 * 3600

export async function recordAttempt(a: OnepayAttempt): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return
  try {
    await redis
      .multi()
      .set(ATTEMPT_PREFIX + a.txn_id, JSON.stringify(a), "EX", TTL_SECONDS)
      .zadd(INDEX_KEY, a.created_at, a.txn_id)
      .exec()
  } catch (e: any) {
    console.error("[onepay-attempts] record failed:", e?.message)
  }
}

export async function getAttempt(txnId: string): Promise<OnepayAttempt | null> {
  const redis = getRedisClient()
  if (!redis) return null
  try {
    const raw = await redis.get(ATTEMPT_PREFIX + txnId)
    return raw ? (JSON.parse(raw) as OnepayAttempt) : null
  } catch {
    return null
  }
}

export async function updateAttempt(
  txnId: string,
  patch: Partial<OnepayAttempt>
): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return
  const cur = await getAttempt(txnId)
  if (!cur) return
  const next = { ...cur, ...patch, updated_at: Date.now() }
  try {
    await redis.set(ATTEMPT_PREFIX + txnId, JSON.stringify(next), "EX", TTL_SECONDS)
  } catch (e: any) {
    console.error("[onepay-attempts] update failed:", e?.message)
  }
}

/** Attempts created between (now - maxAgeMs) and (now - minAgeMs). */
export async function listAttempts(
  minAgeMs: number,
  maxAgeMs: number
): Promise<OnepayAttempt[]> {
  const redis = getRedisClient()
  if (!redis) return []
  const now = Date.now()
  try {
    const ids = await redis.zrangebyscore(INDEX_KEY, now - maxAgeMs, now - minAgeMs)
    // Drop index entries older than the TTL so the set doesn't grow forever.
    await redis.zremrangebyscore(INDEX_KEY, 0, now - TTL_SECONDS * 1000)
    if (!ids.length) return []
    const raws = await redis.mget(ids.map((id) => ATTEMPT_PREFIX + id))
    return raws
      .filter((r): r is string => !!r)
      .map((r) => JSON.parse(r) as OnepayAttempt)
  } catch (e: any) {
    console.error("[onepay-attempts] list failed:", e?.message)
    return []
  }
}

/**
 * Session -> transaction override. Lets the reconcile job point a cart's
 * CURRENT payment session at an earlier PAID transaction without touching
 * the session row (Medusa's updatePaymentSession would re-initiate Onepay).
 * authorizePayment() reads this before checking status.
 */
export async function setSessionOverride(sessionId: string, txnId: string) {
  const redis = getRedisClient()
  if (!redis) return
  await redis.set(OVERRIDE_PREFIX + sessionId, txnId, "EX", 24 * 3600)
}

export async function getSessionOverride(sessionId: string): Promise<string | null> {
  const redis = getRedisClient()
  if (!redis) return null
  try {
    return await redis.get(OVERRIDE_PREFIX + sessionId)
  } catch {
    return null
  }
}
