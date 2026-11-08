import { model } from "@medusajs/framework/utils"

/** Checkout packing. The default option is preselected and always free. */
const PackingOption = model.define("packing_option", {
  id: model.id({ prefix: "pkg" }).primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  price: model.number().default(0),
  image: model.text().nullable(),
  is_default: model.boolean().default(false),
  is_active: model.boolean().default(true),
  sort_order: model.number().default(0),
})

export default PackingOption
