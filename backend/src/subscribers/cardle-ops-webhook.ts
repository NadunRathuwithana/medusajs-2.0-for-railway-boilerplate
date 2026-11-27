import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { notifyCardleOps, queueCardleOpsRetry } from '../lib/cardle-ops'

/**
 * Notifies Cardle Ops when an order is placed. Tries 3 times right away; if
 * Ops is still unreachable the order goes on a Redis retry list and the
 * cardle-ops-retry job resends it every 5 minutes for 24h, so no order is
 * silently missing from Ops.
 */
export default async function cardleOpsOrderPlacedHandler({ event: { data } }: SubscriberArgs<{ id: string }>) {
  for (let i = 0; i < 3; i++) {
    if (await notifyCardleOps(data.id)) return
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
  }
  await queueCardleOpsRetry(data.id)
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
