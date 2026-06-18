import { Text, Section, Hr, Button } from '@react-email/components'
import * as React from 'react'
import { Base, accentColor, textDark, textMuted } from './base'
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
}

export const isOrderPlacedTemplateData = (data: any): data is OrderPlacedTemplateProps =>
  typeof data.order === 'object' && typeof data.shippingAddress === 'object'

const formatCurrency = (amount: number, currency: string) => {
  return `${currency?.toUpperCase() ?? ''} ${(amount / 100).toFixed(2)}`
}

export const OrderPlacedTemplate: React.FC<OrderPlacedTemplateProps> & {
  PreviewProps: OrderPlacedPreviewProps
} = ({ order, shippingAddress, preview = '✅ Your order has been confirmed!' }) => {
  return (
    <Base preview={preview}>
      {/* Success Badge */}
      <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Text style={{
          fontSize: '48px',
          margin: '0 0 12px',
        }}>✅</Text>
        <Text style={{
          fontSize: '26px',
          fontWeight: '700',
          color: textDark,
          margin: '0 0 8px',
          letterSpacing: '-0.5px',
        }}>
          Order Confirmed!
        </Text>
        <Text style={{ color: textMuted, fontSize: '15px', margin: '0' }}>
          Hi {shippingAddress.first_name}, thank you for your purchase.
        </Text>
      </Section>

      {/* Order Info Box */}
      <Section style={{
        backgroundColor: '#f8faff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '20px 24px',
        marginBottom: '28px',
      }}>
        <Text style={{ fontWeight: '600', fontSize: '13px', color: textMuted, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Order Details
        </Text>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '6px 0', color: textMuted, fontSize: '14px' }}>Order Number</td>
              <td style={{ padding: '6px 0', fontWeight: '600', fontSize: '14px', textAlign: 'right' }}>#{order.display_id}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 0', color: textMuted, fontSize: '14px' }}>Order Date</td>
              <td style={{ padding: '6px 0', fontWeight: '600', fontSize: '14px', textAlign: 'right' }}>
                {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 0', color: textMuted, fontSize: '14px' }}>Order Total</td>
              <td style={{ padding: '6px 0', fontWeight: '700', fontSize: '16px', color: accentColor, textAlign: 'right' }}>
                {formatCurrency(order.summary.raw_current_order_total.value, order.currency_code)}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Items */}
      <Section style={{ marginBottom: '28px' }}>
        <Text style={{ fontWeight: '600', fontSize: '13px', color: textMuted, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Items Ordered
        </Text>
        {order.items?.map((item, index) => (
          <Section key={item.id ?? index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: '1px solid #f1f5f9',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td>
                    <Text style={{ margin: '0', fontWeight: '500', fontSize: '14px', color: textDark }}>
                      {item.product_title ?? item.title}
                    </Text>
                    <Text style={{ margin: '2px 0 0', fontSize: '12px', color: textMuted }}>
                      {item.title} × {item.quantity}
                    </Text>
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                    <Text style={{ margin: '0', fontWeight: '600', fontSize: '14px' }}>
                      {formatCurrency((item.unit_price ?? 0) * item.quantity, order.currency_code)}
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>
        ))}
      </Section>

      <Hr style={{ borderColor: '#e5e7eb', margin: '0 0 28px' }} />

      {/* Shipping Address */}
      <Section style={{ marginBottom: '32px' }}>
        <Text style={{ fontWeight: '600', fontSize: '13px', color: textMuted, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Shipping To
        </Text>
        <Text style={{ margin: '0', fontSize: '14px', color: textDark, lineHeight: '1.7' }}>
          {shippingAddress.first_name} {shippingAddress.last_name}<br />
          {shippingAddress.address_1}{shippingAddress.address_2 ? `, ${shippingAddress.address_2}` : ''}<br />
          {shippingAddress.city}{shippingAddress.province ? `, ${shippingAddress.province}` : ''} {shippingAddress.postal_code}<br />
          {shippingAddress.country_code?.toUpperCase()}
        </Text>
      </Section>

      {/* CTA */}
      <Section style={{ textAlign: 'center' }}>
        <Text style={{ color: textMuted, fontSize: '14px', margin: '0 0 16px' }}>
          You'll receive another email when your order ships.
        </Text>
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
    currency_code: 'USD',
    items: [
      { id: 'item-1', title: 'Size M / Black', product_title: 'Classic T-Shirt', quantity: 2, unit_price: 2500 },
      { id: 'item-2', title: 'Size L / White', product_title: 'Premium Hoodie', quantity: 1, unit_price: 5000 },
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
    summary: { raw_current_order_total: { value: 10000 } },
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
} as OrderPlacedPreviewProps

export default OrderPlacedTemplate
