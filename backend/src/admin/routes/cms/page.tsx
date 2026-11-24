import { defineRouteConfig } from "@medusajs/admin-sdk"
import { EllipsisHorizontal, PencilSquare, Photo, PhotoSolid, Trash } from "@medusajs/icons"
import {
  Button, Container, Divider, Drawer, DropdownMenu, FocusModal, Heading, IconButton, Input, Label,
  Select, StatusBadge, Switch, Table, Text, Textarea, toast, usePrompt,
} from "@medusajs/ui"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ImageUpload } from "../../components/image-upload"
import { sdk } from "../../lib/sdk"

/* ------------------------------------------------------------------ types */

type Placement = "hero" | "page" | "creative"

type Banner = {
  id?: string
  placement: Placement
  page_key?: string | null
  slot_key?: string | null
  eyebrow?: string | null
  title?: string | null
  body?: string | null
  cta_label?: string | null
  cta_href?: string | null
  text_color?: string | null
  alt?: string | null
  image_desktop?: string | null
  image_tablet?: string | null
  image_mobile?: string | null
  sort_order: number
  is_active: boolean
  starts_at?: string | null
  ends_at?: string | null
}

type Option = { value: string; label: string }

const STATIC_PAGES: Option[] = [
  { value: "store", label: "All Bags (store page)" },
  { value: "collection", label: "Collection pages" },
  { value: "about", label: "About page" },
]
const SLOTS: Option[] = [{ value: "home-wide", label: "Homepage wide statement banner" }]

const SECTIONS: Record<Placement, { title: string; noun: string; description: string }> = {
  hero: {
    title: "Hero slides",
    noun: "hero slide",
    description: "Slides of the homepage carousel. With none active, the built-in slides show.",
  },
  page: {
    title: "Page banners",
    noun: "page banner",
    description: "Top banner of All Bags, each category, collections and About.",
  },
  creative: {
    title: "Creatives",
    noun: "creative",
    description: "Other placements, like the wide statement banner on the homepage.",
  },
}

const blank = (placement: Placement): Banner => ({
  placement,
  sort_order: 0,
  is_active: true,
  page_key: placement === "page" ? "store" : null,
  slot_key: placement === "creative" ? "home-wide" : null,
})

/* ---------------------------------------------------------------- helpers */

const toLocalInput = (iso?: string | null) => {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : null

function bannerStatus(b: Banner): { color: "green" | "grey" | "orange" | "red"; label: string } {
  const now = Date.now()
  if (!b.is_active) return { color: "grey", label: "Inactive" }
  if (b.starts_at && new Date(b.starts_at).getTime() > now) return { color: "orange", label: "Scheduled" }
  if (b.ends_at && new Date(b.ends_at).getTime() < now) return { color: "red", label: "Expired" }
  return { color: "green", label: "Active" }
}

function useCategoryPages() {
  const [opts, setOpts] = useState<Option[]>([])
  useEffect(() => {
    sdk.admin.productCategory
      .list({ limit: 200, fields: "name,handle" } as any)
      .then((r: any) =>
        setOpts(
          (r.product_categories || []).map((c: any) => ({
            value: `category:${c.handle}`,
            label: `Category: ${c.name}`,
          }))
        )
      )
      .catch(() => setOpts([]))
  }, [])
  return opts
}

/* ------------------------------------------------------------ form pieces */

function Field({
  label, optional, hint, children,
}: { label: string; optional?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-y-2">
      <Label size="small" weight="plus">
        {label}
        {optional && <span className="text-ui-fg-muted font-normal"> (Optional)</span>}
      </Label>
      {children}
      {hint && <Text size="xsmall" className="text-ui-fg-subtle">{hint}</Text>}
    </div>
  )
}

function SwitchCard({
  label, hint, checked, onChange,
}: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="bg-ui-bg-component shadow-elevation-card-rest flex items-start gap-x-3 rounded-lg px-4 py-3">
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5" />
      <div className="flex flex-col">
        <Label size="small" weight="plus">{label}</Label>
        <Text size="small" className="text-ui-fg-subtle">{hint}</Text>
      </div>
    </div>
  )
}

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-y-6">
      <div>
        <Heading level="h2">{title}</Heading>
        {description && <Text size="small" className="text-ui-fg-subtle mt-1">{description}</Text>}
      </div>
      {children}
    </div>
  )
}

