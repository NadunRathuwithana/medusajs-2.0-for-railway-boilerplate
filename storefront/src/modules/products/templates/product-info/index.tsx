import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4">
        {product.collection ? (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="px-4 py-1.5 border border-gray-200 rounded-full text-xs font-medium w-fit hover:bg-gray-50 transition-colors"
          >
            {product.collection.title}
          </LocalizedClientLink>
        ) : (
          <span className="px-4 py-1.5 border border-gray-200 rounded-full text-xs font-medium w-fit">
            Fashion
          </span>
        )}
        
        <Heading
          level="h1"
          className="text-3xl md:text-4xl lg:text-[40px] font-semibold text-ui-fg-base tracking-tight"
          data-testid="product-title"
        >
          {product.title}
        </Heading>
      </div>
    </div>
  )
}

export default ProductInfo
