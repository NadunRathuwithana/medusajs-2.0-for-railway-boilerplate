import { MedusaService } from "@medusajs/framework/utils"
import Banner from "./models/banner"
import SiteSetting from "./models/site-setting"

class CmsModuleService extends MedusaService({ Banner, SiteSetting }) {}

export default CmsModuleService
