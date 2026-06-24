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
  shopUrl = 'https://storefront-production-66a1.up.railway.app'
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
          alt="Payment Failed" 
        />
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
  checkoutUrl: 'https://storefront-production-66a1.up.railway.app/checkout',
}

export default PaymentFailedTemplate
