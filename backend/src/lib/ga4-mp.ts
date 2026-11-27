/**
 * GA4 Measurement Protocol purchase, so orders the server finished after the
 * customer closed the tab still reach GA4. Off unless GA4_MEASUREMENT_ID and
 * GA4_API_SECRET are set. GA4 dedups purchases by transaction_id, so a browser
 * purchase for the same order is not double counted.
 */
export async function sendGa4Purchase(order: any) {
  const mid = process.env.GA4_MEASUREMENT_ID
  const secret = process.env.GA4_API_SECRET
  if (!mid || !secret || !order?.id) return
  // _ga cookie "GA1.1.<id>.<ts>" -> client_id "<id>.<ts>"
  const ga = String(order.metadata?.ga_client_id || "")
  const client_id = ga.split(".").slice(-2).join(".") || `server.${order.id}`
  const items = (order.items || [])
    .filter((i: any) => i?.metadata?.packing !== true)
    .map((i: any) => ({
      item_id: i.variant_sku || i.variant_id || i.id,
      item_name: i.title,
      price: Number(i.unit_price) || 0,
      quantity: Number(i.quantity) || 1,
    }))
  try {
    const r = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(mid)}&api_secret=${encodeURIComponent(secret)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id,
          events: [{
            name: "purchase",
            params: {
              transaction_id: order.id,
              value: Number(order.total) || 0,
              currency: String(order.currency_code || "lkr").toUpperCase(),
              shipping: Number(order.shipping_total) || 0,
              items,
            },
          }],
        }),
      }
    )
    if (!r.ok) console.error(`[GA4 MP] purchase ${order.id} failed: HTTP ${r.status}`)
  } catch (e: any) {
    console.error(`[GA4 MP] purchase ${order.id} failed: ${e?.message}`)
  }
}
