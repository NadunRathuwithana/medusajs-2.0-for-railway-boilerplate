import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { Base, accentColor, textDark, textMuted } from './base'

export const CONTACT_FORM = 'contact-form'

export interface ContactFormTemplateProps {
  senderName: string
  senderEmail: string
  subject: string
  message: string
  submittedAt?: string
  preview?: string
}

export const isContactFormTemplateData = (data: any): data is ContactFormTemplateProps =>
  typeof data.senderName === 'string' &&
  typeof data.senderEmail === 'string' &&
  typeof data.message === 'string'

export const ContactFormTemplate: React.FC<ContactFormTemplateProps> & {
  PreviewProps: ContactFormTemplateProps
} = ({ senderName, senderEmail, subject, message, submittedAt, preview }) => {
  return (
    <Base preview={preview ?? `New contact form message from ${senderName}`}>
      <Section style={{ textAlign: 'center', marginBottom: '28px' }}>
        <Text style={{ fontSize: '42px', margin: '0 0 12px' }}>📬</Text>
        <Text style={{
          fontSize: '24px',
          fontWeight: '700',
          color: textDark,
          margin: '0 0 6px',
          letterSpacing: '-0.5px',
        }}>
          New Contact Form Submission
        </Text>
        <Text style={{ color: textMuted, fontSize: '14px', margin: '0' }}>
          Someone has submitted a message via the contact form.
        </Text>
      </Section>

      {/* Sender Info */}
      <Section style={{
        backgroundColor: '#fafbff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '20px 24px',
        marginBottom: '24px',
      }}>
        <Text style={{ fontWeight: '600', fontSize: '13px', color: textMuted, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Sender Details
        </Text>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '5px 0', color: textMuted, fontSize: '14px', width: '100px' }}>Name</td>
              <td style={{ padding: '5px 0', fontWeight: '600', fontSize: '14px', color: textDark }}>{senderName}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0', color: textMuted, fontSize: '14px' }}>Email</td>
              <td style={{ padding: '5px 0', fontWeight: '600', fontSize: '14px', color: accentColor }}>{senderEmail}</td>
            </tr>
            {subject && (
              <tr>
                <td style={{ padding: '5px 0', color: textMuted, fontSize: '14px' }}>Subject</td>
                <td style={{ padding: '5px 0', fontWeight: '600', fontSize: '14px', color: textDark }}>{subject}</td>
              </tr>
            )}
            {submittedAt && (
              <tr>
                <td style={{ padding: '5px 0', color: textMuted, fontSize: '14px' }}>Submitted</td>
                <td style={{ padding: '5px 0', fontSize: '14px', color: textMuted }}>{submittedAt}</td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      {/* Message */}
      <Section style={{ marginBottom: '24px' }}>
        <Text style={{ fontWeight: '600', fontSize: '13px', color: textMuted, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Message
        </Text>
        <Section style={{
          backgroundColor: '#f8f9fa',
          borderLeft: `4px solid ${accentColor}`,
          padding: '16px 20px',
          borderRadius: '0 8px 8px 0',
        }}>
          <Text style={{ fontSize: '14px', color: textDark, margin: '0', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
            {message}
          </Text>
        </Section>
      </Section>

      <Hr style={{ borderColor: '#e5e7eb', margin: '0 0 20px' }} />

      <Text style={{ fontSize: '13px', color: textMuted, margin: '0' }}>
        Reply directly to this email to respond to {senderName} at {senderEmail}.
      </Text>
    </Base>
  )
}

ContactFormTemplate.PreviewProps = {
  senderName: 'John Customer',
  senderEmail: 'john@example.com',
  subject: 'Question about my order',
  message: 'Hi, I placed an order 3 days ago but haven\'t received a shipping confirmation yet. Could you please check the status of my order ORD-123?',
  submittedAt: new Date().toLocaleString(),
}

export default ContactFormTemplate
