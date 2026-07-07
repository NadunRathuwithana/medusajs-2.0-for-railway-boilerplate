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
  try {
    const body = req.body || {}
    const { name, email, subject, message } = body as ContactFormBody

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

    let notificationModuleService: INotificationModuleService | undefined
    try {
      notificationModuleService = req.scope.resolve(Modules.NOTIFICATION)
    } catch (e) {
      console.warn("[Contact Form] Notification module is not configured in this environment.")
    }

    const SUPPORT_EMAIL = 'support@cardle.lk'
    const referenceNumber = `CF-${Math.floor(10000 + Math.random() * 90000)}`
    const contactEmailData = {
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
    }

    if (notificationModuleService) {
      // 1. Internal alert → admin inbox
      await notificationModuleService.createNotifications({
        to: SMTP_ADMIN_EMAIL,
        channel: 'email',
        template: EmailTemplates.CONTACT_FORM,
        data: contactEmailData,
      })

      // 2. CC support@cardle.lk (only if it's different from adminEmail)
      if (SMTP_ADMIN_EMAIL !== SUPPORT_EMAIL) {
        await notificationModuleService.createNotifications({
          to: SUPPORT_EMAIL,
          channel: 'email',
          template: EmailTemplates.CONTACT_FORM,
          data: contactEmailData,
        })
      }

      // 3. Customer auto-reply
      await notificationModuleService.createNotifications({
        to: email.trim(),
        channel: 'email',
        template: EmailTemplates.CONTACT_AUTO_REPLY,
        data: {
          emailOptions: {
            replyTo: SUPPORT_EMAIL,
            subject: `We've received your message [${referenceNumber}]`,
          },
          customerName: name.trim(),
          referenceNumber,
        },
      })
    } else {
      console.log(`[Contact Form] Mocked success (No notification module): ${name} - ${message}`)
    }

    return res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. We\'ll get back to you soon!',
    })
  } catch (error: any) {
    console.error('[Contact Form] Unhandled error:', error)
    // Send a structured JSON response instead of letting Medusa's error handler overwrite it
    return res.status(400).json({
      error: 'Failed to send your message. Please try again later or email us directly.',
      details: error?.message
    })
  }
}
