import { Text, Section, Button, Hr } from '@react-email/components'
import * as React from 'react'
import { Base, accentColor, textDark, textMuted } from './base'

export const CUSTOMER_WELCOME = 'customer-welcome'

export interface CustomerWelcomeTemplateProps {
  customerFirstName: string
  customerEmail: string
  shopUrl?: string
  preview?: string
}

export const isCustomerWelcomeTemplateData = (data: any): data is CustomerWelcomeTemplateProps =>
  typeof data.customerFirstName === 'string' && typeof data.customerEmail === 'string'

export const CustomerWelcomeTemplate: React.FC<CustomerWelcomeTemplateProps> & {
  PreviewProps: CustomerWelcomeTemplateProps
} = ({ customerFirstName, customerEmail, shopUrl = 'https://theek.lk', preview = '🎉 Welcome to Theek.lk!' }) => {
  return (
    <Base preview={preview}>
      {/* Welcome Hero */}
      <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Text style={{ fontSize: '56px', margin: '0 0 12px' }}>🎉</Text>
        <Text style={{
          fontSize: '28px',
          fontWeight: '700',
          color: textDark,
          margin: '0 0 8px',
          letterSpacing: '-0.5px',
        }}>
          Welcome to Theek.lk!
        </Text>
        <Text style={{ color: textMuted, fontSize: '15px', margin: '0' }}>
          Hi {customerFirstName}, we're so excited to have you on board.
        </Text>
      </Section>

      {/* Features */}
      <Section style={{
        backgroundColor: '#fafbff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '24px',
        marginBottom: '28px',
      }}>
        <Text style={{ fontWeight: '600', color: textDark, fontSize: '16px', margin: '0 0 16px' }}>
          What you can do with your account:
        </Text>
        {[
          { icon: '🛒', text: 'Browse and shop our full catalog' },
          { icon: '📦', text: 'Track your orders in real-time' },
          { icon: '❤️', text: 'Save favourites to your wishlist' },
          { icon: '🔄', text: 'Manage returns and exchanges easily' },
        ].map(({ icon, text }, i) => (
          <Text key={i} style={{ fontSize: '14px', color: textMuted, margin: '0 0 10px', display: 'flex' }}>
            {icon}&nbsp;&nbsp;{text}
          </Text>
        ))}
      </Section>

      <Hr style={{ borderColor: '#e5e7eb', margin: '0 0 28px' }} />

      {/* Account Info */}
      <Section style={{ marginBottom: '28px' }}>
        <Text style={{ fontSize: '14px', color: textMuted, margin: '0 0 4px' }}>Your account email:</Text>
        <Text style={{ fontSize: '15px', fontWeight: '600', color: textDark, margin: '0' }}>{customerEmail}</Text>
      </Section>

      {/* CTA */}
      <Section style={{ textAlign: 'center' }}>
        <Button
          href={shopUrl}
          style={{
            backgroundColor: accentColor,
            color: '#ffffff',
            padding: '14px 36px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '15px',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Start Shopping →
        </Button>
      </Section>
    </Base>
  )
}

CustomerWelcomeTemplate.PreviewProps = {
  customerFirstName: 'Nadun',
  customerEmail: 'nadun@example.com',
  shopUrl: 'https://theek.lk',
}

export default CustomerWelcomeTemplate
