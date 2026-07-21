import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { StoreProductCategory, StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import BreadcrumbJsonLd from "@modules/seo/components/breadcrumb-json-ld"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: { category: string[]; countryCode: string }
  searchParams: {
    sortBy?: SortOptions
    page?: string
  }
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map(
    (category: any) => category.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: any) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { product_categories } = await getCategoryByHandle(
      params.category
    )

    const title = product_categories
      .map((category: StoreProductCategory) => category.name)
      .join(" | ")

    const lastCategory = product_categories[product_categories.length - 1]
    const description =
      lastCategory.description ||
      `Shop Cardle's ${title} – handcrafted canvas tote bags made to order in Sri Lanka.`

    const canonicalUrl = `https://cardle.lk/categories/${params.category.join("/")}`

    return {
      title: `${title} | Cardle`,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${title} | Cardle`,
        description,
        type: "website",
        url: canonicalUrl,
        siteName: "Cardle",
        images: [
          {
            url: "https://cardle.lk/store/buy-cotton-tote-bags-online-sri-lanka.jpg",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | Cardle`,
        description,
        images: ["https://cardle.lk/store/buy-cotton-tote-bags-online-sri-lanka.jpg"],
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { sortBy, page } = searchParams

  const { product_categories } = await getCategoryByHandle(
    params.category
  )

  if (!product_categories) {
    notFound()
  }

  const categoryUrl = `https://cardle.lk/categories/${params.category.join("/")}`
  const categoryName = product_categories
    .map((category: StoreProductCategory) => category.name)
    .join(" | ")

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://cardle.lk" },
          { name: "Store", url: "https://cardle.lk/store" },
          { name: categoryName, url: categoryUrl },
        ]}
      />
      <CategoryTemplate
        categories={product_categories}
        sortBy={sortBy}
        page={page}
        countryCode={params.countryCode}
      />
    </>
  )
}
