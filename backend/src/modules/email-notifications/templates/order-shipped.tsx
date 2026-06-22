import { Text, Section, Hr, Button } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight } from './base'

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
  preview = 'Your order is on the way',
}) => {
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
          Order Dispatched
        </Text>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0', lineHeight: '1.6' }}>
          Dear {customerFirstName}, your order #{orderDisplayId} has been dispatched and is currently on its way to you.
        </Text>
      </Section>

      <Hr style={{ borderColor: borderLight, margin: '0 0 32px' }} />

      {/* Tracking Box */}
      {trackingNumber && (
        <Section style={{ marginBottom: '40px' }}>
          <Text style={{ fontSize: '12px', color: textSecondary, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Tracking Details
          </Text>
          <table style={{ width: '100%', borderCollapse: 'collapse', borderLeft: `2px solid ${borderLight}`, paddingLeft: '16px', display: 'block' }}>
            <tbody>
              {carrierName && (
                <tr>
                  <td style={{ padding: '4px 0 4px 16px', color: textSecondary, fontSize: '12px', width: '120px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Carrier</td>
                  <td style={{ padding: '4px 0', fontSize: '13px', color: textPrimary }}>{carrierName}</td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '4px 0 4px 16px', color: textSecondary, fontSize: '12px', width: '120px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tracking No.</td>
                <td style={{ padding: '4px 0', fontWeight: '500', fontSize: '13px', color: textPrimary, letterSpacing: '1px' }}>{trackingNumber}</td>
              </tr>
              {estimatedDelivery && (
                <tr>
                  <td style={{ padding: '4px 0 4px 16px', color: textSecondary, fontSize: '12px', width: '120px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Est. Delivery</td>
                  <td style={{ padding: '4px 0', fontSize: '13px', color: textPrimary }}>{estimatedDelivery}</td>
                </tr>
              )}
            </tbody>
          </table>

          {trackingUrl && (
            <Section style={{ marginTop: '24px' }}>
              <Button
                href={trackingUrl}
                style={{
                  backgroundColor: textPrimary,
                  color: '#ffffff',
                  padding: '12px 24px',
                  fontSize: '12px',
                  fontWeight: '500',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Track Shipment
              </Button>
            </Section>
          )}
        </Section>
      )}

      <Hr style={{ borderColor: borderLight, margin: '0 0 24px' }} />

      <Section>
        <Text style={{ color: textSecondary, fontSize: '12px', margin: '0', lineHeight: '1.6' }}>
          If you have any questions regarding your shipment, please reply directly to this email.
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
  estimatedDelivery: 'June 22, 2026',
}

export default OrderShippedTemplate
