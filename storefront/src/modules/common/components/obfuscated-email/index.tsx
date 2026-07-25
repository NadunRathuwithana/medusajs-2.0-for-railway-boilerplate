"use client"

import { useEffect, useState } from "react"

type ObfuscatedEmailProps = {
  user: string
  domain: string
  className?: string
}

// Assembles the address client-side after mount so the joined "user@domain"
// string never appears in the server-rendered HTML — keeps it off simple
// regex-based email harvesters while staying a real, clickable mailto link
// for actual visitors.
export default function ObfuscatedEmail({
  user,
  domain,
  className,
}: ObfuscatedEmailProps) {
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    setAddress(`${user}@${domain}`)
  }, [user, domain])

  if (!address) {
    return (
      <span className={className}>
        {user} [at] {domain.replace(".", " [dot] ")}
      </span>
    )
  }

  return (
    <a href={`mailto:${address}`} className={className}>
      {address}
    </a>
  )
}
