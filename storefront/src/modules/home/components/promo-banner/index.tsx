import Image from "next/image"

export default function PromoBanner() {
  return (
    <div className="content-container max-w-[1440px] mx-auto px-6 md:px-16 mb-12">
      <a 
        href="https://wa.me/94779497859?text=Hello%2C%20I'm%20interested%20in%20consulting%20about%20a%20bespoke%20order."
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-[350px] md:h-[500px] lg:h-[700px] rounded-3xl overflow-hidden relative group"
      >
        <Image
          src="/home/cardle-custom-make-to-order-tote-bags.jpg"
          alt="Cardle - Bespoke Craftsmanship"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1440px) 100vw, 1440px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 md:p-12">
          <span className="text-gray-300 uppercase tracking-[0.3em] text-xs md:text-sm font-semibold mb-4 md:mb-6 drop-shadow-md">
            Bespoke Craftsmanship
          </span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tighter text-white drop-shadow-xl mb-4 md:mb-6 max-w-4xl leading-[1.1]">
            Design Your Signature Carry
          </h2>
          <p className="text-gray-200 text-sm md:text-base max-w-xl font-medium mb-8 md:mb-10 drop-shadow-md leading-relaxed hidden md:block">
            Collaborate directly with our artisans to engineer the perfect everyday vessel. 
            Tailor the dimensions, finishes, and details to create a piece that is unmistakably yours.
          </p>
          <span className="inline-flex items-center gap-3 bg-white text-black px-8 md:px-10 py-3 md:py-4 rounded-full text-xs md:text-sm font-bold tracking-widest uppercase hover:bg-gray-200 hover:scale-105 transition-all duration-300">
            Consult via WhatsApp
          </span>
        </div>
      </a>
    </div>
  )
}
