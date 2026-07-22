import { Text, Section, Button, Hr, Img } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight, bgDark, textLight, fontFamily } from './base'

export const PAYMENT_FAILED = 'payment-failed'

export interface PaymentFailedTemplateProps {
  orderDisplayId?: string
  customerFirstName: string
  orderTotal?: string
  errorMessage?: string
  checkoutUrl?: string
  preview?: string
  shopUrl?: string
}

export const isPaymentFailedTemplateData = (data: any): data is PaymentFailedTemplateProps =>
  typeof data.customerFirstName === 'string'

export const PaymentFailedTemplate: React.FC<PaymentFailedTemplateProps> & {
  PreviewProps: PaymentFailedTemplateProps
} = ({ 
  orderDisplayId, 
  customerFirstName, 
  orderTotal, 
  errorMessage, 
  checkoutUrl, 
  preview = 'Action required for your payment',
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
            <rect x="38" y="46" width="44" height="28" rx="4" stroke="#FFFFFF" strokeWidth="2.5"/>
            <line x1="38" y1="56" x2="82" y2="56" stroke="#FFFFFF" strokeWidth="2.5"/>
            <circle cx="82" cy="38" r="14" fill="#EF4444" stroke="#FAFAFA" strokeWidth="3"/>
            <path d="M77 33L87 43M87 33L77 43" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </Section>
        <Section style={{ padding: '30px 20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <Text style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 5px', color: textPrimary, textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            PAYMENT FAILED
          </Text>
          <Text style={{ fontSize: '13px', fontWeight: '500', margin: '0', color: textSecondary, letterSpacing: '1px', fontFamily }}>
            LET'S TRY THAT AGAIN
          </Text>
        </Section>
      </Section>

      <Section style={{ padding: '20px 40px 40px', backgroundColor: '#ffffff' }}>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0 0 24px', lineHeight: '1.6', fontFamily }}>
          Dear {customerFirstName}, we were unable to process the payment for your recent attempt{orderDisplayId ? ` (Order #${orderDisplayId})` : ''}. 
          Don't worry, no charges were made to your account.
        </Text>

        {/* Payment Info Card */}
        <Section style={{ 
          border: `1px solid ${borderLight}`, 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '32px',
          backgroundColor: '#fafafa'
        }}>
          <Text style={{ fontSize: '12px', fontWeight: '800', color: textPrimary, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            Transaction Details
          </Text>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily }}>
            <tbody>
              {orderTotal && (
                <tr>
                  <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', width: '120px', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount</td>
                  <td style={{ padding: '6px 0', fontWeight: '800', fontSize: '14px', color: textPrimary }}>{orderTotal}</td>
                </tr>
              )}
              {errorMessage && (
                <tr>
                  <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', width: '120px', textTransform: 'uppercase', letterSpacing: '1px' }}>Error</td>
                  <td style={{ padding: '6px 0', fontWeight: '600', fontSize: '13px', color: '#d9534f' }}>{errorMessage}</td>
                </tr>
              )}
            </tbody>
          </table>
        </Section>

        {/* CTA */}
        {checkoutUrl && (
          <Section style={{ textAlign: 'center' }}>
            <Button
              href={checkoutUrl}
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
              RETRY PAYMENT
            </Button>
            <Text style={{ color: textSecondary, fontSize: '11px', margin: '0', letterSpacing: '1px', textTransform: 'uppercase', fontFamily }}>
              EXPERIENCING ISSUES? CONTACT YOUR BANK OR REPLY TO THIS EMAIL.
            </Text>
          </Section>
        )}
      </Section>
    </Base>
  )
}

PaymentFailedTemplate.PreviewProps = {
  orderDisplayId: 'ORD-001',
  customerFirstName: 'Nadun',
  orderTotal: 'LKR 1,500.00',
  errorMessage: 'Insufficient funds or card declined.',
  checkoutUrl: (process.env.STORE_URL || 'https://cardle.lk') + '/checkout',
}

export default PaymentFailedTemplate
