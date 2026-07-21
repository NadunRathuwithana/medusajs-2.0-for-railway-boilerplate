"use client"

import * as Sentry from "@sentry/nextjs"
import NextError from "next/error"
import { useEffect } from "react"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        {/* @ts-expect-error next/error's props typing doesn't include statusCode as required in this context */}
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
