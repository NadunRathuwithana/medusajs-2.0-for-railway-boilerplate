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
            <path d="M48 60V50C48 43.3726 53.3726 38 60 38C66.6274 38 72 43.3726 72 50V60" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"/>
            <rect x="42" y="60" width="36" height="26" rx="4" fill="#FFFFFF"/>
            <circle cx="60" cy="73" r="2.5" fill="#111111"/>
          </svg>
        </Section>
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
  resetLink: (process.env.STORE_URL || 'https://cardle.lk') + '/account/reset?token=abc123',
  expiresInMinutes: 30,
}

export default PasswordResetTemplate
