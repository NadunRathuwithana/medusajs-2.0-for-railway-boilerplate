import { ModuleProviderExports } from '@medusajs/framework/types'
import { ResendNotificationService } from './services/resend'
import { SmtpNotificationService } from './services/smtp'

const services = [ResendNotificationService, SmtpNotificationService]

const providerExport: ModuleProviderExports = {
  services,
}

export default providerExport
