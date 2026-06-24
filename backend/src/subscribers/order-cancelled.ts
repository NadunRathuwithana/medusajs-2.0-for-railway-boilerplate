import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'

export default async function orderCancelledHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)

  try {
    const order = await orderModuleService.retrieveOrder(data.id, {
      relations: ['summary', 'shipping_address'],
    })

    if (!order?.email) return

    const total = order.summary
      ? `${order.currency_code?.toUpperCase() ?? ''} ${((order.summary as any).raw_current_order_total?.value ?? 0) / 100}`
      : undefined

    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.ORDER_CANCELLED,
      data: {
        emailOptions: {
          replyTo: 'nadunrathuwithanaproductions@gmail.com',
          subject: `❌ Order #${order.display_id} Cancelled`,
        },
        orderDisplayId: order.display_id,
        customerFirstName: order.shipping_address?.first_name ?? 'Customer',
        orderTotal: total,
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
