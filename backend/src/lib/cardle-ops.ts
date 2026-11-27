import { getRedisClient } from "./redis"

const RETRY_KEY = "cardleops:retry"

/** POST one order to Cardle Ops. Returns true when Ops accepted it. */
export async function notifyCardleOps(orderId: string): Promise<boolean> {
  const url = process.env.CARDLE_OPS_WEBHOOK_URL
  const secret = process.env.CARDLE_OPS_WEBHOOK_SECRET
  if (!url || !secret) {
    console.warn("[Cardle Ops] Missing CARDLE_OPS_WEBHOOK_URL or CARDLE_OPS_WEBHOOK_SECRET, skipping notification")
    return true // nothing to retry
  }
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-webhook-secret": secret },
      body: JSON.stringify({ event_name: "order.placed", data: { id: orderId } }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!r.ok) console.error(`[Cardle Ops] HTTP ${r.status} for order ${orderId}`)
    return r.ok
  } catch (e: any) {
    console.error(`[Cardle Ops] Failed for order ${orderId}: ${e?.message}`)
    return false
  }
}

/** Remember a failed order so the retry job sends it again (kept 24h). */
export async function queueCardleOpsRetry(orderId: string) {
  const redis = getRedisClient()
  if (!redis) return
  try {
    await redis.zadd(RETRY_KEY, Date.now(), orderId)
  } catch {}
}

/** Resend queued orders; drops entries older than 24h. */
export async function retryCardleOps(): Promise<{ sent: number; left: number }> {
  const redis = getRedisClient()
  if (!redis) return { sent: 0, left: 0 }
  await redis.zremrangebyscore(RETRY_KEY, 0, Date.now() - 24 * 3600_000)
  const ids = await redis.zrange(RETRY_KEY, 0, 49)
  let sent = 0
  for (const id of ids) {
    if (await notifyCardleOps(id)) {
      await redis.zrem(RETRY_KEY, id)
      sent++
    }
  }
  return { sent, left: (await redis.zcard(RETRY_KEY)) || 0 }
}
