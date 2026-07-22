import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'

export default async function orderCancelledHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  let notificationModuleService: INotificationModuleService | undefined;
  try {
    notificationModuleService = container.resolve(Modules.NOTIFICATION);
  } catch (err) {}
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)

  try {
    const order = await orderModuleService.retrieveOrder(data.id, {
      relations: ['summary', 'shipping_address'],
    })

    if (!order?.email) return

    const orderTotal = order?.summary
      ? `${order.currency_code?.toUpperCase() ?? ''} ${Number((order.summary as any).raw_current_order_total?.value ?? 0).toFixed(2)}`
      : undefined

    if (notificationModuleService) await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.ORDER_CANCELLED,
      data: {
        emailOptions: {
          replyTo: 'hello@cardle.lk',
          subject: `❌ Order #${order.display_id} Cancelled`,
        },
        orderDisplayId: String(order.display_id),
        customerFirstName: order.shipping_address?.first_name ?? 'Customer',
        orderTotal,
        preview: `Your order #${order.display_id} has been cancelled.`,
      },
    })
  } catch (error) {
    console.error('[Email] Error sending order cancellation notification:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'order.canceled',
}
