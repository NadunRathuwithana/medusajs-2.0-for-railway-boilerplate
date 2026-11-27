import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'

/** Refund email when a payment is refunded from admin. */
export default async function orderRefundedHandler({ event: { data }, container }: SubscriberArgs<any>) {
  let notification: INotificationModuleService | undefined
  try {
    notification = container.resolve(Modules.NOTIFICATION)
  } catch {}
  if (!notification) return
  try {
    const query: any = container.resolve('query')
    const { data: payments } = await query.graph({
      entity: 'payment',
      fields: ['id', 'currency_code', 'refunds.id', 'refunds.amount', 'refunds.note', 'refunds.created_at', 'payment_collection.order.id', 'payment_collection.order.display_id', 'payment_collection.order.email', 'payment_collection.order.shipping_address.first_name'],
      filters: { id: data.id },
    })
    const p = payments?.[0]
    const order = p?.payment_collection?.order
    if (!order?.email) return
    const latest = [...(p.refunds || [])].sort((a: any, b: any) => +new Date(a.created_at) - +new Date(b.created_at)).pop()
    if (!latest) return
    const amt = Number(latest.amount) || 0
    const frac = Number.isInteger(amt) ? 0 : 2
    await notification.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.ORDER_REFUND,
      idempotency_key: `order-refund-${latest.id}`,
      data: {
        emailOptions: { replyTo: 'hello@cardle.lk', subject: `Cardle order #${order.display_id} refund` },
        orderDisplayId: String(order.display_id),
        customerFirstName: order.shipping_address?.first_name ?? 'Customer',
        refundAmount: `${String(p.currency_code || 'lkr').toUpperCase()} ${amt.toLocaleString('en-US', { minimumFractionDigits: frac, maximumFractionDigits: frac })}`,
        refundReason: latest.note || undefined,
        shopUrl: process.env.STORE_URL || 'https://cardle.lk',
        preview: `Refund for order #${order.display_id}`,
      },
    })
  } catch (e: any) {
    console.error('[Email] refund email failed:', e?.message)
  }
}

export const config: SubscriberConfig = { event: 'payment.refunded' }
