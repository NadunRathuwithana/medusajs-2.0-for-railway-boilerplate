import { MedusaService } from "@medusajs/framework/utils"
import Addon from "./models/addon"
import AddonProduct from "./models/addon-product"
import PackingOption from "./models/packing-option"

class AddonsModuleService extends MedusaService({ Addon, AddonProduct, PackingOption }) {}

export default AddonsModuleService
