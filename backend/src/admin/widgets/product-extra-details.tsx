import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { Button, Container, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"
import { sdk } from "../lib/sdk"

type ProductCustomMetadata = {
  strap_length?: number | string | null
  size_chart_url?: string | null
}

const ProductExtraDetailsWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const metadata = (data.metadata ?? {}) as ProductCustomMetadata

  const [strapLength, setStrapLength] = useState<string>(
    metadata.strap_length != null ? String(metadata.strap_length) : ""
  )
  const [sizeChartUrl, setSizeChartUrl] = useState<string | null>(
    metadata.size_chart_url ?? null
  )
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Preview a newly-picked file (before it's uploaded) via an object URL,
  // revoked whenever it's replaced or the widget unmounts.
  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(pendingFile)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [pendingFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPendingFile(file)
  }

  const handleRemoveSizeChart = () => {
    setSizeChartUrl(null)
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      let finalSizeChartUrl = sizeChartUrl

      if (pendingFile) {
        const uploadResult = await sdk.admin.upload.create({ files: [pendingFile] })
        finalSizeChartUrl = uploadResult.files[0].url
      }

      await sdk.admin.product.update(data.id, {
        metadata: {
          ...(data.metadata ?? {}),
          strap_length: strapLength === "" ? null : Number(strapLength),
          size_chart_url: finalSizeChartUrl,
        },
      })

      setSizeChartUrl(finalSizeChartUrl)
      setPendingFile(null)
      toast.success("Saved", { description: "Extra product details updated." })
    } catch (err) {
      toast.error("Failed to save", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const displayedImage = previewUrl ?? sizeChartUrl

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Extra Product Details</Heading>
      </div>

      <div className="px-6 py-4 flex flex-col gap-y-2">
        <Label htmlFor="strap-length" size="small" weight="plus">
          Strap Length (in)
        </Label>
        <Input
          id="strap-length"
          type="number"
          step="0.1"
          min="0"
          placeholder="e.g. 24"
          value={strapLength}
          onChange={(e) => setStrapLength(e.target.value)}
          disabled={isSaving}
        />
      </div>

      <div className="px-6 py-4 flex flex-col gap-y-2">
        <Label size="small" weight="plus">
          Size Chart
        </Label>

        {displayedImage && (
          <img
            src={displayedImage}
            alt="Size chart preview"
            className="max-w-full max-h-64 rounded-md border object-contain"
          />
        )}

        <div className="flex items-center gap-x-2 mt-1">
          <Button
            size="small"
            variant="secondary"
            type="button"
            disabled={isSaving}
            onClick={() => fileInputRef.current?.click()}
          >
            {displayedImage ? "Replace image" : "Upload image"}
          </Button>
          {displayedImage && (
            <Button
              size="small"
              variant="transparent"
              type="button"
              disabled={isSaving}
              onClick={handleRemoveSizeChart}
            >
              Remove
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Text size="small" className="text-ui-fg-subtle">
          Shown as a "Size Guide" tab on the product page once saved.
        </Text>
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
  zone: "product.details.side.after",
})

export default ProductExtraDetailsWidget
