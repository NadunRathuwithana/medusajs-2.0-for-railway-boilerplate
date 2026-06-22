import { Text, Section, Hr, Button } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight } from './base'
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
  return \`\${currency?.toUpperCase() ?? ''} \${(amount / 100).toFixed(2)}\`
}

export const OrderPlacedTemplate: React.FC<OrderPlacedTemplateProps> & {
  PreviewProps: OrderPlacedPreviewProps
} = ({ order, shippingAddress, preview = 'Your order has been confirmed' }) => {
  return (
    <Base preview={preview}>
      <Section style={{ marginBottom: '32px' }}>
        <Text style={{
          fontSize: '16px',
          fontWeight: '500',
          color: textPrimary,
          margin: '0 0 12px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>
          Order Confirmed
        </Text>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0', lineHeight: '1.6' }}>
          Dear {shippingAddress.first_name}, thank you for your purchase. We have received your order and will notify you once it has been dispatched.
        </Text>
      </Section>

      <Hr style={{ borderColor: borderLight, margin: '0 0 32px' }} />

      {/* Order Info */}
      <Section style={{ marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', color: textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Number</td>
              <td style={{ padding: '8px 0', fontWeight: '500', fontSize: '13px', textAlign: 'right', color: textPrimary }}>#{order.display_id}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Date</td>
              <td style={{ padding: '8px 0', fontWeight: '500', fontSize: '13px', textAlign: 'right', color: textPrimary }}>
                {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Total</td>
              <td style={{ padding: '8px 0', fontWeight: '500', fontSize: '13px', textAlign: 'right', color: textPrimary }}>
                {formatCurrency(order.summary.raw_current_order_total.value, order.currency_code)}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Items */}
      <Section style={{ marginBottom: '32px' }}>
        <Text style={{ fontSize: '12px', color: textSecondary, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Items Ordered
        </Text>
        {order.items?.map((item, index) => (
          <Section key={item.id ?? index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderTop: \`1px solid \${borderLight}\`,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td>
                    <Text style={{ margin: '0', fontWeight: '500', fontSize: '13px', color: textPrimary }}>
                      {item.product_title ?? item.title}
                    </Text>
                    <Text style={{ margin: '4px 0 0', fontSize: '12px', color: textSecondary }}>
                      {item.title} × {item.quantity}
                    </Text>
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                    <Text style={{ margin: '0', fontWeight: '500', fontSize: '13px', color: textPrimary }}>
                      {formatCurrency((item.unit_price ?? 0) * item.quantity, order.currency_code)}
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>
        ))}
        <Hr style={{ borderColor: borderLight, margin: '0' }} />
      </Section>

      {/* Shipping Address */}
      <Section style={{ marginBottom: '40px' }}>
        <Text style={{ fontSize: '12px', color: textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Shipping To
        </Text>
        <Text style={{ margin: '0', fontSize: '13px', color: textPrimary, lineHeight: '1.6' }}>
          {shippingAddress.first_name} {shippingAddress.last_name}<br />
          {shippingAddress.address_1}{shippingAddress.address_2 ? \`, \${shippingAddress.address_2}\` : ''}<br />
          {shippingAddress.city}{shippingAddress.province ? \`, \${shippingAddress.province}\` : ''} {shippingAddress.postal_code}<br />
          {shippingAddress.country_code?.toUpperCase()}
        </Text>
      </Section>

      {/* CTA */}
      <Section style={{ textAlign: 'center' }}>
        <Text style={{ color: textSecondary, fontSize: '12px', margin: '0 0 16px', letterSpacing: '0.5px' }}>
          YOU WILL RECEIVE ANOTHER EMAIL WHEN YOUR ORDER SHIPS.
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
      { id: 'item-1', title: 'Black', product_title: 'Classic Tote', quantity: 2, unit_price: 2500 },
      { id: 'item-2', title: 'Natural', product_title: 'Premium Canvas Bag', quantity: 1, unit_price: 5000 },
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
