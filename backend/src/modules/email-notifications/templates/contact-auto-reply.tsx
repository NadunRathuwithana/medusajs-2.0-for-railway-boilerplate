import { Text, Hr } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight } from './base'

export const CONTACT_AUTO_REPLY = 'contact-auto-reply'

export interface ContactAutoReplyTemplateData {
  customerName: string
  referenceNumber: string
  preview?: string
  emailOptions?: any
}

export function isContactAutoReplyTemplateData(data: any): data is ContactAutoReplyTemplateData {
  return typeof data === 'object' && data !== null && 'customerName' in data && 'referenceNumber' in data
}

export const ContactAutoReplyTemplate: React.FC<ContactAutoReplyTemplateData> = ({
  customerName,
  referenceNumber,
  preview = 'We have received your message',
}) => {
  return (
    <Base preview={preview}>
      <Text style={{ fontSize: '14px', color: textPrimary, lineHeight: '1.6', marginBottom: '24px' }}>
        Dear {customerName},
      </Text>
      
      <Text style={{ fontSize: '14px', color: textPrimary, lineHeight: '1.6', marginBottom: '24px' }}>
        Thank you for getting in touch with us. This is an automated response to confirm that we have safely received your inquiry.
      </Text>

      <Text style={{ fontSize: '14px', color: textPrimary, lineHeight: '1.6', marginBottom: '32px' }}>
        Our team will review your message and reply as soon as possible. Please allow <strong>24-48 hours</strong> for a response.
      </Text>

      <Hr style={{ borderColor: borderLight, margin: '32px 0' }} />

      <Text style={{ fontSize: '12px', color: textSecondary, margin: '0', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Reference Number
      </Text>
      <Text style={{ fontSize: '16px', color: textPrimary, fontWeight: '500', margin: '4px 0 0' }}>
        {referenceNumber}
      </Text>
    </Base>
  )
}
