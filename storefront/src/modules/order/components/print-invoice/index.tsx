import { HttpTypes } from "@medusajs/types"
import { isManual, paymentInfoMap } from "@lib/constants"

/**
 * Customer-facing invoice, using the same template as Cardle Ops
 * (ops.cardle.lk Orders > Print > Invoice): same header, palette, sections,
 * totals block and QR footer, so the website and the office print the same
 * document. Hidden on screen; when the customer prints, only this sheet prints
 * (see the print CSS below).
 */

const INK = "#2c301f"
const LINE = "#e8dccf"
const MUTED = "rgba(44,48,31,0.68)"
const FAINT = "rgba(44,48,31,0.48)"

const fmt = (n: number) =>
  `LKR ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

const fmtDateTime = (d: Date) =>
  `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`

function paymentLabel(providerId?: string): string {
  if (!providerId) return "—"
  if (isManual(providerId)) return "Cash on Delivery"
  const t = paymentInfoMap[providerId]?.title
  if (/onepay/i.test(providerId)) return "Card Payment"
  return t || providerId.replace(/^pp_/, "").replace(/_/g, " ")
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        background: "#e8cebf",
        color: INK,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.5px",
        padding: "5px 12px",
        borderRadius: 20,
      }}
    >
      {children}
    </span>
  )
}

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", maxWidth: 280, fontSize: 13, marginBottom: 6 }}>
      <span style={{ color: MUTED }}>{label}</span>
      <span style={{ fontWeight: strong === false ? 400 : 700 }}>{value}</span>
    </div>
  )
}

export default function PrintInvoice({ order }: { order: HttpTypes.StoreOrder }) {
  const o: any = order
  const created = new Date(o.created_at)
  const payment = o.payment_collections?.[0]?.payments?.[0]
  const providerId: string | undefined = payment?.provider_id
  const cod = isManual(providerId)
  const method = paymentLabel(providerId)

  const ship = o.shipping_address || {}
  const name = [ship.first_name, ship.last_name].filter(Boolean).join(" ") || o.email
  const phone = ship.phone || o.billing_address?.phone || o.metadata?.contact_phone
  const phone2 = o.metadata?.contact_phone_2
  const address = [ship.address_1, ship.address_2, [ship.city, ship.postal_code].filter(Boolean).join(" ")]
    .filter((x: string) => x && String(x).trim())
    .join("\n")

  const items: any[] = o.items || []
  const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0)
  const originalSubtotal = items.reduce(
    (s, i) =>
      s + Number(i.quantity) * Number(i.compare_at_unit_price != null && i.compare_at_unit_price > i.unit_price ? i.compare_at_unit_price : i.unit_price),
    0
  )
  const saleSavings = Math.max(0, originalSubtotal - subtotal)
  const discount = Number(o.discount_total || 0)
  const shipping = Number(o.shipping_total || 0)
  const total = Number(o.total || 0)
  // Card / BNPL orders are paid at checkout; cash on delivery is paid later.
  const amountPaid = cod ? 0 : total
  const promoCodes: string[] = (o.promotions || []).map((p: any) => p?.code).filter(Boolean)

  const label: React.CSSProperties = {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: "1.5px",
    color: FAINT,
    marginBottom: 8,
  }
  const th: React.CSSProperties = {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: "1.2px",
    color: INK,
    padding: "12px 8px",
  }

  return (
    <div id="cardle-invoice" className="hidden print:block" aria-hidden>
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body * { visibility: hidden !important; }
          #cardle-invoice, #cardle-invoice * { visibility: visible !important; }
          #cardle-invoice { position: absolute; left: 0; top: 0; width: 100%; }
          html, body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "273mm",
          boxSizing: "border-box",
          background: "#fff",
          padding: 12,
          fontFamily: "'Inter',system-ui,sans-serif",
          color: INK,
        }}
      >
        <div>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 20, borderBottom: `2px solid ${LINE}` }}>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/invoice/logo.png" alt="Cardle" style={{ height: 28, width: "auto", display: "block" }} />
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "2.5px", color: INK, marginTop: 10, textTransform: "uppercase" }}>
                Invoice
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <Pill>Website</Pill>
                <Pill>{method}</Pill>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>#{o.display_id}</div>
              <div style={{ fontSize: 12.5, color: "rgba(44,48,31,0.55)", marginTop: 4 }}>{fmtDate(created)}</div>
            </div>
          </div>

          {/* Bill To / Order Details */}
          <div style={{ display: "flex", gap: 48, padding: "26px 0", borderBottom: `1px solid ${LINE}` }}>
            <div style={{ flex: 1 }}>
              <div style={label}>BILL TO</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{name}</div>
              {phone && <div style={{ fontSize: 13, color: MUTED, marginTop: 3 }}>{phone}{phone2 ? ` / ${phone2}` : ""}</div>}
              {o.email && <div style={{ fontSize: 13, color: MUTED, marginTop: 3 }}>{o.email}</div>}
              {address && (
                <div style={{ fontSize: 13, color: MUTED, marginTop: 3, maxWidth: 260, lineHeight: 1.5, whiteSpace: "pre-line" }}>
                  {address}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={label}>ORDER DETAILS</div>
              <Row label="Channel" value="Website" />
              <Row label="Payment Method" value={method} />
              <Row label="Payment" value={cod ? "Pay on delivery" : "Paid"} />
              {promoCodes.length > 0 && <Row label="Offers" value={promoCodes.join(", ")} />}
            </div>
          </div>

          {/* Line items */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
            <thead>
              <tr style={{ background: "#f6efe7" }}>
                <th style={{ ...th, textAlign: "left" }}>ITEM</th>
                <th style={{ ...th, textAlign: "center" }}>QTY</th>
                <th style={{ ...th, textAlign: "right" }}>UNIT PRICE</th>
                <th style={{ ...th, textAlign: "right" }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const unit = Number(item.unit_price)
                const original =
                  item.compare_at_unit_price != null && Number(item.compare_at_unit_price) > unit
                    ? Number(item.compare_at_unit_price)
                    : null
                const variant =
                  item.variant_title && !/default/i.test(item.variant_title) ? item.variant_title : null
                return (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${LINE}`, breakInside: "avoid" }}>
                    <td style={{ padding: "16px 8px" }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{item.product_title || item.title}</div>
                      {variant && <div style={{ fontSize: 12.5, color: INK, marginTop: 2 }}>{variant}</div>}
                    </td>
                    <td style={{ textAlign: "center", fontSize: 14, padding: "16px 8px" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right", fontSize: 14, color: MUTED, padding: "16px 8px" }}>
                      {original != null && (
                        <div style={{ fontSize: 12, textDecoration: "line-through", color: "rgba(44,48,31,0.45)" }}>{fmt(original)}</div>
                      )}
                      <div>{fmt(unit)}</div>
                    </td>
                    <td style={{ textAlign: "right", fontSize: 14, fontWeight: 700, padding: "16px 8px" }}>
                      {fmt(Number(item.quantity) * unit)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <div style={{ width: 280 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: MUTED, padding: "6px 0" }}>
                <span>{saleSavings > 0 ? "Original price" : "Subtotal"}</span>
                <span>{fmt(saleSavings > 0 ? originalSubtotal : subtotal)}</span>
              </div>
              {saleSavings > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: MUTED, padding: "6px 0" }}>
                  <span>Sale discount</span>
                  <span>−{fmt(saleSavings)}</span>
                </div>
              )}
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: MUTED, padding: "6px 0" }}>
                  <span>{saleSavings > 0 ? "Coupon discount" : "Discount"}</span>
                  <span>−{fmt(discount)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: MUTED, padding: "6px 0", borderBottom: `1px solid ${LINE}` }}>
                <span>Shipping</span>
                <span>{shipping > 0 ? `+ ${fmt(shipping)}` : fmt(0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 800, padding: "12px 0 6px" }}>
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
              {amountPaid > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(44,48,31,0.55)", padding: "4px 0" }}>
                    <span>Amount Paid</span>
                    <span style={{ color: INK, fontWeight: 600 }}>{fmt(amountPaid)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0 0" }}>
                    <span style={{ fontWeight: 700, color: INK }}>Balance Due</span>
                    <span style={{ fontWeight: 800, color: INK }}>{fmt(Math.max(0, total - amountPaid))}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer, pinned to the bottom of the A4 page */}
        <div style={{ marginTop: "auto" }}>
          <div style={{ marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, padding: "16px 0", borderTop: `1px solid ${LINE}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/invoice/qr-code.png"
                alt="Scan to visit cardle.lk"
                style={{ width: 62, height: 62, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 10, padding: 5 }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>Scan to visit cardle.lk</div>
                <div style={{ fontSize: 11.5, color: "rgba(44,48,31,0.55)", marginTop: 2 }}>Shop our full collection online</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: `1px solid ${LINE}`, fontSize: 12, color: FAINT }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: INK }}>
                <span>Cardle</span>
                <span>— Thank you for shopping with us</span>
              </div>
              <span>Generated {fmtDateTime(new Date())}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
