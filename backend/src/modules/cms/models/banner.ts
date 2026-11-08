import { model } from "@medusajs/framework/utils"

/**
 * One creative managed from Admin > Site CMS.
 *
 * placement:
 *  - "hero"     homepage carousel slide
 *  - "page"     top banner of a page (page_key: store | collection | about)
 *  - "creative" a named slot elsewhere on the site (slot_key, e.g. home-wide)
 */
const Banner = model.define("cms_banner", {
  id: model.id({ prefix: "cmsb" }).primaryKey(),
  placement: model.enum(["hero", "page", "creative"]).default("hero"),
  page_key: model.text().nullable(),
  slot_key: model.text().nullable(),
  eyebrow: model.text().nullable(),
  title: model.text().nullable(),
  body: model.text().nullable(),
  cta_label: model.text().nullable(),
  cta_href: model.text().nullable(),
  alt: model.text().nullable(),
  image_desktop: model.text().nullable(),
  image_tablet: model.text().nullable(),
  image_mobile: model.text().nullable(),
  sort_order: model.number().default(0),
  is_active: model.boolean().default(true),
  starts_at: model.dateTime().nullable(),
  ends_at: model.dateTime().nullable(),
})

export default Banner
