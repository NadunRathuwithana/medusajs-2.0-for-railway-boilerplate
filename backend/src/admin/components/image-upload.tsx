import { ArrowDownTray, Trash } from "@medusajs/icons"
import { IconButton, Text, clx, toast } from "@medusajs/ui"
import { useRef, useState } from "react"
import { sdk } from "../lib/sdk"

/**
 * Medusa-style image dropzone (same look as product media upload).
 * Click or drop an image; shows a preview with replace / remove once set.
 */
export function ImageUpload({
  label,
  hint,
  value,
  onChange,
  aspect = "aspect-[3/1]",
  required,
}: {
  label: string
  hint?: string
  value?: string | null
  onChange: (url: string | null) => void
  aspect?: string
  required?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)

  const upload = async (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file")
    setBusy(true)
    try {
      const res = await sdk.admin.upload.create({ files: [file] })
      onChange(res.files[0].url)
    } catch (err: any) {
      toast.error(err?.message || "Upload failed")
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-baseline justify-between gap-x-2">
        <Text size="small" weight="plus" leading="compact">
          {label}
          {!required && <span className="text-ui-fg-muted font-normal"> (Optional)</span>}
        </Text>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {value ? (
        <div className={clx("group relative w-full overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-subtle", aspect)}>
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-x-1 opacity-0 transition-opacity group-hover:opacity-100">
            <IconButton size="small" type="button" onClick={() => input.current?.click()} disabled={busy}>
              <ArrowDownTray />
            </IconButton>
            <IconButton size="small" type="button" onClick={() => onChange(null)}>
              <Trash />
            </IconButton>
          </div>
          {busy && <div className="absolute inset-0 bg-ui-bg-base/60" />}
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true) }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files?.[0]) }}
          className={clx(
            "bg-ui-bg-component border-ui-border-strong transition-fg group flex w-full flex-col items-center gap-y-2 rounded-lg border border-dashed p-8",
            "hover:border-ui-border-interactive focus:border-ui-border-interactive focus:shadow-borders-focus outline-none",
            over && "border-ui-border-interactive",
            busy && "opacity-60"
          )}
        >
          <div className="text-ui-fg-subtle group-disabled:text-ui-fg-disabled flex items-center gap-x-2">
            <ArrowDownTray />
            <Text size="small" weight="plus" leading="compact">{busy ? "Uploading..." : "Upload image"}</Text>
          </div>
          <Text size="xsmall" leading="compact" className="text-ui-fg-muted text-center">
            Drag and drop an image here or click to upload.
          </Text>
        </button>
      )}
      {hint && <Text size="xsmall" className="text-ui-fg-subtle">{hint}</Text>}
    </div>
  )
}
