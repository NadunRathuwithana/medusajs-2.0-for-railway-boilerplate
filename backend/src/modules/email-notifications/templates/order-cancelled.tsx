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
  shopUrl = process.env.STORE_URL || 'http://localhost:8000'
}) => {
  return (
    <Base preview={preview}>
      {/* Hero Image */}
      <Section style={{ position: 'relative', textAlign: 'center', backgroundColor: '#e5e5e5' }}>
        <Img 
          src="https://images.unsplash.com/photo-1590874103328-eac38a683ce7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
          width="600" 
          height="300" 
          style={{ objectFit: 'cover', display: 'block' }}
          alt="Order Cancelled" 
        />
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
            href={`${shopUrl}/lk/tote-bags`}
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
