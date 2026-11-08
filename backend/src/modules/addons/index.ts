import { Module } from "@medusajs/framework/utils"
import AddonsModuleService from "./service"

export const ADDONS_MODULE = "addons"

export default Module(ADDONS_MODULE, { service: AddonsModuleService })
