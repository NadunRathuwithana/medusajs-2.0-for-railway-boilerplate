import { Text, Section, Hr, Button, Img, Row, Column } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight, bgDark, textLight, fontFamily } from './base'

export const ORDER_SHIPPED = 'order-shipped'

export interface OrderShippedTemplateProps {
  orderDisplayId: string
  customerFirstName: string
  trackingNumber?: string
  trackingUrl?: string
  carrierName?: string
  estimatedDelivery?: string
  preview?: string
  shopUrl?: string
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
  shopUrl = 'https://storefront-production-66a1.up.railway.app'
}) => {
  return (
    <Base preview={preview}>
      {/* Hero Image */}
      <Section style={{ position: 'relative', textAlign: 'center', backgroundColor: '#e5e5e5' }}>
        <Img 
          src={`${shopUrl}/home/cardle-status-meets-utility-tote-bag.jpg`} 
          width="600" 
          height="300" 
          style={{ objectFit: 'cover', display: 'block' }}
          alt="Order Dispatched" 
        />
        <Section style={{ padding: '30px 20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <Text style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 5px', color: textPrimary, textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            ORDER DISPATCHED
          </Text>
          <Text style={{ fontSize: '13px', fontWeight: '500', margin: '0', color: textSecondary, letterSpacing: '1px', fontFamily }}>
            YOUR TOTE BAGS ARE ON THEIR WAY
          </Text>
        </Section>
      </Section>

      <Section style={{ padding: '20px 40px 40px', backgroundColor: '#ffffff' }}>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0 0 24px', lineHeight: '1.6', fontFamily }}>
          Dear {customerFirstName}, your order <span style={{ fontWeight: '600', color: textPrimary }}>#{orderDisplayId}</span> has been dispatched and is currently on its way to you. 
          We hope you love your new Cardle products.
        </Text>

        {/* Tracking Box */}
        {trackingNumber && (
          <Section style={{ 
            border: `1px solid ${borderLight}`, 
            borderRadius: '12px', 
            padding: '24px', 
            marginBottom: '32px',
            backgroundColor: '#fafafa'
          }}>
            <Text style={{ fontSize: '12px', fontWeight: '800', color: textPrimary, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
              Tracking Details
            </Text>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily }}>
              <tbody>
                {carrierName && (
                  <tr>
                    <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', width: '120px', textTransform: 'uppercase', letterSpacing: '1px' }}>Carrier</td>
                    <td style={{ padding: '6px 0', fontWeight: '600', fontSize: '13px', color: textPrimary }}>{carrierName}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', width: '120px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tracking No.</td>
                  <td style={{ padding: '6px 0', fontWeight: '800', fontSize: '14px', color: '#d9534f', letterSpacing: '1px' }}>{trackingNumber}</td>
                </tr>
                {estimatedDelivery && (
                  <tr>
                    <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', width: '120px', textTransform: 'uppercase', letterSpacing: '1px' }}>Est. Delivery</td>
                    <td style={{ padding: '6px 0', fontWeight: '600', fontSize: '13px', color: textPrimary }}>{estimatedDelivery}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>
        )}

        {/* CTA */}
        <Section style={{ textAlign: 'center' }}>
          {trackingUrl && (
            <Button
              href={trackingUrl}
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
                marginBottom: '20px',
                fontFamily
              }}
            >
              TRACK SHIPMENT
            </Button>
          )}
          <Text style={{ color: textSecondary, fontSize: '11px', margin: '0', letterSpacing: '1px', textTransform: 'uppercase', fontFamily }}>
            QUESTIONS REGARDING YOUR SHIPMENT? REPLY DIRECTLY TO THIS EMAIL.
          </Text>
        </Section>
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
