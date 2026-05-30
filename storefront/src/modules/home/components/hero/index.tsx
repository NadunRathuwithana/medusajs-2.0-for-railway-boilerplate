const Hero = () => {
  return (
    <div className="h-[90vh] w-full relative overflow-hidden bg-[#e5e5e5] flex flex-col items-center justify-center">
      {/* Mobile Background Image (< 768px) */}
      <img
        src="/home/hero-mobile.jpg"
        alt="Hero Background Mobile"
        className="block md:hidden absolute inset-0 w-full h-full object-cover object-top"
      />

      {/* Tablet Background Image (768px – 1023px) */}
      <img
        src="/home/hero-tab.jpg"
        alt="Hero Background Tablet"
        className="hidden md:block lg:hidden absolute inset-0 w-full h-full object-cover object-top"
      />

      {/* Desktop Background Image (1024px+) */}
      <img
        src="/home/hero-1.jpg"
        alt="Hero Background Desktop"
        className="hidden lg:block absolute inset-0 w-full h-full object-cover object-top"
      />
    </div>
  )
}

export default Hero
