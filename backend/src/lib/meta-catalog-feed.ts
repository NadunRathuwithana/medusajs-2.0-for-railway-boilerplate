import {
  ContainerRegistrationKeys,
  QueryContext,
  getTotalVariantAvailability,
} from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { getRedisClient } from "./redis"

const CACHE_KEY = "meta-catalog-feed:xml"
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour — Meta polls on its own schedule, no need to regenerate more often than that.
const STORE_URL = "https://cardle.lk"
const BRAND = "Cardle"
// Every product in this catalog is a tote bag — a single fixed category is
// correct here, not a per-product mapping.
const PRODUCT_CATEGORY = "Apparel & Accessories > Handbags & Wallets"

// In-memory fallback for when REDIS_URL isn't set (e.g. local dev) — mirrors
// the pattern already used by koko-payment/service.ts and rate-limit.ts.
let memoryCache: { xml: string; generatedAt: number } | null = null

// Shared by every request that finds a cold/stale cache, so N concurrent
// requests during that window trigger ONE regeneration instead of N —
// same thundering-herd fix already applied to middleware.ts's region-map
// cache. Without this, a burst of hits while the cache is cold (e.g. right
// after a deploy, or several people/tools checking the feed at once) would
// each independently run the full catalog query against the same database
// the storefront's own product/payment-provider lookups depend on.
let inFlightBuild: Promise<string> | null = null

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim()
}

function isVariantInStock(
  variant: { manage_inventory?: boolean | null; allow_backorder?: boolean | null },
  availableQuantity: number | null
): boolean {
  if (!variant.manage_inventory) return true
  if (variant.allow_backorder) return true
  return (availableQuantity ?? 0) > 0
}

type FeedVariant = {
  id: string
  sku: string | null
  manage_inventory: boolean | null
  allow_backorder: boolean | null
  calculated_price: { calculated_amount: number; currency_code: string } | null
  options: { value: string; option: { title: string } }[]
  images: { url: string }[]
}

type FeedProduct = {
  id: string
  title: string
  description: string | null
  handle: string
  thumbnail: string | null
  images: { url: string }[]
  variants: FeedVariant[]
}

type FeedItem = {
  id: string
  title: string
  description: string
  availability: "in stock" | "out of stock"
  condition: "new"
  price: string
  link: string
  image_link: string
  brand: string
  google_product_category: string
  fb_product_category: string
}

async function fetchCatalogProducts(container: MedusaContainer): Promise<{
  products: FeedProduct[]
  region: { id: string; currency_code: string } | null
}> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const regionModuleService: any = container.resolve("region")

  // Pin via env var when set — lets a merchant control exactly which
  // region's pricing feeds Meta. Falls back to the first region (this store
  // only has one: "lk"), which is correct today but won't silently break if
  // a second region is ever added — it'll just warn instead of guessing wrong.
  const regions = await regionModuleService.listRegions({}, { take: 10 })
  let region = regions[0] ?? null
  if (process.env.META_CATALOG_REGION_ID) {
    const pinned = regions.find((r: any) => r.id === process.env.META_CATALOG_REGION_ID)
    if (pinned) {
      region = pinned
    } else {
      console.warn(
        `[meta-catalog-feed] META_CATALOG_REGION_ID "${process.env.META_CATALOG_REGION_ID}" not found — falling back to first region.`
      )
    }
  } else if (regions.length > 1) {
    console.warn(
      `[meta-catalog-feed] Multiple regions exist and META_CATALOG_REGION_ID isn't set — using "${region?.id}". Set META_CATALOG_REGION_ID to pin this explicitly.`
    )
  }

  if (!region) {
    return { products: [], region: null }
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "description",
      "handle",
      "thumbnail",
      "images.url",
      "variants.id",
      "variants.sku",
      "variants.manage_inventory",
      "variants.allow_backorder",
      "variants.options.value",
      "variants.options.option.title",
      "variants.images.url",
      "variants.calculated_price.calculated_amount",
      "variants.calculated_price.currency_code",
    ],
    filters: {
      status: "published",
    },
    context: {
      variants: {
        calculated_price: QueryContext({
          region_id: region.id,
          currency_code: region.currency_code,
        }),
      },
    },
  })

  return { products: products as unknown as FeedProduct[], region }
}

/**
 * Builds the feed fresh — one item per variant (not per product), per Meta's
 * own guidance that variant-level granularity is what Dynamic/Catalog ads
 * are designed around. Products where every variant is out of stock are
 * dropped entirely; a product with at least one in-stock variant keeps ALL
 * its variants, each correctly labeled in/out of stock.
 */
