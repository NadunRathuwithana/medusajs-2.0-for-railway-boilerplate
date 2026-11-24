import { sdk } from "@lib/config"
import { cache } from "react"

export const listCategories = cache(async function () {
  return sdk.store.category
    .list({ fields: "+category_children" }, { next: { tags: ["categories"] } })
    .then(({ product_categories }) => product_categories)
})

export const getCategoriesList = cache(async function (
  offset: number = 0,
  limit: number = 100
) {
  return sdk.store.category.list(
    // TODO: Look into fixing the type
    // @ts-ignore
    { limit, offset },
    { next: { tags: ["categories"] } }
  )
})

export const getCategoryByHandle = cache(async function (
  categoryHandle: string[]
) {

  return sdk.store.category.list(
    // TODO: Look into fixing the type
    // @ts-ignore
    { handle: categoryHandle },
    { next: { tags: ["categories"] } }
  )
})

/**
 * Top-level categories for the nav, only those with at least one published
 * product (counting their sub-categories too). Empty ones stay hidden, so a
 * new "Accessories" or "Leather Collection" appears once it has an item.
 */
export const listNavCategories = cache(async function (): Promise<
  { name: string; handle: string }[]
> {
  try {
    const { product_categories } = await sdk.store.category.list(
      // @ts-ignore
      { fields: "id,name,handle,rank,parent_category_id,category_children.id", limit: 100 },
      { next: { tags: ["categories"] } } as any
    )
    const top = (product_categories || [])
      .filter((c: any) => !c.parent_category_id)
      .sort((a: any, b: any) => (a.rank ?? 0) - (b.rank ?? 0))
    const withCounts = await Promise.all(
      top.map(async (c: any) => {
        const ids = [c.id, ...((c.category_children || []).map((k: any) => k.id))]
        const { count } = await sdk.store.product
          .list(
            { category_id: ids, limit: 1, fields: "id" } as any,
            { next: { tags: ["products", "categories"], revalidate: 300 } } as any
          )
          .catch(() => ({ count: 0 }))
        return { name: c.name, handle: c.handle, count }
      })
    )
    return withCounts.filter((c) => c.count > 0).map(({ name, handle }) => ({ name, handle }))
  } catch {
    return []
  }
})
