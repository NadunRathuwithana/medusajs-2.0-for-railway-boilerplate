import { Text, Section, Hr, Button, Img } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight, bgDark, textLight, fontFamily } from './base'

export const ORDER_REFUND = 'order-refund'

export interface OrderRefundTemplateProps {
  orderDisplayId: string
  customerFirstName: string
  refundAmount: string
  refundReason?: string
  preview?: string
  shopUrl?: string
}

export const isOrderRefundTemplateData = (data: any): data is OrderRefundTemplateProps =>
  typeof data.orderDisplayId === 'string' && typeof data.customerFirstName === 'string' && typeof data.refundAmount === 'string'

export const OrderRefundTemplate: React.FC<OrderRefundTemplateProps> & {
  PreviewProps: OrderRefundTemplateProps
} = ({ 
  orderDisplayId, 
  customerFirstName, 
  refundAmount, 
  refundReason, 
  preview = 'Your refund has been processed',
  shopUrl = process.env.STORE_URL || 'https://cardle.lk'
}) => {
  return (
    <Base preview={preview}>
      {/* Hero Image */}
      <Section style={{ position: 'relative', textAlign: 'center', backgroundColor: '#e5e5e5' }}>
        <Img 
          src={`${shopUrl}/email/hero2.jpg`} 
          width="600" 
          height="400" 
          style={{ objectFit: 'cover', display: 'block' }}
          alt="Refund Processed" 
        />
        <Section style={{ padding: '30px 20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <Text style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 5px', color: textPrimary, textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            REFUND PROCESSED
          </Text>
          <Text style={{ fontSize: '13px', fontWeight: '500', margin: '0', color: textSecondary, letterSpacing: '1px', fontFamily }}>
            FUNDS ARE ON THEIR WAY BACK TO YOU
          </Text>
        </Section>
      </Section>

      <Section style={{ padding: '20px 40px 40px', backgroundColor: '#ffffff' }}>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0 0 24px', lineHeight: '1.6', fontFamily }}>
          Dear {customerFirstName}, your refund for order <span style={{ fontWeight: '600', color: textPrimary }}>#{orderDisplayId}</span> has been successfully processed.
          Please allow 5-7 business days for the amount to appear in your account, depending on your bank or payment provider.
        </Text>

        {/* Refund Info Card */}
        <Section style={{ 
          border: `1px solid ${borderLight}`, 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '32px',
          backgroundColor: '#fafafa'
        }}>
          <Text style={{ fontSize: '12px', fontWeight: '800', color: textPrimary, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            Refund Details
          </Text>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily }}>
            <tbody>
              <tr>
                <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Number</td>
                <td style={{ padding: '6px 0', fontWeight: '700', fontSize: '13px', textAlign: 'right', color: textPrimary }}>#{orderDisplayId}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Refund Amount</td>
                <td style={{ padding: '6px 0', fontWeight: '800', fontSize: '14px', textAlign: 'right', color: '#d9534f' }}>{refundAmount}</td>
              </tr>
              {refundReason && (
                <tr>
                  <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Reason</td>
                  <td style={{ padding: '6px 0', fontWeight: '600', fontSize: '13px', textAlign: 'right', color: textPrimary }}>{refundReason}</td>
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
            HAVE QUESTIONS? REPLY DIRECTLY TO THIS EMAIL.
          </Text>
        </Section>
      </Section>
    </Base>
  )
}

OrderRefundTemplate.PreviewProps = {
  orderDisplayId: 'ORD-001',
  customerFirstName: 'Nadun',
  refundAmount: 'LKR 2,500.00',
  refundReason: 'Item out of stock',
}

export default OrderRefundTemplate
