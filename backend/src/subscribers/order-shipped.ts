import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'

/**
 * Handles order.fulfillment_created event to send shipping confirmation emails.
 * The event data contains the fulfillment and order information.
 */
export default async function orderShippedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  const fulfillmentModuleService: any = container.resolve(Modules.FULFILLMENT)

  try {
    const order = await orderModuleService.retrieveOrder(data.order_id, {
      relations: ['shipping_address'],
    })
    const fulfillment = await fulfillmentModuleService.retrieveFulfillment(data.fulfillment_id)

    if (!order?.email) {
      console.warn('[Email] No email on order for shipped event, skipping')
      return
    }

    const trackingLinks = fulfillment?.tracking_links ?? []
    const trackingNumber = trackingLinks[0]?.tracking_number ?? fulfillment?.tracking_number
    const trackingUrl = trackingLinks[0]?.url

    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.ORDER_SHIPPED,
      data: {
        emailOptions: {
          replyTo: 'hello@cardle.lk',
          subject: `🚚 Your Order #${order.display_id} Has Shipped!`,
        },
        orderDisplayId: String(order.display_id),
        customerFirstName: order.shipping_address?.first_name ?? 'Customer',
        trackingNumber,
        trackingUrl,
        carrierName: fulfillment?.provider_id,
        preview: `Your order #${order.display_id} is on its way!`,
      },
    })
  } catch (error) {
    console.error('[Email] Error sending shipping notification:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'order.fulfillment_created',
}
