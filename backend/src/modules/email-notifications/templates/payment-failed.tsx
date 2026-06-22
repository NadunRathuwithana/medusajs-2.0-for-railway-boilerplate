import { Text, Section, Button, Hr } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight } from './base'

export const PAYMENT_FAILED = 'payment-failed'

export interface PaymentFailedTemplateProps {
  orderDisplayId?: string
  customerFirstName: string
  orderTotal?: string
  errorMessage?: string
  checkoutUrl?: string
  preview?: string
}

export const isPaymentFailedTemplateData = (data: any): data is PaymentFailedTemplateProps =>
  typeof data.customerFirstName === 'string'

export const PaymentFailedTemplate: React.FC<PaymentFailedTemplateProps> & {
  PreviewProps: PaymentFailedTemplateProps
} = ({ orderDisplayId, customerFirstName, orderTotal, errorMessage, checkoutUrl, preview = 'Action required for your payment' }) => {
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
          Payment Failed
        </Text>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0', lineHeight: '1.6' }}>
          Dear {customerFirstName}, we were unable to process the payment for your recent attempt{orderDisplayId ? ` (Order #${orderDisplayId})` : ''}.
        </Text>
      </Section>

      <Hr style={{ borderColor: borderLight, margin: '0 0 32px' }} />

      <Section style={{ marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', borderLeft: \`2px solid \${borderLight}\`, paddingLeft: '16px', display: 'block' }}>
          <tbody>
            {orderTotal && (
              <tr>
                <td style={{ padding: '4px 0 4px 16px', color: textSecondary, fontSize: '12px', width: '120px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</td>
                <td style={{ padding: '4px 0', fontSize: '13px', color: textPrimary }}>{orderTotal}</td>
              </tr>
            )}
            {errorMessage && (
              <tr>
                <td style={{ padding: '4px 0 4px 16px', color: textSecondary, fontSize: '12px', width: '120px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Error</td>
                <td style={{ padding: '4px 0', fontSize: '13px', color: textPrimary }}>{errorMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      {checkoutUrl && (
        <Section style={{ marginTop: '24px' }}>
          <Button
            href={checkoutUrl}
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
            Retry Payment
          </Button>
        </Section>
      )}

      <Hr style={{ borderColor: borderLight, margin: '32px 0 24px' }} />

      <Section>
        <Text style={{ color: textSecondary, fontSize: '12px', margin: '0 0 12px', lineHeight: '1.6' }}>
          No charges were made to your account. If you continue to experience issues, you may want to try a different payment method or contact your bank.
        </Text>
        <Text style={{ color: textSecondary, fontSize: '12px', margin: '0', lineHeight: '1.6' }}>
          If you need further assistance, please reply directly to this email.
        </Text>
      </Section>
    </Base>
  )
}

PaymentFailedTemplate.PreviewProps = {
  orderDisplayId: 'ORD-001',
  customerFirstName: 'Nadun',
  orderTotal: 'LKR 1,500.00',
  errorMessage: 'Insufficient funds or card declined.',
  checkoutUrl: 'https://cardle.lk/checkout',
}

export default PaymentFailedTemplate
