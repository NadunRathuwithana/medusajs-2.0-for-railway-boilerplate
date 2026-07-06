import { Text, Section, Hr, Img, Button } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight, bgDark, textLight, fontFamily } from './base'

export const ORDER_CANCELLED = 'order-cancelled'

export interface OrderCancelledTemplateProps {
  orderDisplayId: string
  customerFirstName: string
  orderTotal?: string
  cancellationReason?: string
  preview?: string
  shopUrl?: string
}

export const isOrderCancelledTemplateData = (data: any): data is OrderCancelledTemplateProps =>
  typeof data.orderDisplayId === 'string' && typeof data.customerFirstName === 'string'

export const OrderCancelledTemplate: React.FC<OrderCancelledTemplateProps> & {
  PreviewProps: OrderCancelledTemplateProps
} = ({ 
  orderDisplayId, 
  customerFirstName, 
  orderTotal, 
  cancellationReason, 
  preview = 'Your order has been cancelled',
  shopUrl = process.env.STORE_URL || 'https://cardle.lk'
}) => {
  return (
    <Base preview={preview}>
      {/* Hero Image */}
      <Section style={{ position: 'relative', textAlign: 'center', backgroundColor: '#e5e5e5' }}>
        <Section style={{ padding: '60px 0', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto', display: 'block' }}>
            <circle cx="60" cy="60" r="60" fill="#F3F4F6"/>
            <circle cx="60" cy="60" r="45" fill="#111111"/>
            <path d="M46 50H74L77 78H43L46 50Z" stroke="#FFFFFF" strokeWidth="2.5" strokeLinejoin="round"/>
            <path d="M52 50V42C52 37.5817 55.5817 34 60 34C64.4183 34 68 37.5817 68 42V50" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M54 58L66 70M66 58L54 70" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </Section>
        <Section style={{ padding: '30px 20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <Text style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 5px', color: textPrimary, textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            ORDER CANCELLED
          </Text>
          <Text style={{ fontSize: '13px', fontWeight: '500', margin: '0', color: textSecondary, letterSpacing: '1px', fontFamily }}>
            WE'RE SORRY IT DIDN'T WORK OUT
          </Text>
        </Section>
      </Section>

      <Section style={{ padding: '20px 40px 40px', backgroundColor: '#ffffff' }}>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0 0 24px', lineHeight: '1.6', fontFamily }}>
          Dear {customerFirstName}, your order <span style={{ fontWeight: '600', color: textPrimary }}>#{orderDisplayId}</span> has been successfully cancelled. 
          If you have already paid for your items, the refund will be processed to your original payment method.
        </Text>

        {/* Cancellation Info Card */}
        <Section style={{ 
          border: `1px solid ${borderLight}`, 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '32px',
          backgroundColor: '#fafafa'
        }}>
          <Text style={{ fontSize: '12px', fontWeight: '800', color: textPrimary, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            Cancellation Details
          </Text>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily }}>
            <tbody>
              <tr>
                <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Number</td>
                <td style={{ padding: '6px 0', fontWeight: '700', fontSize: '13px', textAlign: 'right', color: textPrimary }}>#{orderDisplayId}</td>
              </tr>
              {orderTotal && (
                <tr>
                  <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Total</td>
                  <td style={{ padding: '6px 0', fontWeight: '800', fontSize: '14px', textAlign: 'right', color: '#d9534f' }}>{orderTotal}</td>
                </tr>
              )}
              {cancellationReason && (
                <tr>
                  <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Reason</td>
                  <td style={{ padding: '6px 0', fontWeight: '600', fontSize: '13px', textAlign: 'right', color: textPrimary }}>{cancellationReason}</td>
                </tr>
              )}
            </tbody>
          </table>
        </Section>

        {/* CTA */}
        <Section style={{ textAlign: 'center' }}>
          <Button
            href={`${shopUrl}/store`}
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
            CONTINUE SHOPPING
          </Button>
          <Text style={{ color: textSecondary, fontSize: '11px', margin: '0', letterSpacing: '1px', textTransform: 'uppercase', fontFamily }}>
            BELIEVE THIS WAS A MISTAKE? REPLY DIRECTLY TO THIS EMAIL.
          </Text>
        </Section>
      </Section>
    </Base>
  )
}

OrderCancelledTemplate.PreviewProps = {
  orderDisplayId: 'ORD-001',
  customerFirstName: 'Nadun',
  orderTotal: 'LKR 1,500.00',
  cancellationReason: 'Customer Request',
}

export default OrderCancelledTemplate
