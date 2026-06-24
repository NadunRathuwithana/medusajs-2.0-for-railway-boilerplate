import { Html, Body, Container, Preview, Head, Section, Text, Link, Hr, Row, Column, Img } from '@react-email/components'
import * as React from 'react'

interface BaseProps {
  preview?: string
  children: React.ReactNode
}

const bgLight = '#ffffff'
const textPrimary = '#111111'
const textSecondary = '#666666'
const borderLight = '#eaeaea'
const bgDark = '#000000'
const textLight = '#ffffff'

const fontFamily = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export const Base: React.FC<BaseProps> = ({ preview, children }) => {
  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,700;0,800;1,800&display=swap');
          * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important; }
        `}</style>
      </Head>
      <Preview>{preview ?? 'Message from Cardle'}</Preview>
      <Body style={{ backgroundColor: '#fafafa', margin: '0', padding: '40px 0', WebkitFontSmoothing: 'antialiased', fontFamily }}>
        <Container style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: bgLight,
          overflow: 'hidden',
          fontFamily,
        }}>
          {/* Header */}
          <Section style={{ padding: '20px 30px', textAlign: 'center' }}>
            <Row>
              <Column style={{ width: '25%', textAlign: 'left' }}>
                <Link href="https://storefront-production-66a1.up.railway.app/lk">
                  <Img src="https://storefront-production-66a1.up.railway.app/cardle-premium-cotton-tote-bags-logo.png" width="100" alt="Cardle Logo" style={{ display: 'block' }} />
                </Link>
              </Column>
              <Column style={{ width: '75%', textAlign: 'right' }}>
                <Text style={{ margin: '0', fontSize: '9px', fontWeight: '500', letterSpacing: '1px', fontFamily }}>
                  <Link href="https://storefront-production-66a1.up.railway.app/lk/tote-bags" style={{ color: textPrimary, textDecoration: 'none', margin: '0 6px', fontFamily }}>TOTE BAGS</Link> |
                  <Link href="https://storefront-production-66a1.up.railway.app/lk/best-sellers" style={{ color: textPrimary, textDecoration: 'none', margin: '0 6px', fontFamily }}>BEST SELLERS</Link> |
                  <Link href="https://storefront-production-66a1.up.railway.app/lk/new" style={{ color: textPrimary, textDecoration: 'none', margin: '0 6px', fontFamily }}>NEW ARRIVALS</Link> |
                  <Link href="https://storefront-production-66a1.up.railway.app/lk/custom" style={{ color: textPrimary, textDecoration: 'none', margin: '0 0 0 6px', fontFamily }}>CUSTOM</Link>
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Black Banner underneath header */}
          <Section style={{ backgroundColor: bgDark, padding: '10px 0', textAlign: 'center' }}>
            <Text style={{ color: textLight, fontSize: '9px', margin: '0', fontWeight: '500', letterSpacing: '1px', textTransform: 'uppercase', fontFamily }}>
              PREMIUM HANDCRAFTED BAGS &nbsp;&nbsp;|&nbsp;&nbsp; MADE IN SRI LANKA
            </Text>
          </Section>

          {/* Body Content */}
          {children}

          {/* Footer Starts Here */}
          {/* Green Sustainability Banner */}
          <Section style={{ backgroundColor: '#8ea696', padding: '12px 0', textAlign: 'center' }}>
            <Text style={{ color: textLight, fontSize: '10px', margin: '0', letterSpacing: '1px', fontFamily }}>
              Cotton tote bags sustainably <span style={{ fontFamily }}>handcrafted in Sri Lanka</span>
            </Text>
          </Section>



          {/* Brand Explanation */}
          <Section style={{ backgroundColor: '#f2f2f2', padding: '30px 40px' }}>
            <Row>
              <Column>
                <Text style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', color: textPrimary, fontFamily }}>
                  Cardle
                </Text>
                <Text style={{ margin: '0', fontSize: '10px', color: textSecondary, lineHeight: '1.6', fontFamily }}>
                  Cardle is dedicated to creating premium, handcrafted cotton tote bags. Made with passion in Sri Lanka, we combine sustainable materials with minimalist design to bring you everyday essentials you'll love.
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Bottom Footer */}
          <Section style={{ backgroundColor: bgDark, padding: '40px', textAlign: 'center' }}>
            <Text style={{ color: textLight, fontSize: '10px', margin: '0 0 20px', letterSpacing: '1px', fontWeight: '500', fontFamily }}>
              CONNECT WITH US:
            </Text>
            {/* Social Icons Placeholder */}
            <Section style={{ textAlign: 'center', marginBottom: '30px' }}>
              <Link href="#" style={{ margin: '0 10px', display: 'inline-block' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </Link>
              <Link href="#" style={{ margin: '0 10px', display: 'inline-block' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </Link>
              <Link href="#" style={{ margin: '0 10px', display: 'inline-block' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.95v5.25c-.01 3.99-3.4 7.42-7.39 7.41-3.99-.01-7.4-3.4-7.41-7.4-.01-4 3.4-7.42 7.4-7.41 1.05.01 2.08.26 3.03.73v4.21c-.81-.46-1.74-.69-2.67-.67-2.18.04-3.98 1.84-3.95 4.02.04 2.18 1.85 3.98 4.04 3.94 2.18-.04 3.97-1.85 3.93-4.04V.02h-1.06z"/>
                </svg>
              </Link>
            </Section>
            
            <Text style={{ color: '#888888', fontSize: '10px', margin: '0 0 4px', fontFamily }}>
              © Cardle {new Date().getFullYear()}
            </Text>
            <Text style={{ color: '#888888', fontSize: '10px', margin: '0 0 20px', fontFamily }}>
              Sri Lanka
            </Text>

            <Text style={{ margin: '0', fontSize: '10px', fontWeight: '500', letterSpacing: '1px', fontFamily }}>
               <Link href="#" style={{ color: textLight, textDecoration: 'none', margin: '0 6px', fontFamily }}>CONTACT</Link> |
               <Link href="#" style={{ color: textLight, textDecoration: 'none', margin: '0 6px', fontFamily }}>ABOUT</Link> |
               <Link href="#" style={{ color: textLight, textDecoration: 'none', margin: '0 0 0 6px', fontFamily }}>UNSUBSCRIBE</Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

export { bgLight, textPrimary, textSecondary, borderLight, bgDark, textLight, fontFamily }
