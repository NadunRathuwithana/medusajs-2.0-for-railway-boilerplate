import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { Base, textDark, textMuted } from './base'

export const ORDER_REFUND = 'order-refund'

export interface OrderRefundTemplateProps {
  orderDisplayId: string
  customerFirstName: string
  refundAmount: string
  refundReason?: string
  preview?: string
}

export const isOrderRefundTemplateData = (data: any): data is OrderRefundTemplateProps =>
  typeof data.orderDisplayId === 'string' && typeof data.customerFirstName === 'string' && typeof data.refundAmount === 'string'

export const OrderRefundTemplate: React.FC<OrderRefundTemplateProps> & {
  PreviewProps: OrderRefundTemplateProps
} = ({ orderDisplayId, customerFirstName, refundAmount, refundReason, preview = '💳 Your refund has been processed' }) => {
  return (
    <Base preview={preview}>
      <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Text style={{ fontSize: '48px', margin: '0 0 12px' }}>💳</Text>
        <Text style={{
          fontSize: '26px',
          fontWeight: '700',
          color: textDark,
          margin: '0 0 8px',
          letterSpacing: '-0.5px',
        }}>
          Refund Processed
        </Text>
        <Text style={{ color: textMuted, fontSize: '15px', margin: '0' }}>
          Hi {customerFirstName}, your refund for order #{orderDisplayId} has been processed.
        </Text>
      </Section>

      {/* Refund Info */}
      <Section style={{
        backgroundColor: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '10px',
        padding: '24px',
        marginBottom: '28px',
        textAlign: 'center',
      }}>
        <Text style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Refund Amount
        </Text>
        <Text style={{ fontSize: '36px', fontWeight: '700', color: '#15803d', margin: '0 0 12px' }}>
          {refundAmount}
        </Text>
        {refundReason && (
          <Text style={{ fontSize: '13px', color: textMuted, margin: '0' }}>
            Reason: {refundReason}
          </Text>
        )}
      </Section>

      <Hr style={{ borderColor: '#e5e7eb', margin: '0 0 24px' }} />

      <Section>
        <Text style={{ color: textMuted, fontSize: '14px', margin: '0 0 12px', lineHeight: '1.7' }}>
          Your refund of <strong>{refundAmount}</strong> has been initiated. Please allow <strong>5-7 business days</strong> for the amount to appear in your account depending on your bank or payment provider.
        </Text>
        <Text style={{ color: textMuted, fontSize: '14px', margin: '0' }}>
          If you have any questions about this refund, please contact our support team with your order number <strong>#{orderDisplayId}</strong>.
        </Text>
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
