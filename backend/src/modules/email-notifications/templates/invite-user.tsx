import { Button, Link, Section, Text, Hr } from '@react-email/components'
import { Base, textPrimary, textSecondary, borderLight } from './base'

export const INVITE_USER = 'invite-user'

export interface InviteUserEmailProps {
  inviteLink: string
  preview?: string
}

export const isInviteUserData = (data: any): data is InviteUserEmailProps =>
  typeof data.inviteLink === 'string' && (typeof data.preview === 'string' || !data.preview)

export const InviteUserEmail = ({
  inviteLink,
  preview = `You've been invited to Medusa`,
}: InviteUserEmailProps) => {
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
          Admin Invitation
        </Text>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0', lineHeight: '1.6' }}>
          You have been invited to be an administrator on Medusa.
        </Text>
      </Section>

      <Hr style={{ borderColor: borderLight, margin: '0 0 32px' }} />

      <Section style={{ marginBottom: '32px' }}>
        <Button
          href={inviteLink}
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
            marginBottom: '16px'
          }}
        >
          Accept Invitation
        </Button>
        <Text style={{ color: textSecondary, fontSize: '12px', margin: '0 0 8px' }}>
          or copy and paste this URL into your browser:
        </Text>
        <Text style={{
          color: textSecondary,
          fontSize: '12px',
          maxWidth: '100%',
          wordBreak: 'break-all',
          overflowWrap: 'break-word',
          margin: '0'
        }}>
          <Link
            href={inviteLink}
            style={{ color: textPrimary, textDecoration: 'underline' }}
          >
            {inviteLink}
          </Link>
        </Text>
      </Section>

      <Hr style={{ borderColor: borderLight, margin: '32px 0 24px' }} />
      
      <Section>
        <Text style={{ color: textSecondary, fontSize: '12px', lineHeight: '1.6', margin: '0' }}>
          If you were not expecting this invitation, you can ignore this email, as the
          invitation will expire in 24 hours. If you are concerned about your account's safety,
          please reply to this email to get in touch with us.
        </Text>
      </Section>
    </Base>
  )
}

InviteUserEmail.PreviewProps = {
  inviteLink: 'https://mywebsite.com/app/invite?token=abc123ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'
} as InviteUserEmailProps

export default InviteUserEmail
