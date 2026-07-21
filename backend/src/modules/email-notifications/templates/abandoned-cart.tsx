import { Text, Section, Button, Row, Column, Img } from '@react-email/components'
import * as React from 'react'
import { Base, textPrimary, textSecondary, borderLight, bgDark, textLight, fontFamily } from './base'

export const ABANDONED_CART = 'abandoned-cart'

export interface AbandonedCartItem {
  title: string
  thumbnail?: string
  quantity: number
  total: string
}

export interface AbandonedCartTemplateProps {
  customerFirstName: string
  items: AbandonedCartItem[]
  cartTotal: string
  cartUrl: string
  preview?: string
  shopUrl?: string
}

export const isAbandonedCartTemplateData = (data: any): data is AbandonedCartTemplateProps =>
  typeof data.customerFirstName === 'string' &&
  Array.isArray(data.items) &&
  typeof data.cartUrl === 'string'

export const AbandonedCartTemplate: React.FC<AbandonedCartTemplateProps> & {
  PreviewProps: AbandonedCartTemplateProps
} = ({
  customerFirstName,
  items,
  cartTotal,
  cartUrl,
  preview = 'You left something in your cart',
}) => {
  return (
    <Base preview={preview}>
      <Section style={{ padding: '50px 40px 20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
        <Text style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 8px', color: textPrimary, textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
          Still thinking it over?
        </Text>
        <Text style={{ fontSize: '13px', fontWeight: '500', margin: '0', color: textSecondary, fontFamily }}>
          Hi {customerFirstName}, your cart is waiting for you.
        </Text>
      </Section>

      <Section style={{ padding: '20px 40px 10px', backgroundColor: '#ffffff' }}>
        <Section style={{ border: `1px solid ${borderLight}`, borderRadius: '12px', overflow: 'hidden' }}>
          {items.map((item, index) => (
            <Row key={index} style={{ padding: '16px', borderBottom: index < items.length - 1 ? `1px solid ${borderLight}` : undefined }}>
              <Column style={{ width: '64px' }}>
                {item.thumbnail && (
                  <Img src={item.thumbnail} width="56" height="56" alt={item.title} style={{ borderRadius: '8px', objectFit: 'cover' }} />
                )}
              </Column>
              <Column>
                <Text style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: textPrimary, fontFamily }}>
                  {item.title}
                </Text>
                <Text style={{ margin: '0', fontSize: '12px', color: textSecondary, fontFamily }}>
                  Qty {item.quantity}
                </Text>
              </Column>
              <Column style={{ textAlign: 'right', width: '90px' }}>
                <Text style={{ margin: '0', fontSize: '13px', fontWeight: '700', color: textPrimary, fontFamily }}>
                  {item.total}
                </Text>
              </Column>
            </Row>
          ))}
        </Section>

        <Row style={{ marginTop: '16px' }}>
          <Column style={{ textAlign: 'right' }}>
            <Text style={{ margin: '0', fontSize: '11px', color: textSecondary, textTransform: 'uppercase', letterSpacing: '1px', fontFamily }}>
              Cart total
            </Text>
            <Text style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '800', color: textPrimary, fontFamily }}>
              {cartTotal}
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={{ padding: '30px 40px 50px', textAlign: 'center', backgroundColor: '#ffffff' }}>
        <Button
          href={cartUrl}
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
            fontFamily,
          }}
        >
          RETURN TO YOUR CART
        </Button>
      </Section>
    </Base>
  )
}

AbandonedCartTemplate.PreviewProps = {
  customerFirstName: 'Nadun',
  items: [
    { title: 'Horizon Tote', quantity: 1, total: 'LKR 4,500.00', thumbnail: 'https://cardle.lk/cardle-premium-cotton-tote-bags-logo.png' },
  ],
  cartTotal: 'LKR 4,500.00',
  cartUrl: (process.env.STORE_URL || 'https://cardle.lk') + '/cart',
}

export default AbandonedCartTemplate
