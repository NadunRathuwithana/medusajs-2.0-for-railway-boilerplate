import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { BACKEND_URL } from '../lib/constants'

/**
 * Handles the auth.password_reset event to send password reset emails.
 * Event data contains: email, token, firstName
 */
export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)

  try {
    const { email, token, first_name } = data

    if (!email || !token) {
      console.warn('[Email] Missing email or token in password reset event')
      return
    }

    const storeFrontUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://theek.lk'
    const resetLink = `${storeFrontUrl}/account/reset-password?token=${token}&email=${encodeURIComponent(email)}`

    await notificationModuleService.createNotifications({
      to: email,
      channel: 'email',
      template: EmailTemplates.PASSWORD_RESET,
      data: {
        emailOptions: {
          replyTo: 'hello@cardle.lk',
          subject: '🔒 Reset Your Theek.lk Password',
        },
        customerFirstName: first_name ?? 'Customer',
        resetLink,
        expiresInMinutes: 30,
        preview: 'Reset your password — link expires in 30 minutes.',
      },
    })
  } catch (error) {
    console.error('[Email] Error sending password reset email:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'auth.password_reset',
}
