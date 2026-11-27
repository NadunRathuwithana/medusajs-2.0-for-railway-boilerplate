import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Badge } from "@medusajs/ui"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"

/** Shows what the packer must add: add-ons per bag, chosen packing, second phone. */
const OrderAddonsPackingWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const items: any[] = (data.items as any[]) || []
  const withAddons = items.filter((i) => Array.isArray(i?.metadata?.addons) && i.metadata.addons.length)
  const packing = items.filter((i) => i?.metadata?.packing === true)
  const meta: any = data.metadata || {}
  const phone2 = meta.contact_phone_2 || (data.shipping_address as any)?.metadata?.contact_phone_2

  if (!withAddons.length && !packing.length && !phone2 && !meta.phone_missing) return null

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Add-ons and packing</Heading>
      </div>
      {withAddons.length > 0 && (
        <div className="px-6 py-4 flex flex-col gap-3">
          {withAddons.map((i) => (
            <div key={i.id}>
              <Text weight="plus" size="small">
                {i.product_title || i.title} {i.variant_title ? `(${i.variant_title})` : ""} x {i.quantity}
              </Text>
              <div className="flex flex-wrap gap-1 mt-1">
                {i.metadata.addons.map((a: any) => (
                  <Badge key={a.id || a.name} size="2xsmall" color="blue">{a.name}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">Packing</Text>
        <Text size="small" weight="plus">
          {packing.length
            ? packing.map((p) => p.metadata?.packing_name || "Extra").join(", ") + " (plus standard)"
            : "Standard packing"}
        </Text>
      </div>
      {(phone2 || meta.phone_missing) && (
        <div className="px-6 py-4">
          {phone2 && <Text size="small">Second phone: {String(phone2)}</Text>}
          {meta.phone_missing && <Badge size="2xsmall" color="red">Phone missing, call before dispatch</Badge>}
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default OrderAddonsPackingWidget
