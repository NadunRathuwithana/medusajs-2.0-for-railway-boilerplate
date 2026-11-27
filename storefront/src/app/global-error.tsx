"use client"

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#faf6f0", color: "#3b2a1e", margin: 0 }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Something went wrong</h1>
          <p style={{ margin: 0, maxWidth: 380 }}>Please try again. If you were paying by card, check your email before paying again.</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => reset()} style={{ padding: "12px 20px", borderRadius: 8, border: 0, background: "#3b2a1e", color: "#fff", fontSize: 16 }}>Try again</button>
            <a href="/" style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid #3b2a1e", color: "#3b2a1e", textDecoration: "none", fontSize: 16 }}>Home</a>
          </div>
        </div>
      </body>
    </html>
  )
}
