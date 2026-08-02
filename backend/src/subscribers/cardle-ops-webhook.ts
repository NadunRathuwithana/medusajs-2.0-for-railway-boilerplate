import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'

/**
 * Notifies the Cardle Ops app whenever an order is placed. This is a
 * best-effort, fire-and-forget notification: Medusa's event bus does not
 * guarantee redelivery on failure the way a durable queue would, so a
 * failed/timed out request here is logged and dropped rather than retried.
 * If reliable delivery becomes a requirement, replace this with a durable
 * retry mechanism (e.g. an outbox table + scheduled job, or a real queue).
 */
export default async function cardleOpsOrderPlacedHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  const webhookUrl = process.env.CARDLE_OPS_WEBHOOK_URL
  const webhookSecret = process.env.CARDLE_OPS_WEBHOOK_SECRET

  if (!webhookUrl || !webhookSecret) {
    console.warn('[Cardle Ops] Missing CARDLE_OPS_WEBHOOK_URL or CARDLE_OPS_WEBHOOK_SECRET, skipping notification')
    return
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookSecret,
      },
      body: JSON.stringify({
        event_name: 'order.placed',
        data: { id: data.id },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      console.error(`[Cardle Ops] Webhook responded with status ${response.status} for order ${data.id}`)
    }
  } catch (error) {
    console.error(`[Cardle Ops] Failed to notify webhook for order ${data.id}:`, error)
  } finally {
    clearTimeout(timeout)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
