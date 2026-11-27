import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'

/**
 * Sends the "shipped" email when a fulfillment is marked as shipped in admin
 * (shipment.created), not when it is created (that is packing). Skips it
 * when the admin ticked "don't notify the customer".
 */
export default async function orderShippedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  let notificationModuleService: INotificationModuleService | undefined;
  try {
    notificationModuleService = container.resolve(Modules.NOTIFICATION);
  } catch (err) {}
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  const fulfillmentModuleService: any = container.resolve(Modules.FULFILLMENT)

  try {
    if (data?.no_notification) return
    const fulfillmentId = data?.id || data?.fulfillment_id
    let orderId = data?.order_id
    if (!orderId && fulfillmentId) {
      const query: any = container.resolve('query')
      const { data: links } = await query.graph({
        entity: 'order_fulfillment',
        fields: ['order_id'],
        filters: { fulfillment_id: fulfillmentId },
      })
      orderId = links?.[0]?.order_id
    }
    if (!orderId) return
    const order = await orderModuleService.retrieveOrder(orderId, {
      relations: ['shipping_address'],
    })
    const fulfillment = await fulfillmentModuleService.retrieveFulfillment(fulfillmentId)

    if (!order?.email) {
      console.warn('[Email] No email on order for shipped event, skipping')
      return
    }

    const trackingLinks = fulfillment?.tracking_links ?? []
    const trackingNumber = trackingLinks[0]?.tracking_number ?? fulfillment?.tracking_number
    const trackingUrl = trackingLinks[0]?.url

    if (notificationModuleService) await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.ORDER_SHIPPED,
      idempotency_key: `order-shipped-${fulfillmentId}`,
      data: {
        emailOptions: {
          replyTo: 'hello@cardle.lk',
          subject: `Cardle order #${order.display_id} is on its way`,
        },
        orderDisplayId: String(order.display_id),
        customerFirstName: order.shipping_address?.first_name ?? 'Customer',
        trackingNumber,
        trackingUrl,
        // Provider ids (manual_manual) mean nothing to customers.
        carrierName: /manual/i.test(String(fulfillment?.provider_id || '')) ? undefined : fulfillment?.provider_id,
        preview: `Your order #${order.display_id} is on its way!`,
      },
    })
  } catch (error) {
    console.error('[Email] Error sending shipping notification:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'shipment.created',
}
