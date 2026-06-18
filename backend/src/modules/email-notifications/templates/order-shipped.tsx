import { Text, Section, Hr, Button } from '@react-email/components'
import * as React from 'react'
import { Base, accentColor, textDark, textMuted } from './base'

export const ORDER_SHIPPED = 'order-shipped'

export interface OrderShippedTemplateProps {
  orderDisplayId: string
  customerFirstName: string
  trackingNumber?: string
  trackingUrl?: string
  carrierName?: string
  estimatedDelivery?: string
  preview?: string
}

export const isOrderShippedTemplateData = (data: any): data is OrderShippedTemplateProps =>
  typeof data.orderDisplayId === 'string' && typeof data.customerFirstName === 'string'

export const OrderShippedTemplate: React.FC<OrderShippedTemplateProps> & {
  PreviewProps: OrderShippedTemplateProps
} = ({
  orderDisplayId,
  customerFirstName,
  trackingNumber,
  trackingUrl,
  carrierName,
  estimatedDelivery,
  preview = '🚚 Your order is on the way!',
}) => {
  return (
    <Base preview={preview}>
      {/* Header */}
      <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Text style={{ fontSize: '48px', margin: '0 0 12px' }}>🚚</Text>
        <Text style={{
          fontSize: '26px',
          fontWeight: '700',
          color: textDark,
          margin: '0 0 8px',
          letterSpacing: '-0.5px',
        }}>
          Your Order Has Shipped!
        </Text>
        <Text style={{ color: textMuted, fontSize: '15px', margin: '0' }}>
          Hi {customerFirstName}, your order #{orderDisplayId} is on its way.
        </Text>
      </Section>

      {/* Tracking Box */}
      {trackingNumber && (
        <Section style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '10px',
          padding: '20px 24px',
          marginBottom: '28px',
          textAlign: 'center',
        }}>
          <Text style={{ fontWeight: '600', fontSize: '13px', color: '#16a34a', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Tracking Information
          </Text>
          {carrierName && (
            <Text style={{ fontSize: '14px', color: textMuted, margin: '0 0 4px' }}>
              Carrier: <strong>{carrierName}</strong>
            </Text>
          )}
          <Text style={{ fontSize: '18px', fontWeight: '700', color: textDark, margin: '8px 0', letterSpacing: '2px' }}>
            {trackingNumber}
          </Text>
          {estimatedDelivery && (
            <Text style={{ fontSize: '13px', color: textMuted, margin: '0 0 16px' }}>
              Estimated delivery: <strong>{estimatedDelivery}</strong>
            </Text>
          )}
          {trackingUrl && (
            <Button
              href={trackingUrl}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                padding: '12px 28px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Track Your Order →
            </Button>
          )}
        </Section>
      )}

      <Hr style={{ borderColor: '#e5e7eb', margin: '0 0 24px' }} />

      <Section style={{ textAlign: 'center' }}>
        <Text style={{ color: textMuted, fontSize: '14px', margin: '0' }}>
          If you have any questions about your shipment, please contact our support team.
        </Text>
      </Section>
    </Base>
  )
}

OrderShippedTemplate.PreviewProps = {
  orderDisplayId: 'ORD-001',
  customerFirstName: 'Nadun',
  trackingNumber: 'LK1234567890',
  trackingUrl: 'https://example.com/track/LK1234567890',
  carrierName: 'Sri Lanka Post',
  estimatedDelivery: 'June 22, 2025',
}

export default OrderShippedTemplate
