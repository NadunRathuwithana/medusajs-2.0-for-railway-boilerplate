import { model } from "@medusajs/framework/utils"

/** Simple key/value store, e.g. key "promo_bar" -> { text, href, is_active } */
const SiteSetting = model.define("cms_setting", {
  id: model.id({ prefix: "cmss" }).primaryKey(),
  key: model.text().unique(),
  value: model.json().nullable(),
})

export default SiteSetting
