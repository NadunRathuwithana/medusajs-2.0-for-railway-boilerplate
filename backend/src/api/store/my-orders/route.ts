import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const query = req.scope.resolve("query")
  const customerModuleService = req.scope.resolve("customer")
  
  const customer = await customerModuleService.retrieveCustomer(customerId)

  if (!customer || !customer.email) {
    return res.status(404).json({ message: "Customer not found or email missing" })
  }

  const { data, metadata } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "status",
      "created_at",
      "total",
      "currency_code",
      "email",
      "payment_status",
      "fulfillment_status",
      "items.*",
      "items.variant.*",
      "items.product.*",
      "payment_collections.*",
      "payment_collections.payments.*",
    ],
    filters: {
      $or: [
        { customer_id: customerId },
        { email: customer.email }
      ]
    },
    pagination: {
      skip: 0,
      take: 50,
    }
  })

  res.json({
    orders: data,
    count: metadata?.count || data.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || 50,
  })
}
