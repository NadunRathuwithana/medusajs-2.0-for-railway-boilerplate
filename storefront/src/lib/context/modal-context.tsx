"use client"

import React, { createContext, useContext, useMemo } from "react"

interface ModalContext {
  close: () => void
}

const ModalContext = createContext<ModalContext | null>(null)

interface ModalProviderProps {
  children?: React.ReactNode
  close: () => void
}

export const ModalProvider = ({ children, close }: ModalProviderProps) => {
  const value = useMemo(() => ({ close }), [close])

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  )
}

export const useModal = () => {
  const context = useContext(ModalContext)
  if (context === null) {
    throw new Error("useModal must be used within a ModalProvider")
  }
  return context
}
