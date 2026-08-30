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

      {/* The homepage had no <h1> at all — every heading jumped straight to
          H2 ("Popular Right Now", etc). Visually hidden since the hero
          image already carries the visual message; this exists purely so
          the page has exactly one, meaningful top-level heading. */}
      <h1 className="sr-only">Cardle – Premium Cotton Tote Bags, Handcrafted in Sri Lanka</h1>
    </div>
  )
}

export default Hero
