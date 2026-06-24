import { Text, Section, Hr, Img } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight, bgDark, textLight, fontFamily } from './base'

export const CONTACT_AUTO_REPLY = 'contact-auto-reply'

export interface ContactAutoReplyTemplateData {
  customerName: string
  referenceNumber: string
  preview?: string
  shopUrl?: string
}

export function isContactAutoReplyTemplateData(data: any): data is ContactAutoReplyTemplateData {
  return typeof data === 'object' && data !== null && 'customerName' in data && 'referenceNumber' in data
}

export const ContactAutoReplyTemplate: React.FC<ContactAutoReplyTemplateData> = ({
  customerName,
  referenceNumber,
  preview = 'We have received your message',
  shopUrl = 'https://storefront-production-66a1.up.railway.app'
}) => {
  return (
    <Base preview={preview}>
      {/* Hero Image */}
      <Section style={{ position: 'relative', textAlign: 'center', backgroundColor: '#e5e5e5' }}>
        <Img 
          src="https://images.unsplash.com/photo-1596526131083-e8c633c948d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
          width="600" 
          height="200" 
          style={{ objectFit: 'cover', display: 'block' }}
          alt="Contact Received" 
        />
        <Section style={{ padding: '30px 20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <Text style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 5px', color: textPrimary, textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            WE'RE ON IT
          </Text>
          <Text style={{ fontSize: '12px', fontWeight: '500', margin: '0', color: textSecondary, letterSpacing: '1px', fontFamily }}>
            MESSAGE RECEIVED LOUD AND CLEAR
          </Text>
        </Section>
      </Section>

      <Section style={{ padding: '20px 40px 40px', backgroundColor: '#ffffff', textAlign: 'center' }}>
        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0 0 24px', lineHeight: '1.6', fontFamily }}>
          Dear <span style={{ fontWeight: '600', color: textPrimary }}>{customerName}</span>,<br/><br/>
          Thank you for getting in touch with us. This is an automated response to confirm that we have safely received your inquiry.
        </Text>

        <Text style={{ color: textSecondary, fontSize: '13px', margin: '0 0 32px', lineHeight: '1.6', fontFamily }}>
          Our team will review your message and reply as soon as possible. Please allow <span style={{ fontWeight: '600', color: textPrimary }}>24-48 hours</span> for a response.
        </Text>

        <Section style={{ 
          border: `1px solid ${borderLight}`, 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '24px',
          backgroundColor: '#fafafa',
          textAlign: 'center'
        }}>
          <Text style={{ fontSize: '11px', color: textSecondary, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            Your Reference Number
          </Text>
          <Text style={{ fontSize: '18px', color: textPrimary, fontWeight: '800', margin: '0', letterSpacing: '2px', fontFamily }}>
            {referenceNumber}
          </Text>
        </Section>

        <Hr style={{ borderColor: borderLight, margin: '0 0 24px' }} />

        <Text style={{ fontSize: '11px', color: textSecondary, margin: '0', textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
          HAVE ADDITIONAL INFORMATION? YOU CAN REPLY DIRECTLY TO THIS EMAIL.
        </Text>
      </Section>
    </Base>
  )
}
