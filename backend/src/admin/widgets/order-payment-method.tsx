import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Badge } from "@medusajs/ui"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"

enum PaymentMethod {
  pp_onepay_onepay = "OnePay",
  pp_koko_koko = "Koko",
  pp_system_default = "COD",
  pp_stripe_stripe = "Stripe",
}

const OrderPaymentWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const paymentCollection = data.payment_collections?.[0]
  if (!paymentCollection) return null

  // In Medusa v2, payment providers are nested in payments array or on the collection
  const providerId = paymentCollection.payments?.[0]?.provider_id || paymentCollection.payments?.[0]?.payment_session?.provider_id || "Unknown"
  
  if (!providerId) return null

  // Resolve the formatted name from the enum, fallback to the raw ID if not found
  const formattedName = PaymentMethod[providerId as keyof typeof PaymentMethod] || providerId

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Payment Method</Heading>
      </div>
      <div className="px-6 py-4 flex items-center gap-2">
        <Badge size="base" color="green">
          {formattedName}
        </Badge>
        {formattedName !== providerId && (
          <Text className="text-ui-fg-subtle text-small">({providerId})</Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default OrderPaymentWidget
