import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowRight } from "@medusajs/icons"

// Shrunk from a full photo grid (2 images + 2 boxes) down to a compact
// strip — the images moved to the hero carousel, which needed more slides
// more than this section needed its own dedicated photography.
export default function FeatureGrid() {
  return (
    <div className="content-container max-w-[1440px] mx-auto px-6 md:px-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-[#f7f7f7] rounded-3xl p-8 md:p-12">
        <div>
          <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tighter text-bold mb-2 leading-tight">
            CARDLE - ELEVATING THE EVERYDAY CARRY
          </h2>
          <p className="text-gray-600 font-medium text-sm md:text-base max-w-xl">
            A Sri Lankan brand redefining what one bag can do. We designed the
            ultimate solution: a singular, massive capacity vessel engineered
            to carry everything you need, beautifully.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          <LocalizedClientLink
            href="/about"
            className="group/btn inline-flex items-center justify-between gap-4 bg-black text-white pl-6 pr-3 py-3 rounded-full text-sm font-bold tracking-widest hover:bg-gray-800 transition-colors"
          >
            Read our story
            <div className="bg-white text-black p-1 rounded-full flex items-center justify-center transform group-hover/btn:translate-x-1 transition-transform duration-300">
              <ArrowRight className="w-4 h-4" />
            </div>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/store"
            className="group/btn inline-flex items-center justify-between gap-4 bg-white text-black border border-gray-200 pl-6 pr-3 py-3 rounded-full text-sm font-bold tracking-widest hover:bg-gray-100 transition-colors"
          >
            Shop the collection
            <div className="bg-black text-white p-1 rounded-full flex items-center justify-center transform group-hover/btn:translate-x-1 transition-transform duration-300">
              <ArrowRight className="w-4 h-4" />
            </div>
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
