import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, ICustomerModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  let notificationModuleService: INotificationModuleService | undefined;
  try {
    notificationModuleService = container.resolve(Modules.NOTIFICATION);
  } catch (err) {}
  const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)

  try {
    const customer = await customerModuleService.retrieveCustomer(data.id)

    if (!customer?.email) return

    if (notificationModuleService) await notificationModuleService.createNotifications({
      to: customer.email,
      channel: 'email',
      template: EmailTemplates.CUSTOMER_WELCOME,
      data: {
        emailOptions: {
          replyTo: 'hello@cardle.lk',
          subject: 'Welcome to Cardle!',
        },
        customerFirstName: customer.first_name ?? 'Customer',
        customerEmail: customer.email,
        shopUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://cardle.lk',
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
