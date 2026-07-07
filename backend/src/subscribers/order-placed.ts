import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)

  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ['items', 'summary', 'shipping_address', 'payment_collections', 'payment_collections.payments'],
  })
  const shippingAddress = await (orderModuleService as any).orderAddressService_.retrieve(
    order.shipping_address.id
  )

  try {
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.ORDER_PLACED,
      data: {
        emailOptions: {
          replyTo: 'hello@cardle.lk',
          subject: `Order Confirmed — #${order.display_id}`,
        },
        order,
        shippingAddress,
        preview: 'Thank you for your order!',
      },
    })
  } catch (error) {
    console.error('[Email] Error sending order confirmation:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
