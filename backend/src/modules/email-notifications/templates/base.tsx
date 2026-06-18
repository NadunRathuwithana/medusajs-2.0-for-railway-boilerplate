import { Html, Body, Container, Preview, Head, Section, Text, Hr, Img, Link } from '@react-email/components'
import * as React from 'react'

interface BaseProps {
  preview?: string
  children: React.ReactNode
}

const brandColor = '#1a1a2e'
const accentColor = '#e94560'
const lightGray = '#f8f9fa'
const textDark = '#1a1a1a'
const textMuted = '#6b7280'

export const Base: React.FC<BaseProps> = ({ preview, children }) => {
  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        `}</style>
      </Head>
      <Preview>{preview ?? ''}</Preview>
      <Body style={{ backgroundColor: '#f1f5f9', margin: '0', padding: '20px 0' }}>

        {/* Email Wrapper */}
        <Container style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>

          {/* Header */}
          <Section style={{
            background: `linear-gradient(135deg, ${brandColor} 0%, #16213e 100%)`,
            padding: '32px 40px',
            textAlign: 'center',
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: '700',
              margin: '0',
              letterSpacing: '-0.5px',
            }}>
              🛍️ Theek.lk
            </Text>
            <Text style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '12px',
              margin: '4px 0 0',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              Your Trusted Online Store
            </Text>
          </Section>

          {/* Body Content */}
          <Section style={{ padding: '40px', backgroundColor: '#ffffff' }}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={{
            backgroundColor: lightGray,
            padding: '24px 40px',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
          }}>
            <Text style={{ color: textMuted, fontSize: '12px', margin: '0 0 8px' }}>
              © {new Date().getFullYear()} Theek.lk. All rights reserved.
            </Text>
            <Text style={{ color: textMuted, fontSize: '12px', margin: '0' }}>
              If you have questions, contact us at{' '}
              <Link href="mailto:nadunrathuwithanaproductions@gmail.com" style={{ color: accentColor, textDecoration: 'none' }}>
                support@theek.lk
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

export { brandColor, accentColor, lightGray, textDark, textMuted }
