import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Redis from "ioredis"

/**
 * Deeper health check than the framework's built-in /health (which only
 * confirms the process is alive). Point an uptime monitor at this instead —
 * it actually exercises the database and Redis connections, which is what
 * you want alerted on, not just "the Node process didn't crash."
 */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const checks: Record<string, { ok: boolean; error?: string }> = {}

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    await query.graph({ entity: "region", fields: ["id"], pagination: { take: 1 } })
    checks.database = { ok: true }
  } catch (e: any) {
    checks.database = { ok: false, error: e?.message }
  }

  if (process.env.REDIS_URL) {
    try {
      const redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        connectTimeout: 3000,
      })
      await redis.connect()
      await redis.ping()
      redis.disconnect()
      checks.redis = { ok: true }
    } catch (e: any) {
      checks.redis = { ok: false, error: e?.message }
    }
  }

  const allOk = Object.values(checks).every((c) => c.ok)

  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ok" : "degraded",
    checks,
    timestamp: new Date().toISOString(),
  })
}
