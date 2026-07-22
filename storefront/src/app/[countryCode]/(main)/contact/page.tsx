"use client"

import { Metadata } from "next"
import { useState, FormEvent } from "react"
import { Select } from "@medusajs/ui"
import { MessageSquare, CheckCircle2, AlertCircle } from "lucide-react"

// Note: metadata export won't work in client components — move it to a wrapper if needed
// For now, the metadata is defined separately below as a named export from a separate file

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMsg("")

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

      const res = await fetch(`${backendUrl}/store/contact`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        }),
      })

      let data: any = {}
      try {
        const text = await res.text()
        data = text ? JSON.parse(text) : {}
      } catch (err) {
        console.error("Failed to parse response:", err)
      }

      if (!res.ok) {
        let errMessage = "Something went wrong. Please try again."
        if (data.message) errMessage = data.message
        if (data.error) errMessage = data.error
        if (data.errors) {
          errMessage = Array.isArray(data.errors) 
            ? data.errors.map((e: any) => e.message || e).join(", ") 
            : typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors)
        }
        setErrorMsg(errMessage)
        setStatus("error")
        return
      }

      setStatus("success")
      setForm({ name: "", email: "", subject: "", message: "" })
    } catch (err) {
      console.error("Contact form error:", err)
      setErrorMsg("Network error. Please check your connection and try again.")
      setStatus("error")
    }
  }

  const subjects = [
    "Order Inquiry",
    "Shipping & Delivery",
    "Returns & Refunds",
    "Product Question",
    "Technical Support",
    "Other",
  ]

  return (
    <div className="py-24 max-w-5xl mx-auto px-6">
      {/* Page Header */}
      <div className="text-center mb-20">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#fef3f2",
            color: "#e94560",
            borderRadius: "999px",
            padding: "6px 16px",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          <MessageSquare className="w-4 h-4" /> Get In Touch
        </div>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            letterSpacing: "-1px",
            color: "#1a1a2e",
            marginBottom: "16px",
            lineHeight: 1.15,
          }}
        >
          We'd Love to Hear From You
        </h1>
        <p style={{ color: "#6b7280", maxWidth: "540px", margin: "0 auto", lineHeight: 1.7 }}>
          Whether you have a question about your order, need help, or just want to
          share feedback — we&apos;re here and ready to help.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Success State */}
        {status === "success" ? (
          <div
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "20px",
              padding: "48px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
          >
            <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
            <h2
              style={{ fontSize: "24px", fontWeight: 700, color: "#15803d", marginBottom: "12px" }}
            >
              Message Sent!
            </h2>
            <p style={{ color: "#166534", marginBottom: "24px" }}>
              Thank you for reaching out. We&apos;ll get back to you as soon as possible.
            </p>
            <button
              onClick={() => setStatus("idle")}
              style={{
                backgroundColor: "#16a34a",
                color: "#fff",
                border: "none",
                padding: "12px 28px",
                borderRadius: "10px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Send Another Message
            </button>
          </div>
        ) : (
          /* Contact Form */
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "24px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              padding: "40px",
            }}
          >
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a2e", marginBottom: "8px" }}>
              Send Us a Message
            </h2>
            <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "32px" }}>
              Fill out the form below and we&apos;ll respond within 24 hours.
            </p>

            {/* Error Banner */}
            {status === "error" && (
              <div
                style={{
                  backgroundColor: "#fff7f7",
                  border: "1px solid #fca5a5",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "24px",
                  color: "#dc2626",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  htmlFor="contact-name"
                  style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#6b7280", textTransform: "uppercase" }}
                >
                  Full Name *
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  style={{
                    width: "100%",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  htmlFor="contact-email"
                  style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#6b7280", textTransform: "uppercase" }}
                >
                  Email Address *
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  style={{
                    width: "100%",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Subject */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  htmlFor="contact-subject"
                  style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#6b7280", textTransform: "uppercase" }}
                >
                  Subject
                </label>
                <Select
                  value={form.subject}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, subject: val }))}
                >
                  <Select.Trigger 
                    id="contact-subject"
                    style={{
                      width: "100%",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                      height: "auto",
                      boxShadow: "none"
                    }}
                  >
                    <Select.Value placeholder="Select a subject..." />
                  </Select.Trigger>
                  <Select.Content style={{ zIndex: 100 }}>
                    {subjects.map((s) => (
                      <Select.Item key={s} value={s}>
                        {s}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>

              {/* Message */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  htmlFor="contact-message"
                  style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#6b7280", textTransform: "uppercase" }}
                >
                  Message *
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help you..."
                  style={{
                    width: "100%",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                id="contact-submit-btn"
                type="submit"
                disabled={status === "loading"}
                style={{
                  width: "100%",
                  backgroundColor: status === "loading" ? "#9ca3af" : "#1a1a2e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "15px",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  cursor: status === "loading" ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  marginTop: "4px",
                }}
              >
                {status === "loading" ? "Sending..." : "Send Message →"}
              </button>
            </form>
          </div>
        )}

        {/* WhatsApp Option */}
        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            backgroundColor: "#f0fdf4",
            padding: "32px",
            borderRadius: "20px",
            border: "1px solid #d1fae5",
          }}
        >
          <p style={{ color: "#166534", marginBottom: "16px", fontWeight: 500 }}>
            Prefer a quicker response? Reach us on WhatsApp!
          </p>
          <a
            href="https://wa.me/94779497859"
            target="_blank"
            rel="noopener noreferrer"
            id="whatsapp-contact-link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#25D366",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "14px",
              textDecoration: "none",
              transition: "background 0.2s",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: "18px", height: "18px", fill: "currentColor" }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
