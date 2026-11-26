import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { sdk } from "@lib/config"
import { getAuthHeaders, getCartId, removeCartId } from "@lib/data/cookies"

export const dynamic = "force-dynamic"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Finish a paid Onepay checkout in one request: verify with Onepay (backend
 * js-confirm), then complete the cart. No re-pricing or extra cart writes
 * after payment (those could block a paid order). If the server already made
 * the order (customer was quick to close, or the watcher won), return it.
 */
export async function POST(req: NextRequest) {
  const { txn } = (await req.json().catch(() => ({}))) as { txn?: string }
  const cartId = await getCartId()
  if (!txn || !cartId) return NextResponse.json({ pending: true })
  const headers = await getAuthHeaders()

  const existingOrder = async () => {
    try {
      const r: any = await sdk.store.order.list({ cart_id: cartId } as any, headers)
      return r?.orders?.[0] ?? null
    } catch {
      return null
    }
  }
  const done = async (order: any) => {
    await removeCartId()
    revalidateTag("cart")
    return NextResponse.json({
      order_id: order.id,
      country: order.shipping_address?.country_code?.toLowerCase() || "lk",
    })
  }

  for (let i = 0; i < 6; i++) {
    const already = await existingOrder()
    if (already) return done(already)

    let confirm: any = null
    try {
      confirm = await sdk.client.fetch<any>("/store/onepay/js-confirm", {
        method: "POST",
        body: { cart_id: cartId, transaction_id: txn },
        headers,
      })
    } catch {}
    if (confirm?.failed) return NextResponse.json({ failed: true })

    if (confirm?.ok) {
      try {
        const res: any = await sdk.store.cart.complete(cartId, {}, headers)
        if (res?.type === "order") return done(res.order)
      } catch {}
      const after = await existingOrder() // the server watcher may have won the race
      if (after) return done(after)
    }
    await sleep(1500)
  }
  return NextResponse.json({ pending: true })
}
