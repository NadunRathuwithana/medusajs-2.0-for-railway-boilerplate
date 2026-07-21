import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { STOREFRONT_URL, REVALIDATE_SECRET } from "../lib/constants"

// Maps a Medusa event name to the Next.js fetch-cache tag(s) it should bust
// on the storefront (see storefront/src/lib/data/*.ts for where each tag is
// actually applied to fetch calls).
const EVENT_TAG_MAP: Record<string, string[]> = {
  "product.created": ["products"],
  "product.updated": ["products"],
  "product.deleted": ["products"],
  "product-variant.updated": ["products"],
  "product-collection.created": ["collections"],
  "product-collection.updated": ["collections", "products"],
  "product-collection.deleted": ["collections"],
  "product-category.created": ["categories"],
  "product-category.updated": ["categories", "products"],
  "product-category.deleted": ["categories"],
}

export default async function storefrontRevalidateHandler({
  event,
}: SubscriberArgs<Record<string, unknown>>) {
  if (!STOREFRONT_URL || !REVALIDATE_SECRET) {
    console.warn(
      "[storefront-revalidate] STOREFRONT_URL or REVALIDATE_SECRET not set — skipping. " +
        "Storefront product/collection/category pages will only refresh via their existing fetch-cache lifetime."
    )
    return
  }

  const tags = EVENT_TAG_MAP[event.name]
  if (!tags) return

  try {
    const res = await fetch(`${STOREFRONT_URL}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": REVALIDATE_SECRET,
      },
      body: JSON.stringify({ tags }),
    })

    if (!res.ok) {
      console.error(
        `[storefront-revalidate] Storefront returned ${res.status} for event ${event.name}: ${await res.text()}`
      )
    }
  } catch (err: any) {
    console.error(`[storefront-revalidate] Failed to reach storefront for event ${event.name}:`, err.message)
  }
}

export const config: SubscriberConfig = {
  event: Object.keys(EVENT_TAG_MAP),
}
