/**
 * One-off migration: rewrite absolute media URLs from the old UAT bucket
 * host to the new custom domain, keeping the rest of each URL identical.
 *
 * Schema note (confirmed against the real DB via Medusa's container, not
 * assumed): Medusa v2's Product module stores every product/variant image
 * URL in exactly two places —
 *   - `product.thumbnail` (a denormalized quick-access column)
 *   - `image.url` (the shared image table; variants reference these same
 *     rows through a join table, product_variant_product_image — they do
 *     NOT have their own separate URL column)
 * So those two columns are the complete set of what needs migrating for
 * product media. (Any banner/CMS content living outside these tables isn't
 * covered here — this codebase doesn't have a CMS module.)
 *
 * SAFE BY DEFAULT: dry-run unless --execute is passed. Dry-run only reads.
 *
 * Usage:
 *   npx medusa exec ./src/scripts/migrate-media-urls.ts
 *   npx medusa exec ./src/scripts/migrate-media-urls.ts -- --execute
 */
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const OLD_HOST = "bucket-uat-5fec.up.railway.app"
const NEW_HOST = "media.cardle.lk"
const OLD_PREFIX = `https://${OLD_HOST}`
const NEW_PREFIX = `https://${NEW_HOST}`

const TARGETS: { table: string; column: string; label: string }[] = [
  { table: "product", column: "thumbnail", label: "product thumbnails" },
  { table: "image", column: "url", label: "product images" },
]

export default async function migrateMediaUrls({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const knex: any = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const execute = process.argv.includes("--execute")

  logger.info(`Media URL migration: ${OLD_PREFIX} -> ${NEW_PREFIX}`)
  logger.info(
    execute
      ? "MODE: EXECUTE — this WILL write changes to the database."
      : "MODE: DRY RUN — no changes will be made. Pass --execute to apply."
  )
  logger.info("=".repeat(70))

  let totalMatched = 0
  let totalMigrated = 0
  const unexpectedPatterns: { table: string; id: string; value: string }[] = []

  for (const { table, column, label } of TARGETS) {
    // Exact-prefix matches — the only rows this script will ever rewrite.
    const exactMatches = await knex(table)
      .select("id", column)
      .where(column, "like", `${OLD_PREFIX}%`)
      .whereNull("deleted_at")

    // Anything that mentions the old host but does NOT match the exact
    // expected "https://<host>" prefix (wrong protocol, host appearing
    // somewhere unexpected, etc.) — reported, never auto-rewritten, so
    // nothing gets silently missed or silently mangled.
    const looseMatches = await knex(table)
      .select("id", column)
      .whereRaw(`?? ILIKE ?`, [column, `%${OLD_HOST}%`])
      .whereNull("deleted_at")

    const exactIds = new Set(exactMatches.map((r: any) => r.id))
    for (const row of looseMatches) {
      if (!exactIds.has(row.id)) {
        unexpectedPatterns.push({ table, id: row.id, value: row[column] })
      }
    }

    logger.info(
      `[${label}] ${exactMatches.length} row(s) match the expected "${OLD_PREFIX}" prefix`
    )
    for (const row of exactMatches.slice(0, 10)) {
      const oldVal = row[column] as string
      const newVal = OLD_PREFIX && oldVal.startsWith(OLD_PREFIX)
        ? NEW_PREFIX + oldVal.slice(OLD_PREFIX.length)
        : oldVal
      logger.info(`    ${table}.${row.id}: ${oldVal}  ->  ${newVal}`)
    }
    if (exactMatches.length > 10) {
      logger.info(`    ...and ${exactMatches.length - 10} more`)
    }

    totalMatched += exactMatches.length

    if (execute && exactMatches.length > 0) {
      const affected = await knex(table)
        .where(column, "like", `${OLD_PREFIX}%`)
        .whereNull("deleted_at")
        .update({
          [column]: knex.raw("replace(??, ?, ?)", [column, OLD_PREFIX, NEW_PREFIX]),
        })
      logger.info(`[${label}] Updated ${affected} row(s)`)
      totalMigrated += affected
    }
  }

  logger.info("=".repeat(70))
  logger.info(`TOTAL rows matching the expected old-host pattern: ${totalMatched}`)
  if (execute) {
    logger.info(`TOTAL rows actually migrated: ${totalMigrated}`)
  } else {
    logger.info(`DRY RUN — nothing was written. Re-run with --execute to apply these exact changes.`)
  }

  if (unexpectedPatterns.length > 0) {
    logger.warn(
      `${unexpectedPatterns.length} row(s) mention "${OLD_HOST}" but do NOT match the ` +
        `expected "${OLD_PREFIX}" prefix — these were NOT migrated and need manual review:`
    )
    for (const p of unexpectedPatterns) {
      logger.warn(`    ${p.table}.${p.id}: ${p.value}`)
    }
  } else {
    logger.info("No unexpected/malformed URL patterns found — every match was a clean, expected prefix.")
  }
}
