import { ModuleProviderExports } from '@medusajs/framework/types'
import { SmtpNotificationService } from './services/smtp'

const services = [SmtpNotificationService]

const providerExport: ModuleProviderExports = {
  services,
}

export default providerExport
