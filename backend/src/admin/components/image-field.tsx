import { Button, Label, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { sdk } from "../lib/sdk"

export function ImageField({
  label, hint, value, onChange,
}: { label: string; hint?: string; value?: string | null; onChange: (url: string | null) => void }) {
  const [busy, setBusy] = useState(false)
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const res = await sdk.admin.upload.create({ files: [file] })
      onChange(res.files[0].url)
    } catch (err: any) {
      toast.error(err?.message || "Upload failed")
    } finally {
      setBusy(false)
      e.target.value = ""
    }
  }
  return (
    <div className="flex flex-col gap-y-2">
      <Label>{label}</Label>
      {hint && <Text size="xsmall" className="text-ui-fg-subtle">{hint}</Text>}
      {value && <img src={value} alt="" className="h-28 w-28 rounded-md border object-cover" />}
      <div className="flex items-center gap-x-2">
        <input type="file" accept="image/*" onChange={pick} disabled={busy} className="text-xs" />
        {value && <Button size="small" variant="secondary" onClick={() => onChange(null)}>Remove</Button>}
      </div>
    </div>
  )
}
