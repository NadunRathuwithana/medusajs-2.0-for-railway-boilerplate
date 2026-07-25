import Image from "next/image"

const Hero = () => {
  return (
    <div className="h-[90vh] w-full relative overflow-hidden bg-[#e5e5e5] flex flex-col items-center justify-center">
      {/* Mobile Background Image (< 768px) */}
      <Image
        src="/home/cardle-premium-cotton-tote-bag-sri-lanka-mobile.jpg"
        alt="Cardle handcrafted cotton tote bags – shop Sri Lanka's premium make-to-order bags"
        fill
        sizes="100vw"
        className="block md:hidden object-cover object-top"
        priority
      />

      {/* Tablet Background Image (768px – 1023px) */}
      <Image
        src="/home/cardle-premium-cotton-tote-bag-sri-lanka-tablet.jpg"
        alt="Cardle premium canvas tote bags handcrafted in Sri Lanka"
        fill
        sizes="100vw"
        className="hidden md:block lg:hidden object-cover object-top"
        priority
      />

      {/* Desktop Background Image (1024px+) */}
      <Image
        src="/home/cardle-premium-cotton-tote-bag-sri-lanka.jpg"
        alt="Cardle premium canvas tote bags handcrafted in Sri Lanka – make to order"
        fill
        sizes="100vw"
        className="hidden lg:block object-cover object-top"
        priority
      />

      {/* PLACEHOLDER copy — replace with final wording */}
      {/* <div className="absolute inset-0 flex items-end justify-start p-6 md:p-10 bg-gradient-to-t from-black/40 via-transparent to-transparent">
        <h1 className="text-white text-sm md:text-base font-semibold uppercase tracking-wide max-w-xs drop-shadow-md">
          Premium Cotton Tote Bags, Handcrafted in Sri Lanka
        </h1>
      </div> */}
    </div>
  )
}

export default Hero
