import { ReactNode } from 'react'
import { MedusaError } from '@medusajs/framework/utils'

import { InviteUserEmail, INVITE_USER, isInviteUserData } from './invite-user'
import { OrderPlacedTemplate, ORDER_PLACED, isOrderPlacedTemplateData } from './order-placed'
import { OrderShippedTemplate, ORDER_SHIPPED, isOrderShippedTemplateData } from './order-shipped'
import { OrderCancelledTemplate, ORDER_CANCELLED, isOrderCancelledTemplateData } from './order-cancelled'
import { OrderRefundTemplate, ORDER_REFUND, isOrderRefundTemplateData } from './order-refund'
import { CustomerWelcomeTemplate, CUSTOMER_WELCOME, isCustomerWelcomeTemplateData } from './customer-welcome'
import { PasswordResetTemplate, PASSWORD_RESET, isPasswordResetTemplateData } from './password-reset'
import { ContactFormTemplate, CONTACT_FORM, isContactFormTemplateData } from './contact-form'
import { ContactAutoReplyTemplate, CONTACT_AUTO_REPLY, isContactAutoReplyTemplateData } from './contact-auto-reply'
import { PaymentFailedTemplate, PAYMENT_FAILED, isPaymentFailedTemplateData } from './payment-failed'
import { AbandonedCartTemplate, ABANDONED_CART, isAbandonedCartTemplateData } from './abandoned-cart'

export const EmailTemplates = {
  INVITE_USER,
  ORDER_PLACED,
  ORDER_SHIPPED,
  ORDER_CANCELLED,
  ORDER_REFUND,
  CUSTOMER_WELCOME,
  PASSWORD_RESET,
  CONTACT_FORM,
  CONTACT_AUTO_REPLY,
  PAYMENT_FAILED,
  ABANDONED_CART,
} as const

export type EmailTemplateType = keyof typeof EmailTemplates

export function generateEmailTemplate(templateKey: string, data: unknown): ReactNode {
  switch (templateKey) {
    case EmailTemplates.INVITE_USER:
      if (!isInviteUserData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.INVITE_USER}"`)
      }
      return <InviteUserEmail {...data} />

    case EmailTemplates.ORDER_PLACED:
      if (!isOrderPlacedTemplateData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.ORDER_PLACED}"`)
      }
      return <OrderPlacedTemplate {...data} />

    case EmailTemplates.ORDER_SHIPPED:
      if (!isOrderShippedTemplateData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.ORDER_SHIPPED}"`)
      }
      return <OrderShippedTemplate {...data} />

    case EmailTemplates.ORDER_CANCELLED:
      if (!isOrderCancelledTemplateData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.ORDER_CANCELLED}"`)
      }
      return <OrderCancelledTemplate {...data} />

    case EmailTemplates.ORDER_REFUND:
      if (!isOrderRefundTemplateData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.ORDER_REFUND}"`)
      }
      return <OrderRefundTemplate {...data} />

    case EmailTemplates.CUSTOMER_WELCOME:
      if (!isCustomerWelcomeTemplateData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.CUSTOMER_WELCOME}"`)
      }
      return <CustomerWelcomeTemplate {...data} />

    case EmailTemplates.PASSWORD_RESET:
      if (!isPasswordResetTemplateData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.PASSWORD_RESET}"`)
      }
      return <PasswordResetTemplate {...data} />

    case EmailTemplates.CONTACT_FORM:
      if (!isContactFormTemplateData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.CONTACT_FORM}"`)
      }
      return <ContactFormTemplate {...data} />

    case EmailTemplates.CONTACT_AUTO_REPLY:
      if (!isContactAutoReplyTemplateData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.CONTACT_AUTO_REPLY}"`)
      }
      return <ContactAutoReplyTemplate {...data} />

    case EmailTemplates.PAYMENT_FAILED:
      if (!isPaymentFailedTemplateData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.PAYMENT_FAILED}"`)
      }
      return <PaymentFailedTemplate {...data} />

    case EmailTemplates.ABANDONED_CART:
      if (!isAbandonedCartTemplateData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.ABANDONED_CART}"`)
      }
      return <AbandonedCartTemplate {...data} />

    default:
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Unknown template key: "${templateKey}"`)
  }
}

export {
  InviteUserEmail,
  OrderPlacedTemplate,
  OrderShippedTemplate,
  OrderCancelledTemplate,
  OrderRefundTemplate,
  CustomerWelcomeTemplate,
  PasswordResetTemplate,
  ContactFormTemplate,
  ContactAutoReplyTemplate,
  PaymentFailedTemplate,
  AbandonedCartTemplate,
}
