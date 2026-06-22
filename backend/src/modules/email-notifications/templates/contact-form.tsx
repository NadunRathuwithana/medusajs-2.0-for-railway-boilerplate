import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight } from './base'

export const CONTACT_FORM = 'contact-form'

export interface ContactFormTemplateProps {
  referenceNumber: string
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
  typeof data.message === 'string' &&
  typeof data.referenceNumber === 'string'

export const ContactFormTemplate: React.FC<ContactFormTemplateProps> & {
  PreviewProps: ContactFormTemplateProps
} = ({ referenceNumber, senderName, senderEmail, subject, message, submittedAt, preview }) => {
  return (
    <Base preview={preview ?? `New contact form message: ${referenceNumber}`}>
      <Section style={{ marginBottom: '32px' }}>
        <Text style={{
          fontSize: '14px',
          fontWeight: '500',
          color: textPrimary,
          margin: '0 0 8px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          New Submission
        </Text>
        <Text style={{ color: textSecondary, fontSize: '12px', margin: '0' }}>
          Reference: {referenceNumber}
        </Text>
      </Section>

      <Hr style={{ borderColor: borderLight, margin: '0 0 24px' }} />

      {/* Sender Info */}
      <Section style={{ marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', color: textSecondary, fontSize: '12px', width: '120px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</td>
              <td style={{ padding: '8px 0', fontSize: '13px', color: textPrimary }}>{senderName}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</td>
              <td style={{ padding: '8px 0', fontSize: '13px', color: textPrimary }}>{senderEmail}</td>
            </tr>
            {subject && (
              <tr>
                <td style={{ padding: '8px 0', color: textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subject</td>
                <td style={{ padding: '8px 0', fontSize: '13px', color: textPrimary }}>{subject}</td>
              </tr>
            )}
            {submittedAt && (
              <tr>
                <td style={{ padding: '8px 0', color: textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</td>
                <td style={{ padding: '8px 0', fontSize: '13px', color: textPrimary }}>{submittedAt}</td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      {/* Message */}
      <Section style={{ marginBottom: '24px' }}>
        <Text style={{ fontSize: '12px', color: textSecondary, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Message
        </Text>
        <Section style={{
          borderLeft: `2px solid ${borderLight}`,
          padding: '4px 0 4px 16px',
        }}>
          <Text style={{ fontSize: '14px', color: textPrimary, margin: '0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {message}
          </Text>
        </Section>
      </Section>

      <Hr style={{ borderColor: borderLight, margin: '32px 0 24px' }} />

      <Text style={{ fontSize: '12px', color: textSecondary, margin: '0' }}>
        Reply directly to this email to respond to the customer.
      </Text>
    </Base>
  )
}

ContactFormTemplate.PreviewProps = {
  referenceNumber: 'CF-12345',
  senderName: 'John Customer',
  senderEmail: 'john@example.com',
  subject: 'Question about my order',
  message: "Hi, I placed an order 3 days ago but haven't received a shipping confirmation yet. Could you please check the status of my order ORD-123?",
  submittedAt: new Date().toLocaleString(),
}

export default ContactFormTemplate
