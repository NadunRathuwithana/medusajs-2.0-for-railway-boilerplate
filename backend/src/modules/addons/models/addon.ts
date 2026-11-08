import { model } from "@medusajs/framework/utils"

/** A paid (or free) extra a customer can add to a bag: laptop pocket, key tag, ... */
const Addon = model.define("addon", {
  id: model.id({ prefix: "adn" }).primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  price: model.number().default(0), // LKR, same unit as product prices
  image: model.text().nullable(),
  is_active: model.boolean().default(true),
  sort_order: model.number().default(0),
})

export default Addon
