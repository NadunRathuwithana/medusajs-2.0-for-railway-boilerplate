import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, ICustomerModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
  const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)

  try {
    const customer = await customerModuleService.retrieveCustomer(data.id)

    if (!customer?.email) return

    await notificationModuleService.createNotifications({
      to: customer.email,
      channel: 'email',
      template: EmailTemplates.CUSTOMER_WELCOME,
      data: {
        emailOptions: {
          replyTo: 'nadunrathuwithanaproductions@gmail.com',
          subject: '🎉 Welcome to Theek.lk!',
        },
        customerFirstName: customer.first_name ?? 'Customer',
        customerEmail: customer.email,
        shopUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://theek.lk',
        preview: 'Welcome! Your account has been created.',
      },
    })
  } catch (error) {
    console.error('[Email] Error sending welcome email:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'customer.created',
}
