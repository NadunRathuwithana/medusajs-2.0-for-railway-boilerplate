import ResponsiveHeroImage from "@modules/common/components/responsive-hero-image"

const Hero = () => {
  return (
    <div className="h-[90vh] w-full relative overflow-hidden bg-[#e5e5e5] flex flex-col items-center justify-center">
      <ResponsiveHeroImage
        variants={[
          {
            src: "/home/cardle-premium-cotton-tote-bag-sri-lanka-mobile.jpg",
            alt: "Cardle handcrafted cotton tote bags – shop Sri Lanka's premium make-to-order bags",
            media: "(max-width: 767px)",
            className: "block md:hidden object-cover object-top",
          },
          {
            src: "/home/cardle-premium-cotton-tote-bag-sri-lanka-tablet.jpg",
            alt: "Cardle premium canvas tote bags handcrafted in Sri Lanka",
            media: "(min-width: 768px) and (max-width: 1023px)",
            className: "hidden md:block lg:hidden object-cover object-top",
          },
          {
            src: "/home/cardle-premium-cotton-tote-bag-sri-lanka.jpg",
            alt: "Cardle premium canvas tote bags handcrafted in Sri Lanka – make to order",
            media: "(min-width: 1024px)",
            className: "hidden lg:block object-cover object-top",
          },
        ]}
      />
    </div>
  )
}

export default Hero
