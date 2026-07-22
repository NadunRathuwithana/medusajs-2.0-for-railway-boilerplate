import { Text, Section, Hr, Button, Img, Row, Column } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight, bgDark, textLight, fontFamily } from './base'
import { OrderDTO, OrderAddressDTO } from '@medusajs/framework/types'

export const ORDER_PLACED = 'order-placed'

interface OrderPlacedPreviewProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress: OrderAddressDTO
}

export interface OrderPlacedTemplateProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress: OrderAddressDTO
  preview?: string
  shopUrl?: string
}

export const isOrderPlacedTemplateData = (data: any): data is OrderPlacedTemplateProps =>
  typeof data.order === 'object' && typeof data.shippingAddress === 'object'

const formatCurrency = (amount: number, currency: string) => {
  return `${currency?.toUpperCase() ?? ''} ${Number(amount).toFixed(2)}`
}

/** Resolve item subtotal: tries every field MedusaJS v2 may use, then falls back to summing items */
const getItemSubtotal = (order: any): number => {
  return (
    order.item_subtotal ??
    order.subtotal ??
    order.summary?.raw_current_item_subtotal?.value ??
    order.summary?.raw_current_item_total?.value ??
    order.items?.reduce((sum: number, item: any) => sum + (item.unit_price ?? 0) * (item.quantity ?? 1), 0) ??
    0
  )
}

/** Resolve shipping total: tries named fields, then sums shipping_methods */
const getShippingTotal = (order: any): number => {
  return (
    order.shipping_total ??
    order.shipping_subtotal ??
    order.summary?.raw_current_shipping_total?.value ??
    order.shipping_methods?.reduce((sum: number, m: any) => sum + (m.total ?? m.amount ?? 0), 0) ??
    0
  )
}

/** Resolve discount total: checks all known MedusaJS v2 fields, item adjustments, and math fallback */
const getDiscountTotal = (order: any): number => {
  // 1. Try top-level named fields (may be 0 even when discount exists in v2)
  const topLevel =
    order.discount_total ??
    order.discount_subtotal ??
    order.promotion_total ??
    order.summary?.raw_current_discount_total?.value ??
    order.summary?.raw_discount_total?.value

  if (topLevel != null && topLevel > 0) return topLevel

  // 2. Sum item-level adjustments (promotions/discounts applied per line item)
  const itemAdjustmentTotal = order.items?.reduce((sum: number, item: any) => {
    const adj = item.adjustments?.reduce((s: number, a: any) => s + (a.amount ?? 0), 0) ?? 0
    return sum + adj
  }, 0) ?? 0

  if (itemAdjustmentTotal > 0) return itemAdjustmentTotal

  // 3. Math fallback: subtotal - item_total (difference = discount applied)
  const subtotal = order.item_subtotal ?? order.subtotal ?? 0
  const itemTotal = order.item_total ?? 0
  if (subtotal > 0 && itemTotal > 0 && subtotal > itemTotal) {
    return subtotal - itemTotal
  }

  return 0
}

const getPaymentMethodName = (providerId: string) => {
  if (!providerId) return 'Online Payment'
  if (providerId.includes('system_default')) return 'Cash on Delivery'
  if (providerId.includes('onepay')) return 'Visa / Mastercard'
  if (providerId.includes('koko')) return 'Koko Pay'
  return providerId.replace(/_/g, ' ').toUpperCase()
}

