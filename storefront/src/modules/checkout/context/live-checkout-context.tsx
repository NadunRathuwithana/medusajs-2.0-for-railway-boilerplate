"use client"

import { createContext, useContext, useState } from "react"

type LiveCheckoutContextValue = {
  addressesComplete: boolean
  setAddressesComplete: (value: boolean) => void
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

  return (
    <LiveCheckoutContext.Provider value={{ addressesComplete, setAddressesComplete }}>
      {children}
    </LiveCheckoutContext.Provider>
  )
}

export function useLiveCheckout(): LiveCheckoutContextValue {
  const ctx = useContext(LiveCheckoutContext)
  // No provider mounted (shouldn't happen inside the checkout flow) — fail
  // closed so a missing provider can never accidentally leave a submit
  // button permanently enabled.
  return ctx ?? { addressesComplete: false, setAddressesComplete: () => {} }
}
