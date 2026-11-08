import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Sparkles } from "@medusajs/icons"
import {
  Badge, Button, Container, Drawer, Heading, Input, Label, Switch, Tabs, Text, Textarea, toast,
} from "@medusajs/ui"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ImageField } from "../../components/image-field"
import { sdk } from "../../lib/sdk"

type Item = {
  id?: string
  name: string
  description?: string | null
  price: number
  image?: string | null
  is_active: boolean
  sort_order: number
  is_default?: boolean
  product_ids?: string[]
}
type Product = { id: string; title: string }

const fmt = (n: number) => `LKR ${Number(n).toLocaleString()}`

function ItemDrawer({
  kind, item, products, onClose, onSaved,
}: {
  kind: "addon" | "packing"
  item: Item | null
  products: Product[]
  onClose: () => void
  onSaved: () => void
}) {
  const [f, setF] = useState<Item | null>(item)
  const [saving, setSaving] = useState(false)
  const [q, setQ] = useState("")
  useEffect(() => setF(item), [item])
  const shown = useMemo(
    () => products.filter((p) => p.title.toLowerCase().includes(q.toLowerCase())),
    [products, q]
  )
  if (!f) return null
  const set = (p: Partial<Item>) => setF({ ...f, ...p })
  const base = kind === "addon" ? "/admin/addons" : "/admin/packing-options"
  const toggleProduct = (id: string) => {
    const cur = new Set(f.product_ids ?? [])
    cur.has(id) ? cur.delete(id) : cur.add(id)
    set({ product_ids: [...cur] })
  }
  const save = async () => {
    if (!f.name.trim()) return toast.error("Give it a name")
    if (!f.image) return toast.error("Add an image so customers can see it")
    setSaving(true)
    try {
      await sdk.client.fetch(f.id ? `${base}/${f.id}` : base, { method: "POST", body: f })
      toast.success("Saved")
      onSaved()
      onClose()
    } catch (e: any) {
      toast.error(e?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }
  return (
    <Drawer open onOpenChange={(o) => !o && onClose()}>
      <Drawer.Content>
        <Drawer.Header><Drawer.Title>{f.id ? "Edit" : "New"} {kind === "addon" ? "add-on" : "packing option"}</Drawer.Title></Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
          <ImageField label="Image" hint="Square works best. Customers can open it full size." value={f.image} onChange={(u) => set({ image: u })} />
          <div className="flex flex-col gap-y-1"><Label>Name</Label><Input value={f.name} onChange={(e) => set({ name: e.target.value })} /></div>
          <div className="flex flex-col gap-y-1"><Label>Short description</Label><Textarea value={f.description ?? ""} onChange={(e) => set({ description: e.target.value })} /></div>
          {kind === "packing" && (
            <div className="flex items-center gap-x-2">
              <Switch checked={!!f.is_default} onCheckedChange={(v) => set({ is_default: v, price: v ? 0 : f.price })} />
              <Label>Default packing (preselected, included in the price)</Label>
            </div>
          )}
          {!(kind === "packing" && f.is_default) && (
            <div className="flex flex-col gap-y-1">
              <Label>Price (LKR, 0 = free)</Label>
              <Input type="number" min={0} value={f.price} onChange={(e) => set({ price: Number(e.target.value) })} />
            </div>
          )}
          <div className="flex flex-col gap-y-1"><Label>Order (lowest first)</Label><Input type="number" value={f.sort_order} onChange={(e) => set({ sort_order: Number(e.target.value) })} /></div>
          <div className="flex items-center gap-x-2"><Switch checked={f.is_active} onCheckedChange={(v) => set({ is_active: v })} /><Label>Active</Label></div>

          {kind === "addon" && (
            <div className="flex flex-col gap-y-2">
              <Label>Offered on these products ({f.product_ids?.length ?? 0})</Label>
              <Text size="xsmall" className="text-ui-fg-subtle">Products you do not tick will not show this add-on.</Text>
              <Input placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
              <div className="max-h-64 overflow-y-auto rounded-md border p-2 flex flex-col gap-y-1">
                {shown.map((p) => (
                  <label key={p.id} className="flex items-center gap-x-2 text-sm">
                    <input type="checkbox" checked={f.product_ids?.includes(p.id) ?? false} onChange={() => toggleProduct(p.id)} />
                    {p.title}
                  </label>
                ))}
              </div>
            </div>
          )}
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} isLoading={saving}>Save</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

function List({
  kind, items, products, reload,
}: { kind: "addon" | "packing"; items: Item[]; products: Product[]; reload: () => void }) {
  const [editing, setEditing] = useState<Item | null>(null)
  const base = kind === "addon" ? "/admin/addons" : "/admin/packing-options"
  const remove = async (id: string) => {
    if (!confirm("Delete this?")) return
    await sdk.client.fetch(`${base}/${id}`, { method: "DELETE" })
    toast.success("Deleted")
    reload()
  }
  const productName = (id: string) => products.find((p) => p.id === id)?.title ?? id
  return (
    <div className="flex flex-col gap-y-3 py-4">
      <div className="flex justify-end">
        <Button size="small" onClick={() => setEditing({ name: "", price: 0, is_active: true, sort_order: 0, product_ids: [] })}>Add</Button>
      </div>
      {items.length === 0 && <Text className="text-ui-fg-muted">Nothing here yet.</Text>}
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-x-3 rounded-lg border p-3">
          {it.image ? <img src={it.image} alt="" className="h-14 w-14 rounded object-cover" /> : <div className="h-14 w-14 rounded bg-ui-bg-subtle" />}
          <div className="flex-1 min-w-0">
            <Text weight="plus" className="truncate">{it.name}</Text>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
              <Badge size="2xsmall">{it.is_default ? "Included" : it.price ? fmt(it.price) : "Free"}</Badge>
              {it.is_default && <Badge size="2xsmall" color="blue">Default</Badge>}
              <Badge size="2xsmall" color={it.is_active ? "green" : "grey"}>{it.is_active ? "Active" : "Off"}</Badge>
              {kind === "addon" && (
                <Badge size="2xsmall" color="grey">
                  {(it.product_ids?.length ?? 0) === 0
                    ? "No products yet"
                    : (it.product_ids!.length <= 2 ? it.product_ids!.map(productName).join(", ") : `${it.product_ids!.length} products`)}
                </Badge>
              )}
            </div>
          </div>
          <Button size="small" variant="secondary" onClick={() => setEditing(it)}>Edit</Button>
          <Button size="small" variant="danger" onClick={() => remove(it.id!)}>Delete</Button>
        </div>
      ))}
      <ItemDrawer kind={kind} item={editing} products={products} onClose={() => setEditing(null)} onSaved={reload} />
    </div>
  )
}

