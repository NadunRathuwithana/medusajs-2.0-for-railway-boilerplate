import { Text, Section, Button, Hr } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight } from './base'

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
} = ({ customerFirstName, resetLink, expiresInMinutes = 30, preview = 'Reset your Cardle password' }) => {
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
          Password Reset
        </Text>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0', lineHeight: '1.6' }}>
          Dear {customerFirstName}, we received a request to reset your password.
        </Text>
      </Section>

      <Hr style={{ borderColor: borderLight, margin: '0 0 32px' }} />

      <Section style={{ marginBottom: '32px' }}>
        <Text style={{ color: textSecondary, fontSize: '12px', margin: '0 0 20px', lineHeight: '1.6' }}>
          Click the button below to set a new password. For security reasons, this link will expire in {expiresInMinutes} minutes.
        </Text>
        <Button
          href={resetLink}
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
          Reset Password
        </Button>
      </Section>

      <Hr style={{ borderColor: borderLight, margin: '32px 0 24px' }} />

      <Section>
        <Text style={{ color: textSecondary, fontSize: '12px', margin: '0 0 8px', lineHeight: '1.6' }}>
          If you didn't request a password reset, you can safely ignore this email. Your password will not change.
        </Text>
      </Section>
    </Base>
  )
}

PasswordResetTemplate.PreviewProps = {
  customerFirstName: 'Nadun',
  resetLink: 'https://cardle.lk/account/reset?token=abc123',
  expiresInMinutes: 30,
}

export default PasswordResetTemplate