export const OrderPlacedTemplate: React.FC<OrderPlacedTemplateProps> & {
  PreviewProps: OrderPlacedPreviewProps
} = ({ order, shippingAddress, preview = 'Your order has been confirmed', shopUrl = process.env.STORE_URL || 'https://cardle.lk' }) => {
  return (
    <Base preview={preview}>
      {/* Hero Image */}
      <Section style={{ position: 'relative', textAlign: 'center', backgroundColor: '#e5e5e5' }}>
        <Img 
          src={`${shopUrl}/email/hero2.jpg`} 
          width="600" 
          height="400" 
          style={{ objectFit: 'cover', display: 'block' }}
          alt="Order Confirmed" 
        />
        <Section style={{ padding: '30px 20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <Text style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 5px', color: textPrimary, textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            ORDER CONFIRMED
          </Text>
          <Text style={{ fontSize: '13px', fontWeight: '500', margin: '0', color: textSecondary, letterSpacing: '1px', fontFamily }}>
            THANK YOU FOR CHOOSING <span style={{ fontWeight: '800', color: textPrimary, fontFamily }}>CARDLE</span>
          </Text>
        </Section>
      </Section>

      <Section style={{ padding: '20px 40px 40px', backgroundColor: '#ffffff' }}>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0 0 24px', lineHeight: '1.6', fontFamily }}>
          Dear {shippingAddress.first_name}, thank you for your purchase. We are carefully preparing your handcrafted tote bags and will notify you as soon as they are dispatched.
        </Text>

        {/* Order Info Card */}
        <Section style={{ 
          border: `1px solid ${borderLight}`, 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '24px',
          backgroundColor: '#fafafa'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily }}>
            <tbody>
              <tr>
                <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Number</td>
                <td style={{ padding: '6px 0', fontWeight: '700', fontSize: '13px', textAlign: 'right', color: textPrimary }}>#{order.display_id}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Date</td>
                <td style={{ padding: '6px 0', fontWeight: '600', fontSize: '13px', textAlign: 'right', color: textPrimary }}>
                  {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Payment Method</td>
                <td style={{ padding: '6px 0', fontWeight: '600', fontSize: '13px', textAlign: 'right', color: textPrimary }}>
                  {getPaymentMethodName((order as any).payment_collections?.[0]?.payments?.[0]?.provider_id)}
                </td>
              </tr>
            </tbody>
          </table>
          <Hr style={{ borderColor: borderLight, margin: '16px 0' }} />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', color: textSecondary, fontSize: '12px' }}>Item Subtotal</td>
                <td style={{ padding: '4px 0', fontWeight: '500', fontSize: '13px', textAlign: 'right', color: textPrimary }}>
                  {formatCurrency(getItemSubtotal(order), order.currency_code)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: textSecondary, fontSize: '12px' }}>Shipping</td>
                <td style={{ padding: '4px 0', fontWeight: '500', fontSize: '13px', textAlign: 'right', color: textPrimary }}>
                  {formatCurrency(getShippingTotal(order), order.currency_code)}
                </td>
              </tr>
              {(() => {
                const discountVal = getDiscountTotal(order)
                return discountVal > 0 ? (
                  <tr>
                    <td style={{ padding: '4px 0', color: '#16a34a', fontSize: '12px' }}>Discount</td>
                    <td style={{ padding: '4px 0', fontWeight: '500', fontSize: '13px', textAlign: 'right', color: '#16a34a' }}>
                      - {formatCurrency(discountVal, order.currency_code)}
                    </td>
                  </tr>
                ) : null
              })()}
              <tr>
                <td style={{ padding: '8px 0 0', color: textPrimary, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Amount</td>
                <td style={{ padding: '8px 0 0', fontWeight: '800', fontSize: '15px', textAlign: 'right', color: '#d9534f' }}>
                  {formatCurrency((order as any).total ?? (order as any).summary?.raw_current_order_total?.value ?? 0, order.currency_code)}
                </td>
              </tr>

            </tbody>
          </table>
        </Section>

        {/* Items Section */}
        <Section style={{ 
          border: `1px solid ${borderLight}`, 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '24px',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily, marginBottom: '16px' }}>
            <tbody>
              <tr>
                <td>
                  <Text style={{ fontSize: '20px', fontWeight: '700', color: textPrimary, margin: '0' }}>
                    Order summary
                  </Text>
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'bottom' }}>
                  <Text style={{ fontSize: '14px', color: textSecondary, margin: '0' }}>
                    {order.items?.length || 0} {(order.items?.length || 0) === 1 ? 'item' : 'items'}
                  </Text>
                </td>
              </tr>
            </tbody>
          </table>

          {order.items?.map((item, index) => (
            <Section key={item.id ?? index} style={{ padding: '12px 0', borderTop: index === 0 ? 'none' : `1px solid ${borderLight}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily }}>
                <tbody>
                  <tr>
                    {(item as any).thumbnail && (
                      <td style={{ width: '76px', verticalAlign: 'middle' }}>
                        <div style={{ position: 'relative', display: 'inline-block', width: '64px', height: '64px' }}>
                          <Img 
                            src={(item as any).thumbnail} 
                            width="64" 
                            height="64" 
                            style={{ 
                              borderRadius: '8px', 
                              objectFit: 'cover',
                              border: `1px solid ${borderLight}`,
                              backgroundColor: '#f5f5f5',
                              display: 'block'
                            }} 
                            alt={item.product_title ?? item.title} 
                          />
                          <span style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            backgroundColor: '#2d333a',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: '600',
                            width: '20px',
                            height: '20px',
                            display: 'inline-block',
                            borderRadius: '50%',
                            textAlign: 'center',
                            lineHeight: '20px',
                            zIndex: 10
                          }}>
                            {item.quantity}
                          </span>
                        </div>
                      </td>
                    )}
                    <td style={{ width: '100%', verticalAlign: 'middle', paddingLeft: (item as any).thumbnail ? '16px' : '0', paddingRight: '16px' }}>
                      <Text style={{ margin: '0 0 6px', fontWeight: '500', fontSize: '15px', color: textPrimary, fontFamily }}>
                        {item.product_title ?? item.title}
                      </Text>
                      <Text style={{ margin: '0', fontSize: '13px', color: textSecondary, fontFamily }}>
                        {item.title}
                      </Text>
                    </td>
                    <td style={{ textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <Text style={{ margin: '0', fontWeight: '400', fontSize: '14px', color: textPrimary, fontFamily }}>
                        {formatCurrency((item.unit_price ?? 0) * item.quantity, order.currency_code)}
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>
          ))}
        </Section>

        {/* Shipping Address Card */}
        <Section style={{ 
          border: `1px solid ${borderLight}`, 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '32px',
        }}>
          <Text style={{ fontSize: '12px', fontWeight: '800', color: textPrimary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            Shipping Details
          </Text>
          <Text style={{ margin: '0', fontSize: '13px', color: textSecondary, lineHeight: '1.6', fontFamily }}>
            <span style={{ fontWeight: '600', color: textPrimary }}>{shippingAddress.first_name} {shippingAddress.last_name}</span><br />
            {shippingAddress.address_1}{shippingAddress.address_2 ? `, ${shippingAddress.address_2}` : ''}<br />
            {shippingAddress.city}{shippingAddress.province ? `, ${shippingAddress.province}` : ''} {shippingAddress.postal_code}<br />
            {shippingAddress.country_code?.toUpperCase()}
          </Text>
        </Section>

        {/* CTA */}
        <Section style={{ textAlign: 'center' }}>
          <Button
            href={`${shopUrl}/account/orders`}
            style={{
              backgroundColor: bgDark,
              color: textLight,
              padding: '14px 40px',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              textDecoration: 'none',
              display: 'inline-block',
              borderRadius: '30px',
              fontFamily
            }}
          >
            VIEW ORDER STATUS
          </Button>
          <Text style={{ color: textSecondary, fontSize: '11px', margin: '20px 0 0', letterSpacing: '1px', textTransform: 'uppercase', fontFamily }}>
            YOU WILL RECEIVE ANOTHER EMAIL WHEN YOUR ORDER SHIPS.
          </Text>
        </Section>
      </Section>
    </Base>
  )
}

OrderPlacedTemplate.PreviewProps = {
  order: {
    id: 'test-order-id',
    display_id: 'ORD-001',
    created_at: new Date().toISOString(),
    email: 'customer@example.com',
    currency_code: 'LKR',
    payment_collections: [{ payments: [{ provider_id: 'pp_onepay_onepay' }] }],
    discount_total: 500,
    item_subtotal: 10000,
    shipping_total: 500,
    total: 10000,
    items: [
      { id: 'item-1', title: 'Black', product_title: 'Classic Tote', quantity: 2, unit_price: 2500, thumbnail: 'https://images.unsplash.com/photo-1544816155-12df9643f363?ixlib=rb-4.0.3&w=150&q=80' },
      { id: 'item-2', title: 'Natural', product_title: 'Premium Canvas Bag', quantity: 1, unit_price: 5000, thumbnail: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?ixlib=rb-4.0.3&w=150&q=80' },
    ],
    shipping_address: {
      first_name: 'Nadun',
      last_name: 'Rathuwithana',
      address_1: '123 Main Street',
      city: 'Colombo',
      province: 'Western',
      postal_code: '00100',
      country_code: 'LK',
    },
    summary: { 
      raw_current_order_total: { value: 10000 },
      raw_current_discount_total: { value: 500 },
      raw_current_item_total: { value: 10000 },
      raw_current_shipping_total: { value: 500 }
    },
  },
  shippingAddress: {
    first_name: 'Nadun',
    last_name: 'Rathuwithana',
    address_1: '123 Main Street',
    city: 'Colombo',
    province: 'Western',
    postal_code: '00100',
    country_code: 'LK',
  },
} as unknown as OrderPlacedPreviewProps

export default OrderPlacedTemplate
