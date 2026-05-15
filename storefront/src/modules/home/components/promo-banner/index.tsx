import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function PromoBanner() {
  return (
    <div className="w-full bg-[#111111] text-white py-24 my-12 small:my-24 overflow-hidden relative">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center', mixBlendMode: 'luminosity' }}></div>
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-16 flex flex-col items-center justify-center text-center">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-6">
          The New Essentials
        </h2>
        <p className="max-w-xl text-gray-300 text-lg md:text-xl font-medium mb-10 leading-relaxed">
          Elevate your daily rotation with our latest drop. Premium fabrics, tailored fits, and timeless designs built for the modern wardrobe.
        </p>
        <LocalizedClientLink 
          href="/store"
          className="bg-white text-black px-10 py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.3)]"
        >
          Shop The Collection
        </LocalizedClientLink>
      </div>
    </div>
  )
}
