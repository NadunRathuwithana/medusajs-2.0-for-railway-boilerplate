import { model } from "@medusajs/framework/utils"

/** Which products offer which add-on. Products with no rows have no add-ons. */
const AddonProduct = model
  .define("addon_product", {
    id: model.id({ prefix: "adnp" }).primaryKey(),
    addon_id: model.text(),
    product_id: model.text(),
  })
  .indexes([{ on: ["addon_id", "product_id"], unique: true }, { on: ["product_id"] }])

export default AddonProduct
