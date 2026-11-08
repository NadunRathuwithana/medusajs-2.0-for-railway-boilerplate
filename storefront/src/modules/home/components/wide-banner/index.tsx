import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowRight } from "@medusajs/icons"

// Full-width statement banner — takes over the "ELEVATING THE EVERYDAY
// CARRY" messaging in a bigger, wider format now that feature-grid has
// shrunk down to a compact strip at the end of the page.
export default function WideBanner() {
  return (
    <div className="w-full bg-[#111111] text-white">
      <div className="content-container max-w-[1440px] mx-auto px-6 md:px-16 py-16 md:py-24 flex flex-col items-center text-center">
        <span className="text-gray-400 uppercase tracking-[0.3em] text-xs md:text-sm font-semibold mb-4">
          Cardle
        </span>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tighter leading-[1.05] mb-6 max-w-4xl">
          Elevating The Everyday Carry
        </h2>
        <p className="text-gray-400 text-sm md:text-base max-w-xl font-medium mb-10 leading-relaxed">
          One bag. Massive capacity. Engineered to carry everything you need,
          beautifully.
        </p>
        <LocalizedClientLink
          href="/store"
          className="group/btn inline-flex items-center gap-4 bg-white text-black pl-8 pr-4 py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors"
        >
          Shop the Collection
          <div className="bg-black text-white p-1 rounded-full flex items-center justify-center transform group-hover/btn:translate-x-1 transition-transform duration-300">
            <ArrowRight className="w-4 h-4" />
          </div>
        </LocalizedClientLink>
      </div>
    </div>
  )
}
