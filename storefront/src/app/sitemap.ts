import { MetadataRoute } from "next"
import { sdk } from "@lib/config"

const BASE_URL = "https://cardle.lk"
// Cardle only ever serves the "lk" region — "/" itself just 307-redirects to
// /lk and is never a URL Google should index or crawl-consolidate onto, so
// every sitemap entry points straight at the region-prefixed URL that
// actually returns 200.
const REGION_URL = `${BASE_URL}/lk`

async function getAllProducts(): Promise<{ handle: string; updated_at?: string | null }[]> {
  try {
    const { products } = await sdk.store.product.list(
      { limit: 500, fields: "handle,updated_at" },
      { next: { revalidate: 3600, tags: ["products"] } } as any
    )
    return products || []
  } catch {
    return []
  }
}

async function getAllCollections(): Promise<{ handle: string; updated_at?: string | null }[]> {
  try {
    const { collections } = await sdk.store.collection.list(
      { limit: 100 },
      { next: { revalidate: 3600, tags: ["collections"] } } as any
    )
    return collections || []
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([
    getAllProducts(),
    getAllCollections(),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: REGION_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${REGION_URL}/store`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${REGION_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${REGION_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${REGION_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${REGION_URL}/shipping`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${REGION_URL}/returns`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ]

  const collectionPages: MetadataRoute.Sitemap = collections
    .filter((c) => !!c.handle)
    .map((collection) => ({
      url: `${REGION_URL}/collections/${collection.handle}`,
      lastModified: collection.updated_at ? new Date(collection.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))

  const productPages: MetadataRoute.Sitemap = products
    .filter((p) => !!p.handle)
    .map((product) => ({
      url: `${REGION_URL}/products/${product.handle}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))

  return [...staticPages, ...collectionPages, ...productPages]
}
