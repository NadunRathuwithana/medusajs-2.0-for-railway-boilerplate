import { defineRouteConfig } from "@medusajs/admin-sdk"
import { PhotoSolid } from "@medusajs/icons"
import {
  Badge, Button, Container, Drawer, Heading, Input, Label, Select, Switch, Tabs, Text, Textarea, toast,
} from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { sdk } from "../../lib/sdk"

type Banner = {
  id?: string
  placement: "hero" | "page" | "creative"
  page_key?: string | null
  slot_key?: string | null
  eyebrow?: string | null
  title?: string | null
  body?: string | null
  cta_label?: string | null
  cta_href?: string | null
  alt?: string | null
  image_desktop?: string | null
  image_tablet?: string | null
  image_mobile?: string | null
  sort_order: number
  is_active: boolean
  starts_at?: string | null
  ends_at?: string | null
}

const PAGE_KEYS = [
  { value: "store", label: "Store page" },
  { value: "collection", label: "Collection pages" },
  { value: "about", label: "About page" },
]
const SLOT_KEYS = [{ value: "home-wide", label: "Homepage wide statement banner" }]

const blank = (placement: Banner["placement"]): Banner => ({
  placement, sort_order: 0, is_active: true,
  page_key: placement === "page" ? "store" : null,
  slot_key: placement === "creative" ? "home-wide" : null,
})

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time
const toLocalInput = (iso?: string | null) => {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function ImageField({ label, hint, value, onChange }: {
  label: string; hint: string; value?: string | null; onChange: (url: string | null) => void
}) {
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
      <Text size="xsmall" className="text-ui-fg-subtle">{hint}</Text>
      {value && <img src={value} alt="" className="h-24 w-full rounded-md border object-cover" />}
      <div className="flex items-center gap-x-2">
        <input type="file" accept="image/*" onChange={pick} disabled={busy} className="text-xs" />
        {value && <Button size="small" variant="secondary" onClick={() => onChange(null)}>Remove</Button>}
      </div>
    </div>
  )
}

