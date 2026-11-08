import Image from "next/image"

export default function PromoBanner() {
  return (
    <div className="content-container max-w-[1440px] mx-auto px-6 md:px-16 mb-12">
      <a
        href="https://wa.me/94779497859?text=Hello%2C%20I'm%20interested%20in%20consulting%20about%20a%20bespoke%20order."
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-[160px] md:h-[200px] rounded-2xl overflow-hidden relative"
      >
        <Image
          src="/home/cardle-custom-make-to-order-tote-bags.jpg"
          alt="Cardle - Bespoke Craftsmanship"
          fill
          sizes="(max-width: 1440px) 100vw, 1440px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/45" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h2 className="text-xl md:text-3xl font-semibold text-white mb-1">
            Design your signature carry
          </h2>
          <p className="text-white/80 text-xs md:text-sm">
            Bespoke craftsmanship, made to order. Chat with us on WhatsApp.
          </p>
        </div>
      </a>
    </div>
  )
}
