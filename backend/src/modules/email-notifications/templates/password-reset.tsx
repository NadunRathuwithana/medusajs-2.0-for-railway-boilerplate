import { Text, Section, Button, Hr } from '@react-email/components'
import * as React from 'react'
import { Base, accentColor, textDark, textMuted } from './base'

export const PASSWORD_RESET = 'password-reset'

export interface PasswordResetTemplateProps {
  customerFirstName: string
  resetLink: string
  expiresInMinutes?: number
  preview?: string
}

export const isPasswordResetTemplateData = (data: any): data is PasswordResetTemplateProps =>
  typeof data.customerFirstName === 'string' && typeof data.resetLink === 'string'

export const PasswordResetTemplate: React.FC<PasswordResetTemplateProps> & {
  PreviewProps: PasswordResetTemplateProps
} = ({ customerFirstName, resetLink, expiresInMinutes = 30, preview = '🔒 Reset your Theek.lk password' }) => {
  return (
    <Base preview={preview}>
      <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Text style={{ fontSize: '48px', margin: '0 0 12px' }}>🔒</Text>
        <Text style={{
          fontSize: '26px',
          fontWeight: '700',
          color: textDark,
          margin: '0 0 8px',
          letterSpacing: '-0.5px',
        }}>
          Reset Your Password
        </Text>
        <Text style={{ color: textMuted, fontSize: '15px', margin: '0' }}>
          Hi {customerFirstName}, we received a request to reset your password.
        </Text>
      </Section>

      {/* Reset Box */}
      <Section style={{
        backgroundColor: '#fafbff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '28px 24px',
        marginBottom: '28px',
        textAlign: 'center',
      }}>
        <Text style={{ color: textMuted, fontSize: '14px', margin: '0 0 20px', lineHeight: '1.7' }}>
          Click the button below to set a new password. This link expires in <strong>{expiresInMinutes} minutes</strong>.
        </Text>
        <Button
          href={resetLink}
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
          Reset Password →
        </Button>
      </Section>

      <Hr style={{ borderColor: '#e5e7eb', margin: '0 0 24px' }} />

      <Section>
        <Text style={{ color: textMuted, fontSize: '13px', margin: '0 0 8px' }}>
          If you didn't request a password reset, you can safely ignore this email. Your password will not change.
        </Text>
        <Text style={{ color: textMuted, fontSize: '13px', margin: '0' }}>
          For security reasons, this link will expire in {expiresInMinutes} minutes. If it has expired, please request a new reset.
        </Text>
      </Section>
    </Base>
  )
}

PasswordResetTemplate.PreviewProps = {
  customerFirstName: 'Nadun',
  resetLink: 'https://theek.lk/account/reset?token=abc123',
  expiresInMinutes: 30,
}

export default PasswordResetTemplate
