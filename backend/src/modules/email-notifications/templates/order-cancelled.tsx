import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight } from './base'

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
} = ({ orderDisplayId, customerFirstName, orderTotal, cancellationReason, preview = 'Your order has been cancelled' }) => {
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
          Order Cancelled
        </Text>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0', lineHeight: '1.6' }}>
          Dear {customerFirstName}, your order #{orderDisplayId} has been successfully cancelled.
        </Text>
      </Section>

      <Hr style={{ borderColor: borderLight, margin: '0 0 32px' }} />

      {/* Cancellation Info */}
      <Section style={{ marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', color: textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Number</td>
              <td style={{ padding: '8px 0', fontWeight: '500', fontSize: '13px', textAlign: 'right', color: textPrimary }}>#{orderDisplayId}</td>
            </tr>
            {orderTotal && (
              <tr>
                <td style={{ padding: '8px 0', color: textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Total</td>
                <td style={{ padding: '8px 0', fontWeight: '500', fontSize: '13px', textAlign: 'right', color: textPrimary }}>{orderTotal}</td>
              </tr>
            )}
            {cancellationReason && (
              <tr>
                <td style={{ padding: '8px 0', color: textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reason</td>
                <td style={{ padding: '8px 0', fontWeight: '500', fontSize: '13px', textAlign: 'right', color: textPrimary }}>{cancellationReason}</td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      <Hr style={{ borderColor: borderLight, margin: '0 0 24px' }} />

      <Section>
        <Text style={{ color: textSecondary, fontSize: '12px', margin: '0 0 12px', lineHeight: '1.6' }}>
          If a payment was made, your refund will be processed within 5-7 business days to your original payment method.
        </Text>
        <Text style={{ color: textSecondary, fontSize: '12px', margin: '0', lineHeight: '1.6' }}>
          If you believe this cancellation was a mistake or need further assistance, please reply directly to this email.
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
