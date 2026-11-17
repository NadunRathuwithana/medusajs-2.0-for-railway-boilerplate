import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getMetaCatalogFeedXml } from "../../../lib/meta-catalog-feed"

/**
 * Public Google Merchant Center product feed (RSS 2.0, g: namespace).
 * Same cached catalog as the Meta feed: one item per variant, encoded image
 * links, item_group_id + color, identifier_exists=no (handmade, no GTINs).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const xml = await getMetaCatalogFeedXml(req.scope)
    res.setHeader("Content-Type", "application/xml; charset=utf-8")
    res.setHeader("Cache-Control", "public, max-age=3600")
    res.status(200).send(xml)
  } catch (err: any) {
    console.error("[google-merchant-feed] Route error:", err.message)
    res.status(500).json({ message: "Failed to generate product feed" })
  }
}
