import LocalizedClientLink from "@modules/common/components/localized-client-link"

const categories = [
  {
    title: "Outerwear",
    handle: "outerwear",
    image: "https://images.unsplash.com/photo-1551028719-01c8cd11d820?q=80&w=1200&auto=format&fit=crop"
  },
  {
    title: "Tops",
    handle: "tops",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop"
  },
  {
    title: "Bottoms",
    handle: "bottoms",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop"
  }
]

export default function CategoriesGrid() {
  return (
    <div className="content-container py-12 small:py-24 max-w-[1440px] mx-auto px-6 md:px-16">
      <div className="flex flex-col gap-6 mb-8 relative">
        <h2 className="text-[2rem] font-extrabold tracking-tight uppercase">Shop by Category</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, idx) => (
          <LocalizedClientLink 
            key={idx} 
            href={`/categories/${cat.handle}`}
            className="group relative h-[400px] md:h-[500px] lg:h-[600px] w-full overflow-hidden rounded-[24px]"
          >
            <img 
              src={cat.image} 
              alt={cat.title} 
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
            <div className="absolute bottom-8 left-8">
              <h3 className="text-3xl font-black uppercase text-white tracking-wider drop-shadow-md">
                {cat.title}
              </h3>
              <span className="inline-block mt-2 text-white font-semibold underline underline-offset-4 decoration-2 decoration-transparent group-hover:decoration-white transition-all duration-300">
                Explore
              </span>
            </div>
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}
