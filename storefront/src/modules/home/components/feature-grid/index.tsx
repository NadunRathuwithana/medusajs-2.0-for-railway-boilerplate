import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowRight } from "@medusajs/icons"
import Image from "next/image"

export default function FeatureGrid() {
  return (
    <div className="content-container max-w-[1440px] mx-auto px-6 md:px-16">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
        <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter max-w-2xl leading-tight text-bold">
          CARDLE - ELEVATING THE EVERYDAY CARRY
        </h2>
        <p className="max-w-md text-gray-600 font-medium">
          A Sri Lankan brand redefining what one bag can do. We designed the
          ultimate solution: a singular, massive capacity vessel engineered to
          carry everything you need, beautifully.
        </p>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Top Left Image (Spans 2 columns) */}
        <div className="group col-span-1 lg:col-span-2 h-[300px] md:h-[400px] lg:h-[450px] w-full rounded-3xl overflow-hidden relative">
          <Image
            src="/home/uncompromising-craftmanship-cardle.jpg"
            alt="Cardle Uncompromising Craftsmanship - Premium Cotton Everyday Carry Bag"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 66vw"
            className="object-cover object-center"
          />
        </div>

        {/* Top Right Black Box */}
        <div className="group col-span-1 h-[300px] md:h-[400px] lg:h-[450px] w-full rounded-3xl bg-[#111111] text-white p-8 md:p-12 flex flex-col justify-end hover:bg-[#1a1a1a] transition-colors duration-700">
          <h3 className="text-2xl font-semibold uppercase tracking-tight mb-4 leading-none">
            UNCOMPROMISING CRAFTSMANSHIP
          </h3>
          <p className="text-sm text-gray-400 font-medium mb-8 line-clamp-6">
            Built on a foundation of absolute strength. 100% Pure Premium Cotton
            combined with zero stretch engineering ensures our bags retain their
            architectural silhouette, no matter how much you pack inside.
          </p>
          <LocalizedClientLink
            href="/about"
            className="group/btn inline-flex items-center justify-between w-fit gap-4 bg-white text-black text-bold pl-6 pr-3 py-3 rounded-full text-sm font-bold tracking-widest hover:bg-gray-200 transition-colors"
          >
            Read our story
            <div className="bg-black text-white p-1 rounded-full flex items-center justify-center transform group-hover/btn:translate-x-1 transition-transform duration-300">
              <ArrowRight className="w-4 h-4" />
            </div>
          </LocalizedClientLink>
        </div>

        {/* Bottom Left Gray Box */}
        <div className="group col-span-1 h-[300px] md:h-[400px] lg:h-[450px] w-full rounded-3xl bg-[#EBEBEB] text-bold p-8 md:p-12 flex flex-col justify-end hover:bg-[#E0E0E0] transition-colors duration-700">
          <h3 className="text-2xl font-bold uppercase tracking-tight mb-4 leading-none">
            STATUS MEETS UTILITY
          </h3>
          <p className="text-sm text-gray-600 font-medium mb-8 line-clamp-6">
            Cardle bridges the gap between a heavy-duty workhorse and a premium
            luxury item. By utilizing clean lines and minimalist design
            principles, we deliver a Quiet Luxury experience.
          </p>
          <LocalizedClientLink
            href="/store"
            className="group/btn inline-flex items-center justify-between w-fit gap-4 bg-[#111111] text-white pl-6 pr-3 py-3 rounded-full text-sm font-bold tracking-widest hover:bg-gray-800 transition-colors"
          >
            Shop the collection
            <div className="bg-white text-[#111111] p-1 rounded-full flex items-center justify-center transform group-hover/btn:translate-x-1 transition-transform duration-300">
              <ArrowRight className="w-4 h-4" />
            </div>
          </LocalizedClientLink>
        </div>

        {/* Bottom Right Image (Spans 2 columns) */}
        <div className="group col-span-1 lg:col-span-2 h-[300px] md:h-[400px] lg:h-[450px] w-full rounded-3xl overflow-hidden relative">
          <Image
            src="/home/status-meets-utility.jpg"
            alt="Cardle Status Meets Utility - Quiet Luxury Everyday Carry Bag"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 66vw"
            className="object-cover object-center"
          />
        </div>
      </div>
    </div>
  )
}
