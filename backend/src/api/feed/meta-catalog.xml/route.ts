import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getMetaCatalogFeedXml } from "../../../lib/meta-catalog-feed"

/**
 * Public Meta/Google-style RSS 2.0 product feed for Commerce Manager to
 * poll. No auth (Meta's crawler can't authenticate) and no publishable-key
 * requirement — this lives outside /store on purpose. Only GET is exported,
 * so Medusa's router rejects every other method on its own.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const xml = await getMetaCatalogFeedXml(req.scope)
    res.setHeader("Content-Type", "application/xml; charset=utf-8")
    // Matches the feed's own 1-hour regeneration cadence — safe for a CDN/
    // browser to reuse a response for that long too.
    res.setHeader("Cache-Control", "public, max-age=3600")
    res.status(200).send(xml)
  } catch (err: any) {
    // Only reachable if generation has NEVER succeeded even once (no cache
    // to fall back to at all) — getMetaCatalogFeedXml already serves the
    // last good feed on any transient failure.
    console.error("[meta-catalog-feed] Route error:", err.message)
    res.status(500).json({ message: "Failed to generate catalog feed" })
  }
}
