import { getProductsById } from "@lib/data/products"
import { listCartPaymentMethods } from "@lib/data/payment"
import { isKoko } from "@lib/constants"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 */
export default async function ProductActionsWrapper({
  id,
  region,
}: {
  id: string
  region: HttpTypes.StoreRegion
}) {
  const [product, paymentProviders] = await Promise.all([
    getProductsById({
      ids: [id],
      regionId: region.id,
    }).then((res) => res[0]),
    listCartPaymentMethods(region.id)
  ])

  if (!product) {
    return null
  }

  const isKokoEnabled = paymentProviders?.some((p) => isKoko(p.id)) || false

  return <ProductActions product={product} region={region} isKokoEnabled={isKokoEnabled} />
}
