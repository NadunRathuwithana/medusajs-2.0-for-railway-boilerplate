import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { INotificationModuleService, MedusaContainer } from "@medusajs/framework/types"
import { EmailTemplates } from "../modules/email-notifications/templates"
import { getRedisClient } from "../lib/redis"

const REMINDER_AFTER_MS = 3 * 60 * 60 * 1000 // cart idle for 3+ hours
const DONT_BOTHER_AFTER_MS = 7 * 24 * 60 * 60 * 1000 // ...but not older than 7 days
const ALREADY_SENT_TTL_SECONDS = 30 * 24 * 60 * 60 // don't re-send to the same cart for 30 days

const STORE_URL = process.env.STORE_URL || "https://cardle.lk"

function alreadySentKey(cartId: string) {
  return `abandoned-cart:sent:${cartId}`
}

export default async function abandonedCartJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const redis = getRedisClient()

  if (!redis) {
    logger.warn("[abandoned-cart] REDIS_URL not set — skipping (need Redis to avoid re-sending reminders every run)")
    return
  }

  let notificationModuleService: INotificationModuleService | undefined
  try {
    notificationModuleService = container.resolve(Modules.NOTIFICATION)
  } catch {
    logger.warn("[abandoned-cart] Notification module not configured — skipping")
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const now = Date.now()
  const idleSince = new Date(now - REMINDER_AFTER_MS)
  const dontBotherBefore = new Date(now - DONT_BOTHER_AFTER_MS)

  const { data: carts } = await query.graph({
    entity: "cart",
    filters: {
      completed_at: null,
      updated_at: { $lte: idleSince, $gte: dontBotherBefore },
    },
    fields: [
      "id",
      "email",
      "currency_code",
      "updated_at",
      "items.title",
      "items.thumbnail",
      "items.quantity",
      "items.unit_price",
      "customer.first_name",
      "customer.email",
    ],
  })

  let sent = 0
  let skipped = 0

  for (const cart of carts) {
    if (!cart.items?.length) continue

    const email = cart.email || cart.customer?.email
    if (!email) continue

    const alreadySent = await redis.get(alreadySentKey(cart.id))
    if (alreadySent) {
      skipped++
      continue
    }

    const currency = (cart.currency_code || "lkr").toUpperCase()
    const formatAmount = (amount: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)

    const items = cart.items.map((item: any) => ({
      title: item.title,
      thumbnail: item.thumbnail ?? undefined,
      quantity: item.quantity,
      total: formatAmount((item.unit_price || 0) * item.quantity),
    }))
    const cartTotal = formatAmount(
      cart.items.reduce((sum: number, item: any) => sum + (item.unit_price || 0) * item.quantity, 0)
    )

    try {
      await notificationModuleService.createNotifications({
        to: email,
        channel: "email",
        template: EmailTemplates.ABANDONED_CART,
        data: {
          emailOptions: {
            replyTo: "hello@cardle.lk",
            subject: "You left something in your cart",
          },
          customerFirstName: cart.customer?.first_name || "there",
          items,
          cartTotal,
          cartUrl: `${STORE_URL}/cart?cart_id=${cart.id}`,
        },
      })

      // Set only after a successful send — a transient send failure should
      // allow retrying on the job's next run rather than being locked out
      // for 30 days.
      await redis.set(alreadySentKey(cart.id), "1", "EX", ALREADY_SENT_TTL_SECONDS)
      sent++
    } catch (error: any) {
      logger.error(`[abandoned-cart] Failed to send reminder for cart ${cart.id}: ${error.message}`)
    }
  }

  logger.info(`[abandoned-cart] Checked ${carts.length} idle carts, sent ${sent} reminders, skipped ${skipped} already-sent`)
}

export const config = {
  name: "abandoned-cart-reminder",
  schedule: "0 * * * *", // hourly
}
