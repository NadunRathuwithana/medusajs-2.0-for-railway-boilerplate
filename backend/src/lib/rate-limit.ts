import Redis from "ioredis"
import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"

// Shared connection reused across all rate-limited routes — one Redis client
// for the process, not one per request/middleware instance.
let redisClient: Redis | null = null
function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) return null
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    })
    redisClient.on("error", (err) => {
      console.error("[rate-limit] Redis connection error:", err.message)
    })
  }
  return redisClient
}

function getClientIp(req: MedusaRequest): string {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim()
  }
  return req.socket?.remoteAddress || "unknown"
}

type RateLimitOptions = {
  windowMs: number
  max: number
  keyPrefix: string
  // Custom key suffix (e.g. per-transaction, per-cart) instead of just per-IP.
  keyFn?: (req: MedusaRequest) => string
}

/**
 * Sliding-window-log rate limiter backed by Redis (already provisioned via
 * REDIS_URL for the event bus / workflow engine), so limits hold across
 * multiple backend instances instead of resetting per-process.
 *
 * If REDIS_URL isn't set (e.g. local dev without Redis), this fails open —
 * requests pass through unlimited rather than breaking local development.
 */
export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix, keyFn } = options

  return async function rateLimitMiddleware(
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ): Promise<void> {
    const redis = getRedisClient()
    if (!redis) {
      next()
      return
    }

    const identity = keyFn ? keyFn(req) : getClientIp(req)
    const key = `ratelimit:${keyPrefix}:${identity}`
    const now = Date.now()
    const windowStart = now - windowMs

    try {
      const pipeline = redis.pipeline()
      pipeline.zremrangebyscore(key, 0, windowStart)
      pipeline.zadd(key, now, `${now}-${Math.random()}`)
      pipeline.zcard(key)
      pipeline.pexpire(key, windowMs)
      const results = await pipeline.exec()

      const count = (results?.[2]?.[1] as number) ?? 0

      if (count > max) {
        res.setHeader("Retry-After", Math.ceil(windowMs / 1000).toString())
        res.status(429).json({
          message: "Too many requests. Please try again later.",
        })
        return
      }
    } catch (err: any) {
      // Redis unreachable — fail open rather than blocking legitimate traffic
      // (and rather than 500ing every request in the outage window).
      console.error(`[rate-limit] Redis error for key ${key}:`, err.message)
    }

    next()
  }
}
