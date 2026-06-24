import { Text, Section, Hr, Button, Img } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight, bgDark, textLight, fontFamily } from './base'

export const PASSWORD_RESET = 'password-reset'

export interface PasswordResetTemplateProps {
  customerFirstName: string
  resetLink: string
  expiresInMinutes?: number
  preview?: string
  shopUrl?: string
}

export const isPasswordResetTemplateData = (data: any): data is PasswordResetTemplateProps =>
  typeof data.customerFirstName === 'string' && typeof data.resetLink === 'string'

export const PasswordResetTemplate: React.FC<PasswordResetTemplateProps> & {
  PreviewProps: PasswordResetTemplateProps
} = ({ 
  customerFirstName, 
  resetLink, 
  expiresInMinutes = 30, 
  preview = 'Reset your Cardle password',
  shopUrl = 'https://storefront-production-66a1.up.railway.app'
}) => {
  return (
    <Base preview={preview}>
      {/* Hero Image */}
      <Section style={{ position: 'relative', textAlign: 'center', backgroundColor: '#e5e5e5' }}>
        <Img 
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
          width="600" 
          height="200" 
          style={{ objectFit: 'cover', display: 'block' }}
          alt="Password Reset" 
        />
        <Section style={{ padding: '30px 20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <Text style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 5px', color: textPrimary, textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            PASSWORD RESET
          </Text>
          <Text style={{ fontSize: '12px', fontWeight: '500', margin: '0', color: textSecondary, letterSpacing: '1px', fontFamily }}>
            SECURE YOUR CARDLE ACCOUNT
          </Text>
        </Section>
      </Section>

      <Section style={{ padding: '20px 40px 40px', backgroundColor: '#ffffff', textAlign: 'center' }}>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0 0 32px', lineHeight: '1.6', fontFamily }}>
          Dear {customerFirstName}, we received a request to reset your password. 
          If you made this request, please click the button below to set a new password. 
          For security reasons, this link will expire in <span style={{ fontWeight: '600', color: textPrimary }}>{expiresInMinutes} minutes</span>.
        </Text>

        <Button
          href={resetLink}
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
            marginBottom: '32px',
            fontFamily
          }}
        >
          RESET PASSWORD
        </Button>

        <Hr style={{ borderColor: borderLight, margin: '0 0 24px' }} />

        <Text style={{ color: textSecondary, fontSize: '11px', margin: '0', lineHeight: '1.6', fontFamily }}>
          If you didn't request a password reset, you can safely ignore this email. Your password will not change.
        </Text>
      </Section>
    </Base>
  )
}

PasswordResetTemplate.PreviewProps = {
  customerFirstName: 'Nadun',
  resetLink: 'https://storefront-production-66a1.up.railway.app/account/reset?token=abc123',
  expiresInMinutes: 30,
}

export default PasswordResetTemplate
