import { retryCardleOps } from "../lib/cardle-ops"

export default async function cardleOpsRetryJob() {
  const { sent, left } = await retryCardleOps()
  if (sent || left) console.log(`[Cardle Ops retry] sent=${sent} still_queued=${left}`)
}

export const config = {
  name: "cardle-ops-retry",
  schedule: "*/5 * * * *",
}