export async function buildMetaCatalogFeedXml(container: MedusaContainer): Promise<string> {
  const { products, region } = await fetchCatalogProducts(container)

  if (!region) {
    throw new Error("No region configured — cannot compute catalog prices.")
  }

  const allVariantIds = products.flatMap((p) => p.variants.map((v) => v.id))
  const availability = allVariantIds.length
    ? await getTotalVariantAvailability(
        container.resolve(ContainerRegistrationKeys.QUERY),
        { variant_ids: allVariantIds }
      )
    : {}

  const items: FeedItem[] = []

  for (const product of products) {
    const inStockVariants = product.variants.filter((v) =>
      isVariantInStock(v, availability[v.id]?.availability ?? null)
    )

    // Requirement: only include products with at least one in-stock variant.
    if (inStockVariants.length === 0) {
      continue
    }

    const cleanDescription = stripHtml(product.description || product.title)
    const productImage = product.thumbnail || product.images?.[0]?.url

    for (const variant of product.variants) {
      if (!variant.calculated_price) {
        continue // no price resolvable for this region — can't list it
      }

      const inStock = isVariantInStock(variant, availability[variant.id]?.availability ?? null)
      const optionLabel = (variant.options || [])
        .map((o) => o.value)
        .filter(Boolean)
        .join(", ")
      const title = optionLabel ? `${product.title} – ${optionLabel}` : product.title

      const imageLink = variant.images?.[0]?.url || productImage
      if (!imageLink) {
        continue // Meta requires image_link — skip rather than emit an invalid item
      }

      // Prefer SKU (merchant-controlled, stable across any future data
      // migration) over the internal id, per the requirement — but Medusa's
      // variant.id is itself a stable ULID that never changes post-creation,
      // so it's a safe fallback when no SKU is set.
      const id = variant.sku || variant.id

      items.push({
        id,
        title,
        description: cleanDescription,
        availability: inStock ? "in stock" : "out of stock",
        condition: "new",
        price: `${variant.calculated_price.calculated_amount.toFixed(2)} ${variant.calculated_price.currency_code.toUpperCase()}`,
        // Uses the real, canonical /lk/products/... URL rather than the bare
        // /products/... path — the bare path 30x-redirects, which is a
        // weaker signal for a crawler than a direct match (same reasoning
        // already applied to this site's Product/Offer JSON-LD).
        link: `${STORE_URL}/lk/products/${product.handle}`,
        image_link: imageLink,
        brand: BRAND,
        google_product_category: PRODUCT_CATEGORY,
        fb_product_category: PRODUCT_CATEGORY,
      })
    }
  }

  return renderFeedXml(items)
}

function renderFeedXml(items: FeedItem[]): string {
  const itemsXml = items
    .map(
      (item) => `    <item>
      <g:id>${escapeXml(item.id)}</g:id>
      <g:title>${escapeXml(item.title)}</g:title>
      <g:description>${escapeXml(item.description)}</g:description>
      <g:availability>${item.availability}</g:availability>
      <g:condition>${item.condition}</g:condition>
      <g:price>${item.price}</g:price>
      <g:link>${escapeXml(item.link)}</g:link>
      <g:image_link>${escapeXml(item.image_link)}</g:image_link>
      <g:brand>${escapeXml(item.brand)}</g:brand>
      <g:google_product_category>${escapeXml(item.google_product_category)}</g:google_product_category>
      <g:fb_product_category>${escapeXml(item.fb_product_category)}</g:fb_product_category>
    </item>`
    )
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Cardle Product Catalog</title>
    <link>${STORE_URL}</link>
    <description>Cardle product feed for Meta Commerce Manager</description>
${itemsXml}
  </channel>
</rss>
`
}

/**
 * Cached entry point the route calls. Regenerates when the cache is stale;
 * if regeneration throws, serves the last successfully cached feed (any
 * age) instead of erroring, so a transient DB/query hiccup during Meta's
 * poll window never results in Meta seeing an empty or broken feed.
 * Throws only if generation fails AND nothing has ever been cached.
 */
export async function getMetaCatalogFeedXml(container: MedusaContainer): Promise<string> {
  const redis = getRedisClient()

  const readCache = async (): Promise<{ xml: string; generatedAt: number } | null> => {
    if (redis) {
      try {
        const raw = await redis.get(CACHE_KEY)
        return raw ? JSON.parse(raw) : null
      } catch (e: any) {
        console.error("[meta-catalog-feed] Redis read failed:", e.message)
        return null
      }
    }
    return memoryCache
  }

  const writeCache = async (entry: { xml: string; generatedAt: number }) => {
    if (redis) {
      try {
        await redis.set(CACHE_KEY, JSON.stringify(entry))
        return
      } catch (e: any) {
        console.error("[meta-catalog-feed] Redis write failed:", e.message)
        // fall through to memory cache so this process still has something
      }
    }
    memoryCache = entry
  }

  const cached = await readCache()
  if (cached && Date.now() - cached.generatedAt < CACHE_TTL_MS) {
    return cached.xml
  }

  try {
    if (!inFlightBuild) {
      inFlightBuild = buildMetaCatalogFeedXml(container).finally(() => {
        inFlightBuild = null
      })
    }
    const xml = await inFlightBuild
    await writeCache({ xml, generatedAt: Date.now() })
    return xml
  } catch (err: any) {
    console.error("[meta-catalog-feed] Feed generation failed:", err.message)
    if (cached) {
      // Stale, but a stale feed beats a broken/empty one mid-sync.
      return cached.xml
    }
    throw err
  }
}
