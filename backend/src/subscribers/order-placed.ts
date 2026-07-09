import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  INotificationModuleService,
  IOrderModuleService,
} from "@medusajs/framework/types";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { EmailTemplates } from "../modules/email-notifications/templates";
import { sendPurchaseEvent } from "../lib/meta-capi";

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  let notificationModuleService: INotificationModuleService | undefined;
  try {
    notificationModuleService = container.resolve(Modules.NOTIFICATION);
  } catch (err) {}
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: [order] } = await query.graph({
    entity: "order",
    filters: { id: data.id },
    fields: [
      "*",
      "items.*",
      "shipping_address.*",
      "billing_address.*",
      "customer.*",
      "payment_collections.*",
      "payment_collections.payments.*",
    ],
  });

  if (!order) {
    console.error(`[Order Placed] Order not found for id: ${data.id}`);
    return;
  }

  const shippingAddress = order.shipping_address || {};

  try {
    // Send Meta Conversions API event
    await sendPurchaseEvent(order);
  } catch (error) {
    console.error("[Meta CAPI] Error:", error);
  }

  try {
    if (notificationModuleService)
      await notificationModuleService.createNotifications({
        to: order.email,
        channel: "email",
        template: EmailTemplates.ORDER_PLACED,
        data: {
          emailOptions: {
            replyTo: "hello@cardle.lk",
            subject: `Order Confirmed — #${order.display_id}`,
          },
          order,
          shippingAddress,
          preview: "Thank you for your order!",
        },
      });
  } catch (error) {
    console.error("[Email] Error sending order confirmation:", error);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
