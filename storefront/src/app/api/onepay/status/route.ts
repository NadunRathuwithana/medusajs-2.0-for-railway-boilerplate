import { NextRequest, NextResponse } from "next/server"
import { sdk } from "@lib/config"
import { getAuthHeaders, getCartId } from "@lib/data/cookies"

export const dynamic = "force-dynamic"

/**
 * Cheap "is this Onepay link paid yet?" check, polled by checkout while the
 * popup is open so we react the moment Onepay has the money (instead of
 * waiting for Onepay's own success screen to time out). A route handler, not
 * a server action: actions run one at a time and re-render the page.
 */
export async function GET(req: NextRequest) {
  const txn = req.nextUrl.searchParams.get("txn")
  const cartId = await getCartId()
  if (!txn || !cartId) return NextResponse.json({ ok: false, pending: true })
  try {
    const r = await sdk.client.fetch<any>("/store/onepay/js-confirm", {
      method: "POST",
      body: { cart_id: cartId, transaction_id: txn },
      headers: await getAuthHeaders(),
    })
    return NextResponse.json({ ok: !!r?.ok, failed: !!r?.failed, pending: !r?.ok && !r?.failed })
  } catch {
    return NextResponse.json({ ok: false, pending: true })
  }
}
