import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Returns product IDs ranked by real quantity sold, most-sold first.
 *
 * The storefront's "Best selling" sort previously had no sales data behind
 * it at all — it silently fell back to sorting by created_at, which just
 * looked like a random order relative to actual sales. This aggregates
 * real order data instead:
 *   order_item.quantity, joined to order_line_item for product_id,
 *   joined to order to exclude cancelled orders.
 * (order_line_item itself has no quantity column in Medusa v2 — quantity
 * lives on the separate order_item table, confirmed against the real
 * schema, not assumed.)
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const knex: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const rows = await knex("order_item as oi")
    .join("order_line_item as oli", "oli.id", "oi.item_id")
    .join("order as o", "o.id", "oi.order_id")
    .whereNull("o.canceled_at")
    .whereNull("oi.deleted_at")
    .whereNull("oli.deleted_at")
    .whereNotNull("oli.product_id")
    .groupBy("oli.product_id")
    .select("oli.product_id")
    .sum("oi.quantity as total_sold")
    .orderBy("total_sold", "desc")

  res.json({
    product_ids: rows.map((r: any) => r.product_id),
  })
}
