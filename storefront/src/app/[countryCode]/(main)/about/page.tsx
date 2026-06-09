import { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Cardle | Sri Lanka's Make-to-Order Cotton Tote Bag Brand",
  description: "Learn about the Cardle story. Elevating the everyday carry with zero-stretch engineering and premium materials. Cardle - Carry everything, compromise nothing.",
}

export default function AboutPage() {
  return (
    <div className="w-full bg-white">
      {/* 1. Hero Banner */}
      <section className="h-[90vh] w-full relative overflow-hidden bg-[#111111] flex flex-col items-center justify-center">
        <picture>
          <source media="(max-width: 768px)" srcSet="/about/cardle-about-premium-cotton-tote-bags-mobile.jpg" />
          <source media="(max-width: 1024px)" srcSet="/about/cardle-about-premium-cotton-tote-bags-tablet.jpg" />
          <img
            src="/about/cardle-about-premium-cotton-tote-bags.jpg"
            alt="Cardle Hero Banner"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </picture>
      </section>

      {/* 2. The Story Section */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          <div className="group w-full lg:w-1/2 h-[400px] md:h-[600px] rounded-3xl overflow-hidden relative cursor-pointer">
            <img
              src="/about/cardle-story-handmade-tote-bags.jpg"
              alt="Person walking with bag"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-[1500ms] pointer-events-none" />
          </div>

          <div className="w-full lg:w-1/2 flex flex-col gap-6 text-sm text-gray-600 font-medium">
            <div>
              <h2 className="text-xs text-black font-bold tracking-[0.2em] uppercase mb-4">
                The Cardle Story
              </h2>
              <h3 className="text-3xl text-black md:text-5xl font-bold uppercase tracking-tighter leading-tight mb-6">
                PREPARED FOR THE FAST-PACED WORLD.
              </h3>
            </div>

            <p className="leading-relaxed">
              You are a university student with a full day of lectures. A professional 
              hopping between meetings. Someone who just needs to get through the day 
              without losing anything. You are carrying your whole life with you.
            </p>
            <p className="leading-relaxed">
              Laptop, textbooks, documents, water bottle, charger, the things you 
              always forget and then wish you had. The list never gets shorter.
            </p>
            <p className="leading-relaxed">
              For too long, the answer was more bags. A tote for this, a backpack for 
              that, a side bag just in case. It is exhausting. It looks chaotic. And 
              it quietly undermines the put-together image you are trying to hold up.
            </p>
            <p className="text-xl font-bold uppercase tracking-tight mt-4">
              CARDLE WAS BUILT TO FIX THAT.
            </p>
          </div>
        </div>
      </section>

      {/* 3. The Big Quote / Break */}
      <section className="py-32 px-6 bg-[#111111] text-center flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <img
            src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=2572&auto=format&fit=crop"
            alt="Texture"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white uppercase tracking-tighter leading-tight mb-8">
            "WHY CAN'T ONE BAG HOLD EVERYTHING AND STILL LOOK GOOD?"
          </h2>
          <p className="text-sm md:text-base text-gray-400 font-medium">
            That was the question. So we built the answer: one bag, big enough for 
            everything you carry, made to look like it belongs somewhere expensive.
          </p>
        </div>
      </section>

      {/* 4. Craftsmanship & Materials */}
      <section className="py-24 md:py-32 px-6 bg-white">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <h2 className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase mb-4">
              Zero Compromise
            </h2>
            <h3 className="text-3xl md:text-5xl font-bold uppercase tracking-tighter leading-tight">
              BUILT TO LAST
            </h3>
            <p className="text-sm text-gray-600 font-medium mt-6">
              A bag that carries your whole day needs to be built for exactly that. 
              We did not cut corners on material or construction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-[#111111] text-white p-8 md:p-12 rounded-3xl flex flex-col justify-end min-h-[350px] hover:bg-[#1a1a1a] transition-colors duration-700">
              <h4 className="text-2xl font-semibold uppercase tracking-tight text-white mb-4 leading-none">
                PREMIUM MATERIALS
              </h4>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                We use high-grade, eco-friendly canvas on every piece. It breathes 
                well, washes clean, and holds up over years of daily use without 
                looking worn out.
              </p>
            </div>

            <div className="group h-[350px] md:h-auto rounded-3xl overflow-hidden relative cursor-pointer">
              <img
                src="/about/cardle-premium-natural-cotton-materials.jpg"
                alt="Premium Materials"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-[1500ms] pointer-events-none" />
            </div>

            <div className="group h-[350px] md:h-auto rounded-3xl overflow-hidden relative order-4 md:order-3 cursor-pointer">
              <img
                src="/about/cardle-zero-stretch-engineering-tote-bag.jpg"
                alt="Craftsmanship"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-[1500ms] pointer-events-none" />
            </div>

            <div className="bg-[#111111] text-white p-8 md:p-12 rounded-3xl flex flex-col justify-end min-h-[350px] hover:bg-[#1a1a1a] transition-colors duration-700 order-3 md:order-4">
              <h4 className="text-2xl font-semibold uppercase tracking-tight mb-4 leading-none">
                ZERO-STRETCH ENGINEERING
              </h4>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                Most bags sag the moment you push them past half capacity. Cardle 
                uses a heavy-duty canvas weave that holds its shape whether you have 
                packed one laptop or four textbooks. The bag looks the same full as 
                it does empty.
              </p>
            </div>

            <div className="bg-[#111111] text-white p-8 md:p-12 rounded-3xl flex flex-col justify-end min-h-[350px] hover:bg-[#1a1a1a] transition-colors duration-700 order-5">
              <h4 className="text-2xl font-semibold uppercase tracking-tight mb-4 leading-none">
                HANDCRAFTED WITH PURPOSE
              </h4>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                Every bag is cut, sewn, and assembled by hand. Not for the story, 
                but because it genuinely produces a better result than mass production.
              </p>
            </div>

            <div className="bg-[#111111] text-white p-8 md:p-12 rounded-3xl flex flex-col justify-end min-h-[350px] hover:bg-[#1a1a1a] transition-colors duration-700 order-6">
              <h4 className="text-2xl font-semibold uppercase tracking-tight text-white mb-4 leading-none">
                TESTED BEFORE IT REACHES YOU
              </h4>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                Before packaging, every batch goes through stretch and load testing 
                to make sure it handles real daily pressure. If it does not pass, 
                it does not ship.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Aesthetic Section */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          <div className="w-full lg:w-1/2 flex flex-col gap-6 text-sm text-gray-600 font-medium">
            <div>
              <h2 className="text-xs text-black font-bold tracking-[0.2em] uppercase mb-4">
                The Cardle Aesthetic
              </h2>
              <h3 className="text-3xl text-black md:text-5xl font-bold uppercase tracking-tighter leading-tight mb-6">
                STATUS MEETS UTILITY
              </h3>
            </div>

            <p className="text-xl font-bold uppercase tracking-tight">
              BEING PRACTICAL SHOULD NOT MEAN LOOKING LIKE IT.
            </p>
            <p className="leading-relaxed">
              Cardle sits somewhere between a workhorse and a premium carry. Clean 
              lines, no unnecessary details, materials that feel good to touch. The 
              kind of bag that people notice without knowing why.
            </p>
            <p className="leading-relaxed">
              It does not try to stand out. It just looks right. Whether you are in 
              a lecture hall, a boardroom, or an airport, it holds its own without 
              you having to think about it.
            </p>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-xl font-bold uppercase tracking-widest">
                CARDLE. CARRY EVERYTHING.<br /> COMPROMISE NOTHING.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4 md:gap-6 h-[400px] md:h-[600px]">
            <div className="group col-span-1 rounded-3xl overflow-hidden relative mt-8 md:mt-12 cursor-pointer">
              <img
                src="/about/cardle-premium-status-tote-bag-1.jpg"
                alt="Aesthetic Detail 1"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-[1500ms] pointer-events-none" />
            </div>
            <div className="group col-span-1 rounded-3xl overflow-hidden relative mb-8 md:mb-12 cursor-pointer">
              <img
                src="/about/cardle-premium-status-tote-bag-2.jpg"
                alt="Aesthetic Detail 2"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-[1500ms] pointer-events-none" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}