"use client"

import { useSyncExternalStore } from "react"
import type { Packing } from "@lib/data/addons"

/**
 * Tiny shared store so the packing checkboxes, the totals and the mobile
 * header all show the user's choice instantly (before the server confirms).
 */
let optimistic: string[] | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const setOptimisticPacking = (ids: string[] | null) => {
  optimistic = ids
  emit()
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const get = () => optimistic
const getServer = () => null

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

export function usePackingSelection(cart: any, packing?: Packing) {
  const opt = useSyncExternalStore(subscribe, get, getServer)
  const saved: string[] = Array.isArray(cart?.metadata?.packing_ids) ? cart.metadata.packing_ids : []
  const current = opt ?? saved
  const price = (ids: string[]) =>
    ids.reduce((s, id) => s + Number(packing?.options.find((o) => o.id === id)?.price || 0), 0)
  const delta = opt ? price(opt) - price(saved) : 0
  return { saved, current, delta, synced: !opt || same(opt, saved) }
}

/** Cart totals with the not-yet-synced packing difference applied. */
export function withPackingDelta(cart: any, delta: number) {
  if (!delta) return cart
  const add = (v: any) => (typeof v === "number" ? v + delta : v)
  return { ...cart, total: add(cart.total), subtotal: add(cart.subtotal), item_subtotal: add(cart.item_subtotal) }
}
