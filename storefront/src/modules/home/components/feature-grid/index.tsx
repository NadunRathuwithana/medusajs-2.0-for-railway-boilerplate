import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowRight } from "@medusajs/icons"

export default function FeatureGrid() {
  return (
    <div className="content-container py-12 small:py-24 max-w-[1440px] mx-auto px-6 md:px-16">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter max-w-2xl leading-tight text-black">
          SHIP YOUR WEBSITE QUICKLY WITH FRAMEBLOX
        </h2>
        <p className="max-w-md text-gray-600 font-medium">
          Use prebuilt templates and components for a professional, stunning look. Save time and focus on content with our user-friendly, customizable design solutions.
        </p>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Top Left Image (Spans 2 columns) */}
        <div className="col-span-1 lg:col-span-2 h-[300px] md:h-[400px] lg:h-[450px] w-full rounded-3xl overflow-hidden relative">
          <img 
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1620&auto=format&fit=crop" 
            alt="Fashion Model in Orange" 
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </div>

        {/* Top Right Black Box */}
        <div className="col-span-1 h-[300px] md:h-[400px] lg:h-[450px] w-full rounded-3xl bg-[#111111] text-white p-8 md:p-12 flex flex-col justify-end">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4 leading-none">
            BUILT BY THE STREETS, MADE FOR YOU
          </h3>
          <p className="text-sm text-gray-400 font-medium mb-8 line-clamp-3">
            From the streets to your style—our journey is all about self-expression and rebellion. Join the movement.
          </p>
          <LocalizedClientLink href="/about" className="inline-flex items-center justify-between w-fit gap-4 bg-white text-black px-6 py-3 rounded-full text-sm font-bold tracking-widest hover:bg-gray-200 transition-colors">
            Read our story
            <div className="bg-black text-white p-1 rounded-full flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </div>
          </LocalizedClientLink>
        </div>

        {/* Bottom Left Gray Box */}
        <div className="col-span-1 h-[300px] md:h-[400px] lg:h-[450px] w-full rounded-3xl bg-[#EBEBEB] text-black p-8 md:p-12 flex flex-col justify-end">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4 leading-none">
            ELEVATE YOUR STREET GAME
          </h3>
          <p className="text-sm text-gray-600 font-medium mb-8 line-clamp-3">
            From bold graphics to everyday essentials, explore our latest drops and signature pieces designed for the culture.
          </p>
          <LocalizedClientLink href="/store" className="inline-flex items-center justify-between w-fit gap-4 bg-[#111111] text-white px-6 py-3 rounded-full text-sm font-bold tracking-widest hover:bg-gray-800 transition-colors">
            Shop collections
            <div className="bg-white text-black p-1 rounded-full flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </div>
          </LocalizedClientLink>
        </div>

        {/* Bottom Right Image (Spans 2 columns) */}
        <div className="col-span-1 lg:col-span-2 h-[300px] md:h-[400px] lg:h-[450px] w-full rounded-3xl overflow-hidden relative">
          <img 
            src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1740&auto=format&fit=crop" 
            alt="White T-Shirt Hanging" 
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </div>

      </div>
    </div>
  )
}
