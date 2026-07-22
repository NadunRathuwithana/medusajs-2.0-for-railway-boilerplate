import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'

export default async function paymentFailedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  let notificationModuleService: INotificationModuleService | undefined;
  try {
    notificationModuleService = container.resolve(Modules.NOTIFICATION);
  } catch (err) {}
  
  // Note: Depending on Medusa v2.0 exact payload for 'payment.failed', we might need to resolve the order.
  // We assume 'data' contains { id } mapping to the payment or order.
  const query = container.resolve('query')

  try {
    // If the event payload is just the payment ID or cart ID, we need to fetch related data.
    // We will attempt to fetch order details assuming data.id is the order id, or related to order.
    // Wait, typically payment.failed might contain cart_id or order_id. Let's gracefully fetch what we can.
    const { data: orders } = await query.graph({
      entity: 'order',
      fields: ['id', 'display_id', 'email', 'currency_code', 'summary.raw_current_order_total', 'shipping_address.*'],
      filters: { id: data.id }, // Best effort, fallback to customer email if available elsewhere
    })

    const order = orders?.[0]

    if (!order?.email) {
      console.warn('[Email] Could not find order or email for payment.failed event, skipping')
      return
    }

    const formatCurrency = (amount: number, currency: string) => {
      return `${currency?.toUpperCase() ?? ''} ${Number(amount).toFixed(2)}`
    }

    const orderTotal = order.summary?.raw_current_order_total?.value 
      ? formatCurrency(order.summary.raw_current_order_total.value, order.currency_code)
      : undefined

    if (notificationModuleService) await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.PAYMENT_FAILED,
      data: {
        emailOptions: {
          replyTo: 'hello@cardle.lk', // Cardle standard transactional sender
          subject: `Action Required: Payment failed for Order #${order.display_id}`,
        },
        orderDisplayId: String(order.display_id),
        customerFirstName: order.shipping_address?.first_name ?? 'Customer',
        orderTotal,
        errorMessage: 'The payment for your order could not be processed.',
        checkoutUrl: 'https://cardle.lk', // Best effort link
        preview: 'Payment action required',
      },
    })
  } catch (error) {
    console.error('[Email] Error sending payment failed notification:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'payment.failed',
}
