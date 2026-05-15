const Hero = () => {
  return (
    <div className="h-[90vh] w-full relative overflow-hidden bg-[#e5e5e5] flex flex-col items-center justify-center">
      {/* Background Image Placeholder */}
      <img
        src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2574&auto=format&fit=crop"
        alt="Hero Background"
        className="absolute inset-0 w-full h-full object-cover object-top opacity-90"
      />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[1440px] px-6 md:px-16 flex flex-col items-center justify-center text-center h-full pt-16">
        
        {/* Main Title */}
        <h1 className="text-[4.5rem] md:text-[8rem] lg:text-[11rem] font-extrabold tracking-tighter leading-[0.85] text-white mix-blend-difference drop-shadow-sm uppercase">
          Define<br />
          Your Base
        </h1>
      </div>
    </div>
  )
}

export default Hero
