import { MetadataRoute } from "next"
import { sdk } from "@lib/config"
import { listCategories } from "@lib/data/categories"

const BASE_URL = "https://cardle.lk"

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

async function getAllCategories(): Promise<{ handle: string }[]> {
  try {
    const categories = await listCategories()
    return categories || []
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections, categories] = await Promise.all([
    getAllProducts(),
    getAllCollections(),
    getAllCategories(),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/store`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/shipping`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/returns`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/refunds`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ]

  const categoryPages: MetadataRoute.Sitemap = categories
    .filter((c) => !!c.handle)
    .map((category) => ({
      url: `${BASE_URL}/categories/${category.handle}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))

  const collectionPages: MetadataRoute.Sitemap = collections
    .filter((c) => !!c.handle)
    .map((collection) => ({
      url: `${BASE_URL}/collections/${collection.handle}`,
      lastModified: collection.updated_at ? new Date(collection.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))

  const productPages: MetadataRoute.Sitemap = products
    .filter((p) => !!p.handle)
    .map((product) => ({
      url: `${BASE_URL}/products/${product.handle}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))

  return [...staticPages, ...collectionPages, ...categoryPages, ...productPages]
}
