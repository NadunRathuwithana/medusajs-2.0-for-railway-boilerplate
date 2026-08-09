import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProductVariant } from "@medusajs/framework/types"
import { Button, Container, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { sdk } from "../lib/sdk"

// Medusa's native weight/length/height/width fields on a variant only
// accept whole numbers (the Admin dashboard's own form validation rejects
// e.g. "11.5" with "The value must be a whole number" — the backend model
// itself has no such constraint, only the built-in form does). For
// merchandising copy that needs real precision (e.g. displaying an exact
// "11.5 in" on the product page), store an optional override here instead
// of fighting the native fields. The native fields stay authoritative for
// shipping/fulfillment; the storefront prefers these when present.
type VariantDimensionMetadata = {
  display_weight?: number | string | null
  display_length?: number | string | null
  display_height?: number | string | null
  display_width?: number | string | null
}

const FIELDS: { key: keyof VariantDimensionMetadata; label: string }[] = [
  { key: "display_width", label: "Width (in)" },
  { key: "display_height", label: "Height (in)" },
  { key: "display_length", label: "Depth (in)" },
  { key: "display_weight", label: "Weight (g)" },
]

const VariantPreciseDimensionsWidget = ({
  data,
}: DetailWidgetProps<AdminProductVariant>) => {
  const metadata = (data.metadata ?? {}) as VariantDimensionMetadata

  const [values, setValues] = useState<Record<string, string>>(() =>
    FIELDS.reduce((acc, field) => {
      const v = metadata[field.key]
      acc[field.key] = v != null ? String(v) : ""
      return acc
    }, {} as Record<string, string>)
  )
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!data.product_id) {
      toast.error("Failed to save", { description: "Missing parent product id." })
      return
    }

    setIsSaving(true)
    try {
      const metadataUpdate: VariantDimensionMetadata = {}
      for (const field of FIELDS) {
        const raw = values[field.key]
        metadataUpdate[field.key] = raw === "" ? null : Number(raw)
      }

      await sdk.admin.product.updateVariant(data.product_id, data.id, {
        metadata: {
          ...(data.metadata ?? {}),
          ...metadataUpdate,
        },
      })

      toast.success("Saved", { description: "Precise dimensions updated." })
    } catch (err) {
      toast.error("Failed to save", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Precise Display Dimensions</Heading>
      </div>

      <div className="px-6 py-4 flex flex-col gap-y-4">
        <Text size="small" className="text-ui-fg-subtle">
          Optional. Medusa's Width/Height/Length/Weight fields above only
          accept whole numbers. Set decimal values here to show exact
          dimensions on the product page for this variant — these take
          priority over the whole-number fields for display purposes only;
          shipping still uses the fields above.
        </Text>

        <div className="grid grid-cols-2 gap-4">
          {FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-y-2">
              <Label htmlFor={field.key} size="small" weight="plus">
                {field.label}
              </Label>
              <Input
                id={field.key}
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 11.5"
                value={values[field.key]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                disabled={isSaving}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-4 flex justify-end">
        <Button size="small" isLoading={isSaving} onClick={handleSave}>
          Save
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_variant.details.side.after",
})

export default VariantPreciseDimensionsWidget
