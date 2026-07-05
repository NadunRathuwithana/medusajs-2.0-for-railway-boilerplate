import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService } from '@medusajs/framework/types'
import { EmailTemplates } from '../../../modules/email-notifications/templates'
import { CONTACT_AUTO_REPLY } from '../../../modules/email-notifications/templates/contact-auto-reply'
import { SMTP_ADMIN_EMAIL } from '../../../lib/constants'

interface ContactFormBody {
  name: string
  email: string
  subject?: string
  message: string
}

/**
 * POST /store/contact
 * Sends a contact form notification email to the store admin.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { name, email, subject, message } = req.body as ContactFormBody

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name is required (minimum 2 characters)' })
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required' })
  }

  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    return res.status(400).json({ error: 'Message is required (minimum 10 characters)' })
  }

  try {
    const notificationModuleService: INotificationModuleService = req.scope.resolve(Modules.NOTIFICATION)

    const adminEmail = SMTP_ADMIN_EMAIL || process.env.SMTP_USER || 'hello@cardle.lk'

    const referenceNumber = `CF-${Math.floor(10000 + Math.random() * 90000)}`

    // 1. Internal alert
    await notificationModuleService.createNotifications({
      to: adminEmail,
      channel: 'email',
      template: EmailTemplates.CONTACT_FORM,
      data: {
        emailOptions: {
          replyTo: email.trim(),
          subject: `Contact Form [${referenceNumber}] — from ${name.trim()}`,
        },
        referenceNumber,
        senderName: name.trim(),
        senderEmail: email.trim(),
        subject: subject?.trim() || 'General Inquiry',
        message: message.trim(),
        submittedAt: new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Colombo',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        preview: `New message from ${name.trim()}`,
      },
    })

    // 2. Customer auto-reply
    await notificationModuleService.createNotifications({
      to: email.trim(),
      channel: 'email',
      template: EmailTemplates.CONTACT_AUTO_REPLY,
      data: {
        emailOptions: {
          replyTo: adminEmail,
          subject: `We've received your message [${referenceNumber}]`,
        },
        customerName: name.trim(),
        referenceNumber,
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. We\'ll get back to you soon!',
    })
  } catch (error) {
    console.error('[Contact Form] Error sending notification:', error)
    return res.status(500).json({
      error: 'Failed to send your message. Please try again later or email us directly.',
    })
  }
}
