"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { cache } from "react"
import { getAuthHeaders } from "./cookies"

export const retrieveOrder = cache(async function (id: string) {
  return sdk.store.order
    .retrieve(
      id,
      { fields: "*payment_collections.payments" },
      { next: { tags: ["order"] }, ...await getAuthHeaders() }
    )
    .then(({ order }) => order)
    .catch((err) => medusaError(err))
})

export const listOrders = cache(async function (
  limit: number = 10,
  offset: number = 0
) {
  const headers = await getAuthHeaders()
  
  const customer = await sdk.store.customer
    .retrieve({}, { next: { tags: ["customer"] }, ...headers })
    .then(({ customer }) => customer)
    .catch(() => null)

  if (!customer) {
    return null
  }

  return sdk.store.order
    .list(
      { limit, offset },
      { next: { revalidate: 0, tags: ["order"] } as any, ...headers }
    )
    .then(({ orders }) => orders.filter((order) => order.email === customer.email))
    .catch((err) => medusaError(err))
})
