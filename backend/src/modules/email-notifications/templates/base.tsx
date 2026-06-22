import { Html, Body, Container, Preview, Head, Section, Text, Link, Hr } from '@react-email/components'
import * as React from 'react'

interface BaseProps {
  preview?: string
  children: React.ReactNode
}

const bgLight = '#ffffff'
const textPrimary = '#111111'
const textSecondary = '#666666'
const borderLight = '#eaeaea'

export const Base: React.FC<BaseProps> = ({ preview, children }) => {
  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap');
          * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        `}</style>
      </Head>
      <Preview>{preview ?? 'Message from Cardle'}</Preview>
      <Body style={{ backgroundColor: '#fafafa', margin: '0', padding: '40px 0', WebkitFontSmoothing: 'antialiased' }}>

        <Container style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: bgLight,
          border: `1px solid ${borderLight}`,
        }}>

          {/* Header */}
          <Section style={{
            padding: '40px 40px 20px',
            textAlign: 'center',
          }}>
            <Text style={{
              color: textPrimary,
              fontSize: '18px',
              fontWeight: '500',
              margin: '0',
              letterSpacing: '4px',
              textTransform: 'uppercase',
            }}>
              Cardle
            </Text>
          </Section>

          {/* Body Content */}
          <Section style={{ padding: '20px 40px 40px', backgroundColor: bgLight }}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={{
            backgroundColor: '#fafafa',
            padding: '30px 40px',
            borderTop: `1px solid ${borderLight}`,
            textAlign: 'center',
          }}>
            <Text style={{ color: textSecondary, fontSize: '11px', margin: '0 0 8px', letterSpacing: '0.5px' }}>
              © {new Date().getFullYear()} CARDLE. ALL RIGHTS RESERVED.
            </Text>
            <Text style={{ color: textSecondary, fontSize: '11px', margin: '0', letterSpacing: '0.5px' }}>
              <Link href="mailto:orders@cardle.lk" style={{ color: textSecondary, textDecoration: 'underline' }}>
                orders@cardle.lk
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

export { bgLight, textPrimary, textSecondary, borderLight }