function BannerDrawer({ banner, onClose, onSaved }: { banner: Banner | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<Banner | null>(banner)
  const [saving, setSaving] = useState(false)
  useEffect(() => setF(banner), [banner])
  if (!f) return null
  const set = (patch: Partial<Banner>) => setF({ ...f, ...patch })
  const text = (k: keyof Banner, label: string, ph?: string) => (
    <div className="flex flex-col gap-y-1">
      <Label>{label}</Label>
      <Input value={(f[k] as string) ?? ""} placeholder={ph} onChange={(e) => set({ [k]: e.target.value } as any)} />
    </div>
  )
  const save = async () => {
    if (!f.image_desktop && f.placement !== "creative") return toast.error("Add at least the desktop image")
    setSaving(true)
    try {
      const payload = { ...f, starts_at: f.starts_at || null, ends_at: f.ends_at || null }
      if (f.id) await sdk.client.fetch(`/admin/cms/banners/${f.id}`, { method: "POST", body: payload })
      else await sdk.client.fetch(`/admin/cms/banners`, { method: "POST", body: payload })
      toast.success("Saved")
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }
  return (
    <Drawer open onOpenChange={(o) => !o && onClose()}>
      <Drawer.Content>
        <Drawer.Header><Drawer.Title>{f.id ? "Edit" : "New"} {f.placement} banner</Drawer.Title></Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
          {f.placement === "page" && (
            <div className="flex flex-col gap-y-1">
              <Label>Page</Label>
              <Select value={f.page_key ?? "store"} onValueChange={(v) => set({ page_key: v })}>
                <Select.Trigger><Select.Value /></Select.Trigger>
                <Select.Content>{PAGE_KEYS.map((p) => <Select.Item key={p.value} value={p.value}>{p.label}</Select.Item>)}</Select.Content>
              </Select>
            </div>
          )}
          {f.placement === "creative" && (
            <div className="flex flex-col gap-y-1">
              <Label>Slot</Label>
              <Select value={f.slot_key ?? "home-wide"} onValueChange={(v) => set({ slot_key: v })}>
                <Select.Trigger><Select.Value /></Select.Trigger>
                <Select.Content>{SLOT_KEYS.map((p) => <Select.Item key={p.value} value={p.value}>{p.label}</Select.Item>)}</Select.Content>
              </Select>
            </div>
          )}
          <ImageField label="Desktop image" hint="Wide, about 2400 x 1000. Required for hero and page banners." value={f.image_desktop} onChange={(u) => set({ image_desktop: u })} />
          <ImageField label="Tablet image (optional)" hint="Falls back to desktop." value={f.image_tablet} onChange={(u) => set({ image_tablet: u })} />
          <ImageField label="Mobile image (optional)" hint="Portrait crop, about 1000 x 1400. Falls back to desktop." value={f.image_mobile} onChange={(u) => set({ image_mobile: u })} />
          {text("alt", "Image description (alt text)", "Cardle handcrafted cotton tote bags")}
          {text("eyebrow", "Small label above the headline")}
          {text("title", "Headline")}
          {(f.placement === "creative") && (
            <div className="flex flex-col gap-y-1">
              <Label>Text</Label>
              <Textarea value={f.body ?? ""} onChange={(e) => set({ body: e.target.value })} />
            </div>
          )}
          {text("cta_label", "Button label", "Shop the collection")}
          {text("cta_href", "Button link", "/store")}
          <div className="grid grid-cols-2 gap-x-3">
            <div className="flex flex-col gap-y-1">
              <Label>Show from (optional)</Label>
              <Input type="datetime-local" value={toLocalInput(f.starts_at)} onChange={(e) => set({ starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
            <div className="flex flex-col gap-y-1">
              <Label>Hide after (optional)</Label>
              <Input type="datetime-local" value={toLocalInput(f.ends_at)} onChange={(e) => set({ ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
          </div>
          <div className="flex flex-col gap-y-1">
            <Label>Order (lowest first)</Label>
            <Input type="number" value={f.sort_order} onChange={(e) => set({ sort_order: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-x-2">
            <Switch checked={f.is_active} onCheckedChange={(v) => set({ is_active: v })} />
            <Label>Active</Label>
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} isLoading={saving}>Save</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

function BannerList({ placement, banners, reload }: { placement: Banner["placement"]; banners: Banner[]; reload: () => void }) {
  const [editing, setEditing] = useState<Banner | null>(null)
  const rows = banners.filter((b) => b.placement === placement)
  const remove = async (id: string) => {
    if (!confirm("Delete this banner?")) return
    await sdk.client.fetch(`/admin/cms/banners/${id}`, { method: "DELETE" })
    toast.success("Deleted")
    reload()
  }
  return (
    <div className="flex flex-col gap-y-3 py-4">
      <div className="flex items-center justify-between">
        <Text size="small" className="text-ui-fg-subtle">
          {placement === "hero" && "Slides of the homepage carousel. If none are active, the built-in slides show."}
          {placement === "page" && "Top banner of the Store, Collection and About pages. If none is active, the built-in image shows."}
          {placement === "creative" && "Other creatives, like the wide statement banner on the homepage."}
        </Text>
        <Button size="small" onClick={() => setEditing(blank(placement))}>Add</Button>
      </div>
      {rows.length === 0 && <Text className="text-ui-fg-muted">Nothing here yet. The site shows its built-in content.</Text>}
      {rows.map((b) => (
        <div key={b.id} className="flex items-center gap-x-3 rounded-lg border p-3">
          {b.image_desktop ? <img src={b.image_desktop} alt="" className="h-14 w-24 rounded object-cover" /> : <div className="h-14 w-24 rounded bg-ui-bg-subtle" />}
          <div className="flex-1 min-w-0">
            <Text weight="plus" className="truncate">{b.title || b.alt || "(no headline)"}</Text>
            <div className="flex gap-x-2 mt-1">
              {b.page_key && <Badge size="2xsmall">{b.page_key}</Badge>}
              {b.slot_key && <Badge size="2xsmall">{b.slot_key}</Badge>}
              <Badge size="2xsmall" color={b.is_active ? "green" : "grey"}>{b.is_active ? "Active" : "Off"}</Badge>
              <Badge size="2xsmall" color="grey">order {b.sort_order}</Badge>
            </div>
          </div>
          <Button size="small" variant="secondary" onClick={() => setEditing(b)}>Edit</Button>
          <Button size="small" variant="danger" onClick={() => remove(b.id!)}>Delete</Button>
        </div>
      ))}
      <BannerDrawer banner={editing} onClose={() => setEditing(null)} onSaved={reload} />
    </div>
  )
}

function PromoBar() {
  const [promo, setPromo] = useState({ text: "", href: "", is_active: false })
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    sdk.client.fetch<{ promo_bar: typeof promo }>("/admin/cms/settings").then((r) => setPromo(r.promo_bar))
  }, [])
  const save = async () => {
    setSaving(true)
    try {
      await sdk.client.fetch("/admin/cms/settings", { method: "POST", body: { promo_bar: promo } })
      toast.success("Promo bar saved")
    } catch (e: any) {
      toast.error(e?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="flex max-w-xl flex-col gap-y-4 py-4">
      <Text size="small" className="text-ui-fg-subtle">The dark strip at the very top of every page.</Text>
      <div className="flex flex-col gap-y-1">
        <Label>Text</Label>
        <Input value={promo.text} maxLength={140} placeholder="5% Off for all Card Payments" onChange={(e) => setPromo({ ...promo, text: e.target.value })} />
      </div>
      <div className="flex flex-col gap-y-1">
        <Label>Link (optional)</Label>
        <Input value={promo.href} placeholder="/store" onChange={(e) => setPromo({ ...promo, href: e.target.value })} />
      </div>
      <div className="flex items-center gap-x-2">
        <Switch checked={promo.is_active} onCheckedChange={(v) => setPromo({ ...promo, is_active: v })} />
        <Label>Show the promo bar</Label>
      </div>
      <div><Button onClick={save} isLoading={saving}>Save</Button></div>
    </div>
  )
}

const CmsPage = () => {
  const [banners, setBanners] = useState<Banner[]>([])
  const reload = useCallback(() => {
    sdk.client.fetch<{ banners: Banner[] }>("/admin/cms/banners").then((r) => setBanners(r.banners))
  }, [])
  useEffect(reload, [reload])
  return (
    <Container className="p-6">
      <Heading level="h1">Site CMS</Heading>
      <Text className="text-ui-fg-subtle mt-1">Changes show on the storefront within about a minute.</Text>
      <Tabs defaultValue="promo" className="mt-4">
        <Tabs.List>
          <Tabs.Trigger value="promo">Promo bar</Tabs.Trigger>
          <Tabs.Trigger value="hero">Hero slides</Tabs.Trigger>
          <Tabs.Trigger value="page">Page banners</Tabs.Trigger>
          <Tabs.Trigger value="creative">Other creatives</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="promo"><PromoBar /></Tabs.Content>
        <Tabs.Content value="hero"><BannerList placement="hero" banners={banners} reload={reload} /></Tabs.Content>
        <Tabs.Content value="page"><BannerList placement="page" banners={banners} reload={reload} /></Tabs.Content>
        <Tabs.Content value="creative"><BannerList placement="creative" banners={banners} reload={reload} /></Tabs.Content>
      </Tabs>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Site CMS", icon: PhotoSolid })
export default CmsPage
