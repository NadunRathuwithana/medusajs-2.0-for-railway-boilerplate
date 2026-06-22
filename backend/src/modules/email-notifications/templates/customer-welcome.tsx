import { Text, Section, Button, Hr } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight } from './base'

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
} = ({ customerFirstName, customerEmail, shopUrl = 'https://cardle.lk', preview = 'Welcome to Cardle' }) => {
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
          Welcome
        </Text>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0', lineHeight: '1.6' }}>
          Dear {customerFirstName}, welcome to Cardle. We are delighted to have you. Your account has been successfully created.
        </Text>
      </Section>

      <Hr style={{ borderColor: borderLight, margin: '0 0 32px' }} />

      <Section style={{ marginBottom: '32px' }}>
        <Text style={{ fontSize: '12px', color: textSecondary, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Account Details
        </Text>
        <table style={{ width: '100%', borderCollapse: 'collapse', borderLeft: \`2px solid \${borderLight}\`, paddingLeft: '16px', display: 'block' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 0 4px 16px', color: textSecondary, fontSize: '12px', width: '120px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</td>
              <td style={{ padding: '4px 0', fontSize: '13px', color: textPrimary }}>{customerEmail}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section style={{ marginTop: '24px' }}>
        <Button
          href={shopUrl}
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
          Explore Collection
        </Button>
      </Section>

      <Hr style={{ borderColor: borderLight, margin: '32px 0 24px' }} />

      <Section>
        <Text style={{ color: textSecondary, fontSize: '12px', margin: '0', lineHeight: '1.6' }}>
          If you have any questions or need assistance, please reply directly to this email.
        </Text>
      </Section>
    </Base>
  )
}

CustomerWelcomeTemplate.PreviewProps = {
  customerFirstName: 'Nadun',
  customerEmail: 'nadun@example.com',
  shopUrl: 'https://cardle.lk',
}

export default CustomerWelcomeTemplate
