import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { sendPurchaseEvent } from '../lib/meta-capi'

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  console.log('[order.placed] Handler triggered, orderId:', data?.id)

  // Step 1: Resolve services safely
  let notificationModuleService: INotificationModuleService | undefined
  let orderModuleService: IOrderModuleService | undefined

  try {
    orderModuleService = container.resolve(Modules.ORDER)
  } catch (err) {
    console.error('[order.placed] Could not resolve Order module:', err)
    return
  }

  try {
    notificationModuleService = container.resolve(Modules.NOTIFICATION)
  } catch (err) {
    console.warn('[order.placed] Notification module not available — emails will be skipped')
  }

  // Step 2: Fetch order
  let order: any
  try {
    order = await orderModuleService!.retrieveOrder(data.id, {
      relations: ['items', 'summary', 'shipping_address', 'payment_collections', 'payment_collections.payments'],
    })
    console.log('[order.placed] Order retrieved:', order?.display_id, 'email:', order?.email)
  } catch (err) {
    console.error('[order.placed] Failed to retrieve order:', err)
    return
  }

  // Step 3: Fetch shipping address (optional — gracefully degrade if unavailable)
  let shippingAddress: any = order.shipping_address ?? null
  if (order.shipping_address?.id) {
    try {
      shippingAddress = await (orderModuleService as any).orderAddressService_.retrieve(
        order.shipping_address.id
      )
    } catch (err) {
      console.warn('[order.placed] Could not retrieve full shipping address, using embedded data:', (err as any)?.message)
    }
  }

  // Step 4: Meta CAPI event
  try {
    await sendPurchaseEvent(order)
  } catch (error) {
    console.error('[Meta CAPI] Error:', error)
  }

  // Step 5: Send confirmation email
  if (!notificationModuleService) {
    console.warn('[order.placed] Skipping email — no notification provider configured')
    return
  }
  if (!order.email) {
    console.warn('[order.placed] Skipping email — order has no email address')
    return
  }

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
    console.log('[order.placed] Confirmation email sent to', order.email)
  } catch (error) {
    console.error('[Email] Error sending order confirmation:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
