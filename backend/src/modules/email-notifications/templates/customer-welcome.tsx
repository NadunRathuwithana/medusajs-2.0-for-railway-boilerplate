import { Text, Section, Button, Row, Column, Img } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, bgDark, textLight, fontFamily } from './base'

export const CUSTOMER_WELCOME = 'customer-welcome'

export interface CustomerWelcomeTemplateProps {
  customerFirstName: string
  customerEmail: string
  shopUrl?: string
  preview?: string
}

export const isCustomerWelcomeTemplateData = (data: any): data is CustomerWelcomeTemplateProps =>
  typeof data.customerFirstName === 'string' && typeof data.customerEmail === 'string'

export const CustomerWelcomeTemplate: React.FC<CustomerWelcomeTemplateProps> & {
  PreviewProps: CustomerWelcomeTemplateProps
} = ({ customerFirstName, customerEmail, shopUrl = process.env.STORE_URL || 'https://cardle.lk', preview = 'Welcome to Cardle' }) => {
  return (
    <Base preview={preview}>
      
      {/* Hero Section */}
      <Section style={{ position: 'relative', textAlign: 'center', backgroundColor: '#e5e5e5' }}>
        <Img 
          src={`${shopUrl}/email/hero1.jpg`} 
          // src={`http://localhost:8000/email/hero1.jpg`} 
          width="600" 
          height="450" 
          style={{ objectFit: 'cover', display: 'block' }}
          alt="Welcome to Cardle" 
        />
        <Section style={{ padding: '30px 20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <Text style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 5px', color: textPrimary, textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
            WELCOME
          </Text>
          <Text style={{ fontSize: '14px', fontWeight: '500', margin: '0', color: textPrimary, letterSpacing: '2px', textTransform: 'uppercase', fontFamily }}>
            TO THE <span style={{ fontWeight: '800', fontFamily }}>CARDLE</span> FAMILY
          </Text>
        </Section>
      </Section>

      {/* 10% OFF Section */}
      <Section style={{ padding: '20px 40px 40px', textAlign: 'center', backgroundColor: '#ffffff' }}>
        <Text style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 10px', color: textPrimary, textTransform: 'uppercase', letterSpacing: '-0.5px', fontFamily }}>
          ENJOY 10% OFF
        </Text>
        <Text style={{ fontSize: '14px', fontWeight: '500', margin: '0 0 20px', color: textPrimary, fontFamily }}>
          your next purchase <span style={{ color: '#d9534f', fontFamily }}>with code:</span>
        </Text>
        <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Text style={{ 
            display: 'inline-block', 
            backgroundColor: '#8ea696', 
            borderRadius: '20px', 
            padding: '8px 20px',
            fontSize: '14px', 
            fontWeight: '700', 
            color: textLight, 
            margin: '0', 
            letterSpacing: '1px',
            fontFamily
          }}>
            WELCOME10
          </Text>
        </Section>
        <Text style={{ fontSize: '12px', color: textSecondary, margin: '0 auto 30px', lineHeight: '1.6', maxWidth: '400px', fontFamily }}>
          Thanks for joining us, {customerFirstName}! Now that you're officially part of the family, keep an eye on your inbox for VIP early access to new arrivals, exclusive discounts, and more!
        </Text>
        <Button
          href={shopUrl}
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
            fontFamily
          }}
        >
          SAVE 10% NOW
        </Button>
      </Section>

      {/* Fan Favorites Section */}
      <Section style={{ padding: '0 20px 40px', backgroundColor: '#ffffff' }}>
        <Section style={{ backgroundColor: '#F8F7F4', borderRadius: '30px', overflow: 'hidden' }}>
          <Row>
            <Column style={{ width: '50%', padding: '40px 30px', verticalAlign: 'middle' }}>
              <Text style={{ fontSize: '10px', fontWeight: '600', margin: '0 0 8px', color: '#888888', letterSpacing: '2px', textTransform: 'uppercase', fontFamily }}>
                Curated Picks
              </Text>
              <Text style={{ fontSize: '26px', fontWeight: '400', margin: '0 0 16px', color: '#111111', fontFamily, letterSpacing: '-0.5px' }}>
                <span style={{ fontWeight: '800' }}>Fan</span> Favorites
              </Text>
              <Text style={{ fontSize: '13px', color: '#555555', margin: '0 0 30px', lineHeight: '1.6', fontFamily }}>
                These signature styles have absolute "add-to-cart" energy. Discover the pieces everyone is talking about.
              </Text>
              <Button
                href={`https://cardle.lk/lk/store`}
                style={{
                  backgroundColor: '#111111',
                  color: '#ffffff',
                  padding: '12px 24px',
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  display: 'inline-block',
                  borderRadius: '30px',
                  fontFamily
                }}
              >
                Shop Now
              </Button>
            </Column>
            <Column style={{ width: '50%', verticalAlign: 'middle', padding: '0' }}>
              <Img 
                src={`${shopUrl}/email/fav.jpg`}
                // src={`http://localhost:8000/email/fav.jpg`} 
                width="280" 
                height="380" 
                style={{ objectFit: 'cover', display: 'block', borderRadius: '0 30px 30px 0' }}
                alt="Fan favorites tote bag" 
              />
            </Column>
          </Row>
        </Section>
      </Section>



    </Base>
  )
}

CustomerWelcomeTemplate.PreviewProps = {
  customerFirstName: 'Nadun',
  customerEmail: 'nadun@example.com',
  shopUrl: process.env.STORE_URL || 'https://cardle.lk',
}

export default CustomerWelcomeTemplate
