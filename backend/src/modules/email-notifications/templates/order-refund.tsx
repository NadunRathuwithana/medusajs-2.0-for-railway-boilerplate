import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight } from './base'

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
} = ({ orderDisplayId, customerFirstName, refundAmount, refundReason, preview = 'Your refund has been processed' }) => {
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
          Refund Processed
        </Text>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0', lineHeight: '1.6' }}>
          Dear {customerFirstName}, your refund for order #{orderDisplayId} has been successfully processed.
        </Text>
      </Section>

      <Hr style={{ borderColor: borderLight, margin: '0 0 32px' }} />

      <Section style={{ marginBottom: '32px' }}>
        <Text style={{ fontSize: '12px', color: textSecondary, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Refund Details
        </Text>
        <table style={{ width: '100%', borderCollapse: 'collapse', borderLeft: `2px solid ${borderLight}`, paddingLeft: '16px', display: 'block' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 0 4px 16px', color: textSecondary, fontSize: '12px', width: '120px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</td>
              <td style={{ padding: '4px 0', fontSize: '13px', color: textPrimary }}>{refundAmount}</td>
            </tr>
            {refundReason && (
              <tr>
                <td style={{ padding: '4px 0 4px 16px', color: textSecondary, fontSize: '12px', width: '120px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reason</td>
                <td style={{ padding: '4px 0', fontSize: '13px', color: textPrimary }}>{refundReason}</td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      <Hr style={{ borderColor: borderLight, margin: '32px 0 24px' }} />

      <Section>
        <Text style={{ color: textSecondary, fontSize: '12px', margin: '0 0 12px', lineHeight: '1.6' }}>
          Please allow 5-7 business days for the amount to appear in your account depending on your bank or payment provider.
        </Text>
        <Text style={{ color: textSecondary, fontSize: '12px', margin: '0', lineHeight: '1.6' }}>
          If you have any questions about this refund, please reply directly to this email.
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
