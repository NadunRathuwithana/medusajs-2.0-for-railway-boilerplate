import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { Base, textDark, textMuted } from './base'

export const ORDER_CANCELLED = 'order-cancelled'

export interface OrderCancelledTemplateProps {
  orderDisplayId: string
  customerFirstName: string
  orderTotal?: string
  cancellationReason?: string
  preview?: string
}

export const isOrderCancelledTemplateData = (data: any): data is OrderCancelledTemplateProps =>
  typeof data.orderDisplayId === 'string' && typeof data.customerFirstName === 'string'

export const OrderCancelledTemplate: React.FC<OrderCancelledTemplateProps> & {
  PreviewProps: OrderCancelledTemplateProps
} = ({ orderDisplayId, customerFirstName, orderTotal, cancellationReason, preview = '❌ Your order has been cancelled' }) => {
  return (
    <Base preview={preview}>
      {/* Header */}
      <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Text style={{ fontSize: '48px', margin: '0 0 12px' }}>❌</Text>
        <Text style={{
          fontSize: '26px',
          fontWeight: '700',
          color: textDark,
          margin: '0 0 8px',
          letterSpacing: '-0.5px',
        }}>
          Order Cancelled
        </Text>
        <Text style={{ color: textMuted, fontSize: '15px', margin: '0' }}>
          Hi {customerFirstName}, your order #{orderDisplayId} has been cancelled.
        </Text>
      </Section>

      {/* Cancellation Info */}
      <Section style={{
        backgroundColor: '#fff7f7',
        border: '1px solid #fca5a5',
        borderRadius: '10px',
        padding: '20px 24px',
        marginBottom: '28px',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '6px 0', color: textMuted, fontSize: '14px' }}>Order Number</td>
              <td style={{ padding: '6px 0', fontWeight: '600', fontSize: '14px', textAlign: 'right' }}>#{orderDisplayId}</td>
            </tr>
            {orderTotal && (
              <tr>
                <td style={{ padding: '6px 0', color: textMuted, fontSize: '14px' }}>Order Total</td>
                <td style={{ padding: '6px 0', fontWeight: '600', fontSize: '14px', textAlign: 'right' }}>{orderTotal}</td>
              </tr>
            )}
            {cancellationReason && (
              <tr>
                <td style={{ padding: '6px 0', color: textMuted, fontSize: '14px' }}>Reason</td>
                <td style={{ padding: '6px 0', fontWeight: '500', fontSize: '14px', textAlign: 'right', color: '#dc2626' }}>{cancellationReason}</td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      <Hr style={{ borderColor: '#e5e7eb', margin: '0 0 24px' }} />

      <Section>
        <Text style={{ color: textMuted, fontSize: '14px', margin: '0 0 12px' }}>
          If a payment was made, your refund will be processed within <strong>5-7 business days</strong> to your original payment method.
        </Text>
        <Text style={{ color: textMuted, fontSize: '14px', margin: '0' }}>
          If you believe this cancellation was a mistake or need assistance, please contact our support team.
        </Text>
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
