import { sdk } from "@lib/config"
import { getRegion } from "@lib/data/regions"
import {
  getPricesForVariant,
  isVariantInStock,
} from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export const revalidate = 3600

const BASE_URL = "https://cardle.lk"
// Cardle only sells into Sri Lanka — the feed is priced/stocked off that
// single region, same as robots.ts/sitemap.ts hardcode the LK-only domain.
const FEED_COUNTRY_CODE = "lk"
const PAGE_SIZE = 100

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`
}

async function getAllProducts(regionId: string): Promise<HttpTypes.StoreProduct[]> {
  const products: HttpTypes.StoreProduct[] = []
  let offset = 0

  while (true) {
    const { products: page, count } = await sdk.store.product.list(
      {
        region_id: regionId,
        limit: PAGE_SIZE,
        offset,
        fields: "*variants.calculated_price,+variants.inventory_quantity,*variants.images,*images",
      },
      { next: { revalidate: 3600, tags: ["products"] } } as any
    )

    products.push(...page)
    offset += PAGE_SIZE

    if (page.length === 0 || offset >= count) {
      break
    }
  }

  return products
}

function buildItemXml(product: HttpTypes.StoreProduct, variant: any): string | null {
  const priceInfo = getPricesForVariant(variant)
  if (!priceInfo) {
    return null
  }

  const hasMultipleVariants = (product.variants?.length || 0) > 1
  const itemTitle =
    hasMultipleVariants && variant.title
      ? `${product.title} - ${variant.title}`
      : product.title || ""

  const image =
    variant.thumbnail ||
    variant.images?.[0]?.url ||
    product.thumbnail ||
    product.images?.[0]?.url ||
    ""

  if (!image) {
    // Merchant Center rejects items with no image — skip rather than submit
    // a broken item.
    return null
  }

  const additionalImages = (product.images || [])
    .map((img) => img.url)
    .filter((url): url is string => !!url && url !== image)
    .slice(0, 10)

  const sku = variant.sku || variant.id
  const productUrl = `${BASE_URL}/${FEED_COUNTRY_CODE}/products/${product.handle}`
  const availability = isVariantInStock(variant) ? "in stock" : "out of stock"
  const price = `${priceInfo.calculated_price_number.toFixed(2)} ${priceInfo.currency_code.toUpperCase()}`
  const description =
    product.description || `${itemTitle} – handmade canvas tote bag by Cardle, made to order in Sri Lanka.`

  return `
    <item>
      <g:id>${escapeXml(sku)}</g:id>
      <title>${cdata(itemTitle)}</title>
      <description>${cdata(description)}</description>
      <link>${escapeXml(productUrl)}</link>
      <g:image_link>${escapeXml(image)}</g:image_link>
      ${additionalImages.map((url) => `<g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`).join("\n      ")}
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:brand>Cardle</g:brand>
      <g:condition>new</g:condition>
      <g:mpn>${escapeXml(sku)}</g:mpn>
      ${hasMultipleVariants ? `<g:item_group_id>${escapeXml(product.id!)}</g:item_group_id>` : ""}
    </item>`
}

export async function GET() {
  const region = await getRegion(FEED_COUNTRY_CODE)

  if (!region) {
    return new Response("Region not configured", { status: 500 })
  }

  const products = await getAllProducts(region.id)

  const items = products
    .flatMap((product) => {
      const sellableVariants = (product.variants || []).filter(
        (v: any) => !!v.calculated_price
      )
      return sellableVariants.map((variant) => buildItemXml(product, variant))
    })
    .filter((item): item is string => !!item)
    .join("")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Cardle Product Feed</title>
    <link>${BASE_URL}</link>
    <description>Cardle handmade canvas tote bags — Google Merchant Center product feed</description>${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
