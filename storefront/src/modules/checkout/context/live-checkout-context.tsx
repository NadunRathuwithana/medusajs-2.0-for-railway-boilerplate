"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"

type LiveCheckoutContextValue = {
  addressesComplete: boolean
  setAddressesComplete: (value: boolean) => void
  /** Saves any not-yet-saved address edits to the cart and waits for it. */
  flushAddresses: () => Promise<void>
  /** Called by the Addresses form so the payment step can flush it. */
  registerFlush: (fn: (() => Promise<void>) | null) => void
}

const LiveCheckoutContext = createContext<LiveCheckoutContextValue | null>(null)

/**
 * Holds whether the Addresses form's *current on-screen values* (not the
 * last-saved cart) are complete — updated synchronously on every keystroke
 * by the Addresses form, and read by the Payment step to gate the submit
 * buttons in real time, with no network round-trip involved.
 */
export function LiveCheckoutProvider({
  initialComplete,
  children,
}: {
  initialComplete: boolean
  children: React.ReactNode
}) {
  const [addressesComplete, setAddressesComplete] = useState(initialComplete)
  const flushRef = useRef<(() => Promise<void>) | null>(null)
  const registerFlush = useCallback((fn: (() => Promise<void>) | null) => {
    flushRef.current = fn
  }, [])
  const flushAddresses = useCallback(async () => {
    if (flushRef.current) await flushRef.current()
  }, [])

  return (
    <LiveCheckoutContext.Provider
      value={{ addressesComplete, setAddressesComplete, flushAddresses, registerFlush }}
    >
      {children}
    </LiveCheckoutContext.Provider>
  )
}

export function useLiveCheckout(): LiveCheckoutContextValue {
  const ctx = useContext(LiveCheckoutContext)
  // No provider mounted (shouldn't happen inside the checkout flow) — fail
  // closed so a missing provider can never accidentally leave a submit
  // button permanently enabled.
  return (
    ctx ?? {
      addressesComplete: false,
      setAddressesComplete: () => {},
      flushAddresses: async () => {},
      registerFlush: () => {},
    }
  )
}
