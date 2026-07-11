import { ModuleProviderExports } from '@medusajs/framework/types'
import { ResendNotificationService } from './services/resend'
import { SmtpNotificationService } from './services/smtp'

const services = []

if (process.env.RESEND_API_KEY) {
  services.push(ResendNotificationService)
} else {
  services.push(SmtpNotificationService)
}

const providerExport: ModuleProviderExports = {
  services,
}

export default providerExport
