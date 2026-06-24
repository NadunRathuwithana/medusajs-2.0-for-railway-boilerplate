import { Text, Section, Hr, Img } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight, fontFamily } from './base'

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
      <Section style={{ padding: '30px 40px 10px', backgroundColor: '#ffffff', textAlign: 'center' }}>
        <Text style={{
          fontSize: '20px',
          fontWeight: '800',
          color: textPrimary,
          margin: '0 0 8px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontFamily
        }}>
          NEW SUBMISSION
        </Text>
        <Text style={{ color: textSecondary, fontSize: '11px', margin: '0', textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
          REFERENCE: <span style={{ fontWeight: '700', color: textPrimary }}>{referenceNumber}</span>
        </Text>
      </Section>

      <Section style={{ padding: '20px 40px 40px', backgroundColor: '#ffffff' }}>
        {/* Sender Info Card */}
        <Section style={{ 
          border: `1px solid ${borderLight}`, 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '24px',
          backgroundColor: '#fafafa'
        }}>
          <Text style={{ fontSize: '12px', fontWeight: '800', color: textPrimary, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            Sender Details
          </Text>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily }}>
            <tbody>
              <tr>
                <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', width: '120px', textTransform: 'uppercase', letterSpacing: '1px' }}>Name</td>
                <td style={{ padding: '6px 0', fontSize: '13px', fontWeight: '600', color: textPrimary }}>{senderName}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', width: '120px', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</td>
                <td style={{ padding: '6px 0', fontSize: '13px', fontWeight: '600', color: textPrimary }}>
                  <a href={`mailto:${senderEmail}`} style={{ color: textPrimary, textDecoration: 'underline' }}>{senderEmail}</a>
                </td>
              </tr>
              {subject && (
                <tr>
                  <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', width: '120px', textTransform: 'uppercase', letterSpacing: '1px' }}>Subject</td>
                  <td style={{ padding: '6px 0', fontSize: '13px', fontWeight: '600', color: textPrimary }}>{subject}</td>
                </tr>
              )}
              {submittedAt && (
                <tr>
                  <td style={{ padding: '6px 0', color: textSecondary, fontSize: '11px', width: '120px', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</td>
                  <td style={{ padding: '6px 0', fontSize: '13px', fontWeight: '500', color: textPrimary }}>{submittedAt}</td>
                </tr>
              )}
            </tbody>
          </table>
        </Section>

        {/* Message Card */}
        <Section style={{ 
          border: `1px solid ${borderLight}`, 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '32px',
          backgroundColor: '#ffffff'
        }}>
          <Text style={{ fontSize: '12px', fontWeight: '800', color: textPrimary, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            Message
          </Text>
          <Text style={{ fontSize: '14px', color: textSecondary, margin: '0', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily }}>
            {message}
          </Text>
        </Section>

        <Hr style={{ borderColor: borderLight, margin: '0 0 24px' }} />

        <Text style={{ fontSize: '11px', color: textSecondary, margin: '0', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', fontFamily }}>
          REPLY DIRECTLY TO THIS EMAIL TO RESPOND TO THE CUSTOMER.
        </Text>
      </Section>
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
