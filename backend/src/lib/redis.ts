import Redis from "ioredis"

// Shared connection reused by rate-limit.ts and koko-payment/service.ts — one
// Redis client for the process, not one per consumer. Already provisioned
// via REDIS_URL for the event bus / workflow engine.
let redisClient: Redis | null = null

export function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) return null
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    })
    redisClient.on("error", (err) => {
      console.error("[redis] Connection error:", err.message)
    })
  }
  return redisClient
}