function PackingSwitch() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  useEffect(() => {
    sdk.client.fetch<{ enabled: boolean }>("/admin/packing-settings").then((r) => setEnabled(r.enabled))
  }, [])
  const toggle = async (v: boolean) => {
    setEnabled(v)
    try {
      await sdk.client.fetch("/admin/packing-settings", { method: "POST", body: { enabled: v } })
      toast.success(v ? "Packing shown at checkout" : "Packing hidden at checkout")
    } catch (e: any) {
      setEnabled(!v)
      toast.error(e?.message || "Could not change")
    }
  }
  return (
    <div className="flex items-center gap-x-3 rounded-lg border p-3 mt-4">
      <Switch checked={!!enabled} disabled={enabled === null} onCheckedChange={toggle} />
      <div>
        <Label>Show packing at checkout</Label>
        <Text size="xsmall" className="text-ui-fg-subtle">Off hides the whole packing section. The default packing is preselected; upgrades are optional.</Text>
      </div>
    </div>
  )
}

const AddonsPage = () => {
  const [addons, setAddons] = useState<Item[]>([])
  const [packing, setPacking] = useState<Item[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const reload = useCallback(() => {
    sdk.client.fetch<{ addons: Item[] }>("/admin/addons").then((r) => setAddons(r.addons))
    sdk.client.fetch<{ options: Item[] }>("/admin/packing-options").then((r) => setPacking(r.options))
  }, [])
  useEffect(reload, [reload])
  useEffect(() => {
    sdk.admin.product.list({ limit: 200, fields: "id,title" } as any).then((r: any) =>
      setProducts((r.products as Product[]).filter((p) => p.title !== "Packing (internal)"))
    )
  }, [])
  return (
    <Container className="p-6">
      <Heading level="h1">Add-ons &amp; packing</Heading>
      <Text className="text-ui-fg-subtle mt-1">Add-ons are extras on a bag (laptop pocket, key tag). You choose which products offer each one.</Text>
      <Tabs defaultValue="addons" className="mt-4">
        <Tabs.List>
          <Tabs.Trigger value="addons">Add-ons</Tabs.Trigger>
          <Tabs.Trigger value="packing">Packing</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="addons"><List kind="addon" items={addons} products={products} reload={reload} /></Tabs.Content>
        <Tabs.Content value="packing"><PackingSwitch /><List kind="packing" items={packing} products={products} reload={reload} /></Tabs.Content>
      </Tabs>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Add-ons & packing", icon: Sparkles })
export default AddonsPage
