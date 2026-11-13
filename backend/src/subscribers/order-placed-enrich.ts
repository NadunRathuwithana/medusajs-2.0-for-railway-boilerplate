import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"

/**
 * Runs on every placed order and:
 *  1. Saves the payment gateway's own ids (Koko / Mintpay / Onepay) on the
 *     order metadata so Ops can show them and a payment can always be matched
 *     to an order.
 *  2. Safety net for the missing-phone bug: if the order has no phone on its
 *     addresses, restore it from the backup copy (metadata.contact_phone, saved
 *     with the cart at the same time as the address) and flag the order so it
 *     is easy to spot if it still cannot be recovered.
 */
export default async function orderPlacedEnrichHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: [order] } = await query.graph({
      entity: "order",
      filters: { id: data.id },
      fields: [
        "id",
        "display_id",
        "metadata",
        "shipping_address.*",
        "billing_address.*",
        "payment_collections.payments.provider_id",
        "payment_collections.payments.data",
      ],
    })
    if (!order) return

    const meta: Record<string, any> = { ...((order as any).metadata || {}) }
    const update: Record<string, any> = {}

    // 1. Gateway ids
    const payments = ((order as any).payment_collections || []).flatMap((pc: any) => pc?.payments || [])
    for (const p of payments) {
      const id = String(p?.provider_id || "")
      const d = p?.data || {}
      let gateway = ""
      let gatewayOrderId = ""
      let gatewayTxnId = ""
      if (id.includes("koko")) {
        gateway = "koko"
        gatewayOrderId = d.koko_order_id || ""
        gatewayTxnId = d.koko_trn_id || ""
      } else if (id.includes("mintpay")) {
        gateway = "mintpay"
        gatewayOrderId = d.mintpay_purchase_id ? String(d.mintpay_purchase_id) : ""
        gatewayTxnId = d.mintpay_purchase_id ? String(d.mintpay_purchase_id) : ""
      } else if (id.includes("onepay")) {
        gateway = "onepay"
        gatewayOrderId = d.ipg_transaction_id || ""
        gatewayTxnId = d.onepay_transaction_id || d.ipg_transaction_id || ""
      }
      if (gateway) {
        update.payment_gateway = gateway
        update.payment_gateway_order_id = gatewayOrderId
        update.payment_gateway_transaction_id = gatewayTxnId
        break
      }
    }

    // 2. Phone safety net
    const ship = (order as any).shipping_address
    const bill = (order as any).billing_address
    const hasPhone = !!(ship?.phone || bill?.phone)
    if (!hasPhone) {
      const backup = meta.contact_phone
      if (backup) {
        update.phone_restored_from_backup = true
        try {
          const orderModule: any = container.resolve(Modules.ORDER)
          await orderModule.updateOrders([
            {
              id: order.id,
              ...(ship ? { shipping_address: { ...ship, phone: backup } } : {}),
              ...(bill ? { billing_address: { ...bill, phone: backup } } : {}),
            },
          ])
          logger.warn(`[order-enrich] order #${(order as any).display_id}: phone was missing, restored from backup`)
        } catch (e: any) {
          update.phone_missing = true
          logger.error(`[order-enrich] order #${(order as any).display_id}: could not restore phone: ${e?.message}`)
        }
      } else {
        update.phone_missing = true
        logger.error(`[order-enrich] order #${(order as any).display_id}: PHONE MISSING and no backup`)
      }
    }

    if (Object.keys(update).length) {
      const orderModule: any = container.resolve(Modules.ORDER)
      await orderModule.updateOrders([{ id: order.id, metadata: { ...meta, ...update } }])
    }
  } catch (e: any) {
    logger.error(`[order-enrich] failed for ${data?.id}: ${e?.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