const SWATCHES = [
  { value: null, label: "Auto" },
  { value: "#FFFFFF", label: "White" },
  { value: "#000000", label: "Black" },
  { value: "#1F2937", label: "Charcoal" },
  { value: "#F5F0E6", label: "Cream" },
]

function TextColorField({ value, onChange }: { value?: string | null; onChange: (v: string | null) => void }) {
  const [hex, setHex] = useState(value ?? "")
  useEffect(() => setHex(value ?? ""), [value])
  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {SWATCHES.map((s) => {
          const selected = (value ?? null) === s.value
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => onChange(s.value)}
              className={`txt-compact-small flex items-center gap-x-2 rounded-md px-2.5 py-1.5 transition-fg ${
                selected ? "bg-ui-bg-base shadow-borders-interactive-with-active" : "bg-ui-bg-component shadow-borders-base hover:bg-ui-bg-component-hover"
              }`}
            >
              {s.value ? (
                <span className="size-4 rounded-full shadow-borders-base" style={{ background: s.value }} />
              ) : (
                <span className="size-4 rounded-full shadow-borders-base bg-[conic-gradient(#fff_0_50%,#000_0_100%)]" />
              )}
              {s.label}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-x-2">
        <input
          type="color"
          value={value ?? "#ffffff"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-8 w-10 cursor-pointer rounded-md border-0 bg-transparent p-0"
          aria-label="Custom colour"
        />
        <Input
          className="w-32"
          placeholder="#FFFFFF"
          value={hex}
          onChange={(e) => {
            const v = e.target.value.trim()
            setHex(v)
            if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v.toUpperCase())
            if (v === "") onChange(null)
          }}
        />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------- live preview */

function Preview({ f }: { f: Banner }) {
  const textRight = f.placement === "page" && (f.page_key === "store" || f.page_key?.startsWith("category:"))
  const hasText = !!(f.eyebrow || f.title || f.cta_label)
  return (
    <div className="flex flex-col gap-y-4">
      <Text size="small" weight="plus" className="text-ui-fg-subtle">Preview</Text>
      <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg bg-[#e5e5e5] shadow-elevation-card-rest">
        {f.image_desktop ? (
          <img src={f.image_desktop} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
        ) : (
          <div className="text-ui-fg-muted absolute inset-0 flex items-center justify-center gap-x-2">
            <Photo /> <Text size="small">Desktop image</Text>
          </div>
        )}
        {hasText && (
          <div className={`absolute inset-0 flex items-center px-[6%] ${textRight ? "justify-end" : "justify-center text-center"} ${!textRight ? "bg-black/20" : ""}`}>
            <div className={textRight ? "w-1/2 text-left" : ""}>
              {f.eyebrow && <p className="text-[10px] font-medium text-white/90" style={f.text_color ? { color: f.text_color, opacity: 0.9 } : undefined}>{f.eyebrow}</p>}
              {f.title && <p className="text-xl font-semibold leading-tight text-white drop-shadow" style={f.text_color ? { color: f.text_color } : undefined}>{f.title}</p>}
              {f.body && <p className="mt-1 text-[9px] text-white/90" style={f.text_color ? { color: f.text_color, opacity: 0.85 } : undefined}>{f.body}</p>}
              {f.cta_label && (
                <span className="mt-2 inline-block rounded-full bg-white px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest text-black">
                  {f.cta_label}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-x-4">
        <div className="relative aspect-[3/4] w-24 overflow-hidden rounded-lg bg-[#e5e5e5] shadow-elevation-card-rest">
          {(f.image_mobile || f.image_desktop) && (
            <img src={(f.image_mobile || f.image_desktop)!} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
          )}
        </div>
        <Text size="xsmall" className="text-ui-fg-subtle self-end">
          Mobile. Uses the mobile image, or the desktop image cropped from the top.
        </Text>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- the editor */

function BannerEditor({
  banner, onClose, onSaved,
}: { banner: Banner | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<Banner | null>(banner)
  const [saving, setSaving] = useState(false)
  const categoryPages = useCategoryPages()
  useEffect(() => setF(banner), [banner])
  if (!f) return null

  const set = (patch: Partial<Banner>) => setF({ ...f, ...patch })
  const meta = SECTIONS[f.placement]
  const pageOptions = [...STATIC_PAGES, ...categoryPages]

  const save = async () => {
    if (!f.image_desktop && f.placement !== "creative") return toast.error("Add the desktop image first")
    setSaving(true)
    try {
      const payload = { ...f, starts_at: f.starts_at || null, ends_at: f.ends_at || null }
      if (f.id) await sdk.client.fetch(`/admin/cms/banners/${f.id}`, { method: "POST", body: payload })
      else await sdk.client.fetch(`/admin/cms/banners`, { method: "POST", body: payload })
      toast.success(f.id ? "Banner updated" : "Banner created")
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const text = (k: keyof Banner, ph?: string) => (
    <Input value={(f[k] as string) ?? ""} placeholder={ph} onChange={(e) => set({ [k]: e.target.value } as any)} />
  )

  return (
    <FocusModal open onOpenChange={(o) => !o && onClose()}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex w-full items-center justify-end gap-x-2">
            <FocusModal.Close asChild>
              <Button size="small" variant="secondary">Cancel</Button>
            </FocusModal.Close>
            <Button size="small" onClick={save} isLoading={saving}>Save</Button>
          </div>
        </FocusModal.Header>
        <FocusModal.Body className="flex size-full overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-8 px-6 py-16">
              <div>
                <Heading level="h1">{f.id ? `Edit ${meta.noun}` : `Create ${meta.noun}`}</Heading>
                <Text size="small" className="text-ui-fg-subtle mt-1">{meta.description}</Text>
              </div>

              {(f.placement === "page" || f.placement === "creative") && (
                <>
                  <FormSection title="Placement" description="Where this banner shows on the storefront.">
                    {f.placement === "page" ? (
                      <Field label="Page">
                        <Select value={f.page_key ?? "store"} onValueChange={(v) => set({ page_key: v })}>
                          <Select.Trigger><Select.Value /></Select.Trigger>
                          <Select.Content>
                            {pageOptions.map((p) => <Select.Item key={p.value} value={p.value}>{p.label}</Select.Item>)}
                          </Select.Content>
                        </Select>
                      </Field>
                    ) : (
                      <Field label="Slot">
                        <Select value={f.slot_key ?? "home-wide"} onValueChange={(v) => set({ slot_key: v })}>
                          <Select.Trigger><Select.Value /></Select.Trigger>
                          <Select.Content>
                            {SLOTS.map((p) => <Select.Item key={p.value} value={p.value}>{p.label}</Select.Item>)}
                          </Select.Content>
                        </Select>
                      </Field>
                    )}
                  </FormSection>
                  <Divider />
                </>
              )}

              <FormSection title="Images" description="Every hero and page banner uses the same size. Keep the key content in the upper middle.">
                <ImageUpload
                  label="Desktop"
                  required={f.placement !== "creative"}
                  hint="2400 x 800 px, JPG or WebP."
                  value={f.image_desktop}
                  onChange={(u) => set({ image_desktop: u })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <ImageUpload label="Tablet" aspect="aspect-[4/3]" hint="Falls back to desktop." value={f.image_tablet} onChange={(u) => set({ image_tablet: u })} />
                  <ImageUpload label="Mobile" aspect="aspect-[3/4]" hint="1000 x 1400 px. Falls back to desktop." value={f.image_mobile} onChange={(u) => set({ image_mobile: u })} />
                </div>
                <Field label="Image description" optional hint="Read by screen readers and search engines.">
                  {text("alt", "Cardle handcrafted cotton tote bags")}
                </Field>
              </FormSection>

              <Divider />

              <FormSection title="Content" description="Leave empty if the text is already part of the image.">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Label" optional>{text("eyebrow", "The Collection")}</Field>
                  <Field label="Headline" optional>{text("title", "Shop Cardle")}</Field>
                </div>
                <Field label="Subtext" optional hint="A short line under the headline.">
                  <Textarea rows={2} value={f.body ?? ""} placeholder="Handmade from 100% cotton canvas in Sri Lanka." onChange={(e) => set({ body: e.target.value })} />
                </Field>
                <Field label="Text colour" hint="Colour of the label and headline. Auto is white over the image.">
                  <TextColorField value={f.text_color} onChange={(v) => set({ text_color: v })} />
                </Field>
                <Field label="Link" optional hint="The whole banner opens this link when clicked. A page path like /categories/tote-bags, or a full URL.">
                  {text("cta_href", "/store")}
                </Field>
                <Field label="Button label" optional hint="Also show a button on the banner. Uses the link above.">
                  {text("cta_label", "Shop the collection")}
                </Field>
              </FormSection>

              <Divider />

              <FormSection title="Visibility">
                <SwitchCard
                  label="Active"
                  hint="Show this banner on the storefront."
                  checked={f.is_active}
                  onChange={(v) => set({ is_active: v })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Show from" optional>
                    <Input type="datetime-local" value={toLocalInput(f.starts_at)} onChange={(e) => set({ starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                  </Field>
                  <Field label="Hide after" optional>
                    <Input type="datetime-local" value={toLocalInput(f.ends_at)} onChange={(e) => set({ ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                  </Field>
                </div>
                <Field label="Order" hint="Lowest shows first.">
                  <Input type="number" value={f.sort_order} onChange={(e) => set({ sort_order: Number(e.target.value) })} className="w-32" />
                </Field>
              </FormSection>
            </div>
          </div>
          <div className="bg-ui-bg-subtle border-ui-border-base hidden w-[440px] shrink-0 overflow-y-auto border-l px-6 py-16 xl:block">
            <Preview f={f} />
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}

/* ---------------------------------------------------------- list section */

function BannerSection({
  placement, banners, pageLabel, onCreate, onEdit, onDelete,
}: {
  placement: Placement
  banners: Banner[]
  pageLabel: (key?: string | null) => string
  onCreate: () => void
  onEdit: (b: Banner) => void
  onDelete: (b: Banner) => void
}) {
  const meta = SECTIONS[placement]
  const rows = banners
    .filter((b) => b.placement === placement)
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">{meta.title}</Heading>
          <Text size="small" className="text-ui-fg-subtle">{meta.description}</Text>
        </div>
        <Button size="small" variant="secondary" onClick={onCreate}>Create</Button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-y-3 px-6 py-10">
          <div className="text-ui-fg-subtle"><Photo /></div>
          <div className="text-center">
            <Text size="small" weight="plus">No {meta.title.toLowerCase()}</Text>
            <Text size="small" className="text-ui-fg-muted">The storefront shows its built-in content.</Text>
          </div>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className="pl-6">Banner</Table.HeaderCell>
              {placement !== "hero" && <Table.HeaderCell>{placement === "page" ? "Page" : "Slot"}</Table.HeaderCell>}
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Schedule</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Order</Table.HeaderCell>
              <Table.HeaderCell className="w-12" />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((b) => {
              const s = bannerStatus(b)
              const from = fmtDate(b.starts_at)
              const to = fmtDate(b.ends_at)
              return (
                <Table.Row key={b.id} className="cursor-pointer" onClick={() => onEdit(b)}>
                  <Table.Cell className="pl-6">
                    <div className="flex items-center gap-x-3 py-2">
                      <div className="bg-ui-bg-subtle border-ui-border-base h-9 w-[72px] shrink-0 overflow-hidden rounded-md border">
                        {b.image_desktop && <img src={b.image_desktop} alt="" className="h-full w-full object-cover object-top" />}
                      </div>
                      <div className="min-w-0">
                        <Text size="small" weight="plus" className="truncate">{b.title || b.alt || "Untitled banner"}</Text>
                        {b.eyebrow && <Text size="xsmall" className="text-ui-fg-subtle truncate">{b.eyebrow}</Text>}
                      </div>
                    </div>
                  </Table.Cell>
                  {placement !== "hero" && (
                    <Table.Cell>
                      <Text size="small" className="text-ui-fg-subtle">
                        {placement === "page" ? pageLabel(b.page_key) : SLOTS.find((x) => x.value === b.slot_key)?.label ?? b.slot_key}
                      </Text>
                    </Table.Cell>
                  )}
                  <Table.Cell><StatusBadge color={s.color}>{s.label}</StatusBadge></Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-ui-fg-subtle">
                      {from || to ? `${from ?? "Now"} – ${to ?? "No end"}` : "Always"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell className="text-right"><Text size="small">{b.sort_order}</Text></Table.Cell>
                  <Table.Cell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenu.Trigger asChild>
                        <IconButton size="small" variant="transparent"><EllipsisHorizontal /></IconButton>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end">
                        <DropdownMenu.Item className="gap-x-2" onClick={() => onEdit(b)}>
                          <PencilSquare className="text-ui-fg-subtle" /> Edit
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item className="gap-x-2" onClick={() => onDelete(b)}>
                          <Trash className="text-ui-fg-subtle" /> Delete
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

/* ------------------------------------------------------------ promo bar */

type Promo = { text: string; href: string; is_active: boolean }

function PromoBarSection() {
  const [promo, setPromo] = useState<Promo>({ text: "", href: "", is_active: false })
  const [draft, setDraft] = useState<Promo | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    sdk.client.fetch<{ promo_bar: Promo }>("/admin/cms/settings").then((r) => setPromo(r.promo_bar)).catch(() => {})
  }, [])

  const save = async () => {
    if (!draft) return
    setSaving(true)
    try {
      await sdk.client.fetch("/admin/cms/settings", { method: "POST", body: { promo_bar: draft } })
      setPromo(draft)
      setDraft(null)
      toast.success("Promo bar updated")
    } catch (e: any) {
      toast.error(e?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const Row = ({ label, value }: { label: string; value?: string }) => (
    <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
      <Text size="small" weight="plus" leading="compact">{label}</Text>
      <Text size="small" leading="compact" className="text-pretty">{value || "-"}</Text>
    </div>
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Promo bar</Heading>
          <Text size="small" className="text-ui-fg-subtle">The dark strip at the very top of every page.</Text>
        </div>
        <div className="flex items-center gap-x-2">
          <StatusBadge color={promo.is_active ? "green" : "grey"}>{promo.is_active ? "Visible" : "Hidden"}</StatusBadge>
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <IconButton size="small" variant="transparent"><EllipsisHorizontal /></IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item className="gap-x-2" onClick={() => setDraft(promo)}>
                <PencilSquare className="text-ui-fg-subtle" /> Edit
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      </div>
      <Row label="Text" value={promo.text} />
      <Row label="Link" value={promo.href} />

      <Drawer open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <Drawer.Content>
          <Drawer.Header><Drawer.Title>Edit promo bar</Drawer.Title></Drawer.Header>
          {draft && (
            <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto">
              <Field label="Text" hint="Up to 140 characters.">
                <Input value={draft.text} maxLength={140} placeholder="5% off for all card payments" onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
              </Field>
              <Field label="Link" optional>
                <Input value={draft.href} placeholder="/store" onChange={(e) => setDraft({ ...draft, href: e.target.value })} />
              </Field>
              <SwitchCard label="Visible" hint="Show the promo bar on every page." checked={draft.is_active} onChange={(v) => setDraft({ ...draft, is_active: v })} />
            </Drawer.Body>
          )}
          <Drawer.Footer>
            <Drawer.Close asChild><Button size="small" variant="secondary">Cancel</Button></Drawer.Close>
            <Button size="small" onClick={save} isLoading={saving}>Save</Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

/* ------------------------------------------------------------------ page */

const CmsPage = () => {
  const [banners, setBanners] = useState<Banner[]>([])
  const [editing, setEditing] = useState<Banner | null>(null)
  const prompt = usePrompt()
  const categoryPages = useCategoryPages()

  const reload = useCallback(() => {
    sdk.client.fetch<{ banners: Banner[] }>("/admin/cms/banners").then((r) => setBanners(r.banners)).catch(() => {})
  }, [])
  useEffect(reload, [reload])

  const pageLabel = useMemo(() => {
    const all = [...STATIC_PAGES, ...categoryPages]
    return (key?: string | null) => all.find((p) => p.value === key)?.label ?? key ?? "-"
  }, [categoryPages])

  const remove = async (b: Banner) => {
    const ok = await prompt({
      title: "Delete banner?",
      description: `"${b.title || b.alt || "Untitled banner"}" will be removed from the storefront. This can't be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (!ok) return
    try {
      await sdk.client.fetch(`/admin/cms/banners/${b.id}`, { method: "DELETE" })
      toast.success("Banner deleted")
      reload()
    } catch (e: any) {
      toast.error(e?.message || "Delete failed")
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Site CMS</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Banners and the promo bar on cardle.lk. Changes show within about a minute.
          </Text>
        </div>
      </Container>

      <PromoBarSection />
      {(["hero", "page", "creative"] as Placement[]).map((p) => (
        <BannerSection
          key={p}
          placement={p}
          banners={banners}
          pageLabel={pageLabel}
          onCreate={() => setEditing(blank(p))}
          onEdit={(b) => setEditing(b)}
          onDelete={remove}
        />
      ))}

      <BannerEditor banner={editing} onClose={() => setEditing(null)} onSaved={reload} />
    </div>
  )
}

export const config = defineRouteConfig({ label: "Site CMS", icon: PhotoSolid })
export default CmsPage
