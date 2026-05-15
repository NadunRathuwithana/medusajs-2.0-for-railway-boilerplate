import { getProductsList } from "@lib/data/products"
import PopularSlider from "./popular-slider"

export default async function PopularProducts({
  countryCode,
  title = "Popular Right Now",
}: {
  countryCode: string
  title?: string
}) {
  // Fetch up to 10 latest or popular products to show in the slider
  const { response } = await getProductsList({
    pageParam: 1,
    queryParams: {
      limit: 10,
    },
    countryCode,
  })

  if (!response.products || response.products.length === 0) {
    return null
  }

  return (
    <div className="content-container py-12 small:py-24 max-w-[1440px] mx-auto px-6 md:px-16">
      <div className="flex flex-col gap-6 mb-4 relative">
        <h2 className="text-4xl font-semibold text-black tracking-tight uppercase">
          {title}
        </h2>
      </div>

      <PopularSlider products={response.products} />
    </div>
  )
}
