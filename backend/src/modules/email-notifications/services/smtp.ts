import { Logger, NotificationTypes } from '@medusajs/framework/types'
import { AbstractNotificationProviderService, MedusaError } from '@medusajs/framework/utils'
import nodemailer, { Transporter, SendMailOptions } from 'nodemailer'
import { render } from '@react-email/render'
import React, { ReactNode } from 'react'
import { generateEmailTemplate } from '../templates'

type InjectedDependencies = {
  logger: Logger
}

export interface SmtpNotificationServiceOptions {
  host: string
  port: number
  user: string
  pass: string
  secure: boolean
  from: string
  adminEmail?: string
}

type NotificationEmailOptions = {
  subject?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  text?: string
  headers?: Record<string, string>
}

/**
 * SMTP Notification Provider for Medusa using Nodemailer.
 * Renders React Email templates to HTML and delivers via SMTP.
 */
export class SmtpNotificationService extends AbstractNotificationProviderService {
  static identifier = 'smtp-notification'

  protected logger_: Logger
  protected transporter_: Transporter
  protected from_: string
  protected adminEmail_: string

  constructor(
    { logger }: InjectedDependencies,
    options: SmtpNotificationServiceOptions
  ) {
    super()
    this.logger_ = logger
    this.from_ = options.from || options.user
    this.adminEmail_ = options.adminEmail || options.user

    const transportOptions: any = {
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: {
        user: options.user,
        pass: options.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    }

    if (options.host?.includes('gmail') || options.host?.includes('google')) {
      transportOptions.service = 'gmail'
    }

    this.transporter_ = nodemailer.createTransport(transportOptions)
  }

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    if (!notification) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'No notification information provided'
      )
    }

    if (notification.channel === 'sms') {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'SMS notifications are not supported by the SMTP provider'
      )
    }

    // Generate React Email template
    let emailContent: ReactNode
    try {
      emailContent = generateEmailTemplate(notification.template, notification.data)
    } catch (error) {
      if (error instanceof MedusaError) throw error
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to generate email content for template: ${notification.template}`
      )
    }

    // Render React JSX to HTML string
    let htmlContent: string
    try {
      htmlContent = await render(emailContent as React.ReactElement)
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to render email template "${notification.template}": ${error?.message ?? error}`
      )
    }

    const emailOptions = (notification.data?.emailOptions ?? {}) as NotificationEmailOptions

    const mailOptions: SendMailOptions = {
      from: notification.from?.trim() ?? this.from_,
      to: notification.to,
      subject: emailOptions.subject ?? 'Notification',
      html: htmlContent,
      replyTo: emailOptions.replyTo,
      cc: emailOptions.cc,
      bcc: emailOptions.bcc,
      text: emailOptions.text,
      headers: emailOptions.headers,
    }

    try {
      const info = await this.transporter_.sendMail(mailOptions)
      this.logger_.info(
        `[SMTP] Sent "${notification.template}" to ${notification.to} — messageId: ${info.messageId}`
      )
      return {}
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `[SMTP] Failed to send "${notification.template}" to ${notification.to}: ${error?.message ?? error}`
      )
    }
  }
}
