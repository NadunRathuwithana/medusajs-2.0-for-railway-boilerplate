import { Button, Link, Section, Text, Hr, Img } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight, bgDark, textLight, fontFamily } from './base'

export const INVITE_USER = 'invite-user'

export interface InviteUserEmailProps {
  inviteLink: string
  preview?: string
}

export const isInviteUserData = (data: any): data is InviteUserEmailProps =>
  typeof data.inviteLink === 'string' && (typeof data.preview === 'string' || !data.preview)

export const InviteUserEmail = ({
  inviteLink,
  preview = `You've been invited to Cardle Admin`,
}: InviteUserEmailProps) => {
  return (
    <Base preview={preview}>
      {/* Hero Image */}
      <Section style={{ position: 'relative', textAlign: 'center', backgroundColor: '#e5e5e5' }}>
        <Img 
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
          width="600" 
          height="200" 
          style={{ objectFit: 'cover', display: 'block' }}
          alt="Admin Invitation" 
        />
        <Section style={{ padding: '30px 20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <Text style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 5px', color: textPrimary, textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            ADMIN INVITATION
          </Text>
          <Text style={{ fontSize: '12px', fontWeight: '500', margin: '0', color: textSecondary, letterSpacing: '1px', fontFamily }}>
            JOIN THE CARDLE TEAM
          </Text>
        </Section>
      </Section>

      <Section style={{ padding: '20px 40px 40px', backgroundColor: '#ffffff', textAlign: 'center' }}>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0 0 32px', lineHeight: '1.6', fontFamily }}>
          You have been invited to join the <span style={{ fontWeight: '600', color: textPrimary }}>Cardle</span> team as an administrator. 
          Please click the button below to accept your invitation and set up your account.
        </Text>

        <Button
          href={inviteLink}
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
            marginBottom: '24px',
            fontFamily
          }}
        >
          ACCEPT INVITATION
        </Button>

        <Text style={{ color: textSecondary, fontSize: '11px', margin: '0 0 8px', fontFamily }}>
          or copy and paste this URL into your browser:
        </Text>
        <Text style={{
          color: textSecondary,
          fontSize: '11px',
          maxWidth: '100%',
          wordBreak: 'break-all',
          overflowWrap: 'break-word',
          margin: '0 0 32px',
          fontFamily
        }}>
          <Link
            href={inviteLink}
            style={{ color: textPrimary, textDecoration: 'underline' }}
          >
            {inviteLink}
          </Link>
        </Text>

        <Hr style={{ borderColor: borderLight, margin: '0 0 24px' }} />
        
        <Text style={{ color: textSecondary, fontSize: '11px', lineHeight: '1.6', margin: '0', fontFamily }}>
          If you were not expecting this invitation, you can ignore this email. The invitation will expire in 24 hours.
        </Text>
      </Section>
    </Base>
  )
}

InviteUserEmail.PreviewProps = {
  inviteLink: 'https://storefront-production-66a1.up.railway.app/app/invite?token=abc123ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'
} as InviteUserEmailProps

export default InviteUserEmail
