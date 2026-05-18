import { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | Cardle",
  description: "The Cardle Story: Elevating the Everyday Carry",
}

export default function AboutPage() {
  return (
    <div className="w-full bg-white">
      {/* 1. Hero Banner */}
      <section className="h-[90vh] w-full relative overflow-hidden bg-[#e5e5e5] flex flex-col items-center justify-center">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2940&auto=format&fit=crop"
          alt="Cardle Hero Banner"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-[1440px] px-6 md:px-16 flex flex-col items-center justify-center text-center h-full pt-16">
          <p className="text-zinc-900 mix-blend-difference text-sm md:text-base font-bold tracking-[0.3em] capitalize mb-6 drop-shadow-sm">
            A Sri Lankan Brand
          </p>
          <h1 className="text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-extrabold capitalize tracking-tighter leading-[0.85] text-zinc-900 mix-blend-difference drop-shadow-sm mb-8">
            Elevating
            <br />
            The Everyday
          </h1>
          <p className="text-xl md:text-2xl text-zinc-900 mix-blend-difference font-medium max-w-2xl mx-auto italic drop-shadow-sm">
            Redefining what one bag can do.
          </p>
        </div>
      </section>

      {/* 2. The Story Section */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
          {/* Image */}
          <div className="group w-full lg:w-1/2 h-[500px] md:h-[700px] rounded-3xl overflow-hidden relative cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1587&auto=format&fit=crop"
              alt="Person walking with bag"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-[1500ms] pointer-events-none" />
          </div>

          {/* Text Content */}
          <div className="w-full lg:w-1/2 flex flex-col gap-8 text-lg text-gray-600 leading-relaxed font-medium">
            <div>
              <h2 className="text-sm font-bold tracking-[0.2em] text-bold capitalize mb-4">
                The Cardle Story
              </h2>
              <h3 className="text-4xl md:text-5xl font-black capitalize tracking-tighter text-bold leading-tight mb-8">
                We live in a fast-paced world that demands we be prepared.
              </h3>
            </div>

            <p>
              Whether you are a dedicated university student navigating a full day
              of lectures, a working professional commuting between meetings, or an
              industry expert managing complex projects — you are carrying your life
              with you.
            </p>
            <p>
              Laptops, heavy textbooks, essential documents, water bottles, personal
              items. The list of daily necessities is endless.
            </p>
            <p>
              For a long time, society has accepted a flawed solution to this
              problem. People are forced to juggle two, three, or even four
              different bags just to get through the day. Not only is this
              physically exhausting and inconvenient, but it completely disrupts
              your personal style and professional image. Cluttered bags diminish
              the polished status you work so hard to maintain.
            </p>
            <p className="text-2xl font-black text-bold capitalize tracking-tight mt-4">
              Cardle was born to solve this exact problem.
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
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white capitalize tracking-tighter leading-tight mb-8">
            "Why can't one bag do it all — and look impeccable while doing it?"
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 font-medium">
            We designed the ultimate solution: a singular, massive-capacity vessel
            engineered to carry everything you need, beautifully.
          </p>
        </div>
      </section>

      {/* 4. Craftsmanship & Materials */}
      <section className="py-24 md:py-32 px-6 bg-[#f7f7f7]">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
            <h2 className="text-sm font-bold tracking-[0.2em] text-gray-500 capitalize mb-4">
              Zero Compromise
            </h2>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-black capitalize tracking-tighter text-bold leading-tight">
              Uncompromising Craftsmanship
            </h3>
            <p className="text-lg text-gray-600 font-medium mt-6">
              A bag designed to hold your entire day must be built on a foundation
              of absolute strength. We do not compromise on the materials or the
              process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Box 1 */}
            <div className="bg-white p-10 md:p-14 rounded-[2rem] flex flex-col justify-center">
              <h4 className="text-2xl font-black capitalize tracking-tight text-bold mb-4">
                100% Pure Premium Cotton
              </h4>
              <p className="text-gray-600 font-medium leading-relaxed text-lg">
                We exclusively use high-grade, eco-friendly cotton. Every Cardle
                piece is environmentally conscious, exceptionally breathable, and
                completely washable — allowing for effortless long-term use and
                maintenance.
              </p>
            </div>
            
            {/* Image Box 1 */}
            <div className="group h-[400px] md:h-auto rounded-[2rem] overflow-hidden relative cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=2574&auto=format&fit=crop"
                alt="Premium Cotton"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-[1500ms] pointer-events-none" />
            </div>

            {/* Image Box 2 */}
            <div className="group h-[400px] md:h-auto rounded-[2rem] overflow-hidden relative order-4 md:order-3 cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?q=80&w=2670&auto=format&fit=crop"
                alt="Craftsmanship"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-[1500ms] pointer-events-none" />
            </div>

            {/* Box 2 */}
            <div className="bg-[#111111] text-white p-10 md:p-14 rounded-[2rem] flex flex-col justify-center order-3 md:order-4">
              <h4 className="text-2xl font-black capitalize tracking-tight mb-4">
                Zero-Stretch Engineering
              </h4>
              <p className="text-gray-400 font-medium leading-relaxed text-lg">
                Ordinary bags warp, sag, and lose their shape when overloaded.
                Cardle bags are structurally designed with heavy-duty canvas weaving
                to prevent stretching. No matter how many laptops, books, or bottles
                you pack inside, the bag retains its architectural silhouette.
              </p>
            </div>

            {/* Box 3 */}
            <div className="bg-white p-10 md:p-14 rounded-[2rem] flex flex-col justify-center order-5">
              <h4 className="text-2xl font-black capitalize tracking-tight text-bold mb-4">
                Handcrafted with Purpose
              </h4>
              <p className="text-gray-600 font-medium leading-relaxed text-lg">
                We believe in the precision of human hands. Every single bag is
                meticulously cut, sewn, and assembled by our dedicated craftsmen.
              </p>
            </div>

            {/* Box 4 */}
            <div className="bg-white p-10 md:p-14 rounded-[2rem] flex flex-col justify-center order-6">
              <h4 className="text-2xl font-black capitalize tracking-tight text-bold mb-4">
                Rigorous Quality Control
              </h4>
              <p className="text-gray-600 font-medium leading-relaxed text-lg">
                Before a bag is ever packaged, it undergoes intense production trials
                — including deep-stretch testing — to guarantee it can withstand
                extreme daily pressure. Only after passing these demanding tests is a
                Cardle bag sent to your hands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Aesthetic Section */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
          {/* Text Content */}
          <div className="w-full lg:w-1/2 flex flex-col gap-8 text-lg text-gray-600 leading-relaxed font-medium">
            <div>
              <h2 className="text-sm font-bold tracking-[0.2em] text-bold capitalize mb-4">
                The Cardle Aesthetic
              </h2>
              <h3 className="text-4xl md:text-6xl font-black capitalize tracking-tighter text-bold leading-tight mb-8">
                Status Meets Utility
              </h3>
            </div>
            
            <p className="text-2xl text-bold font-bold">
              Utility should never come at the expense of your aesthetic.
            </p>
            <p>
              Cardle bridges the gap between a heavy-duty workhorse and a premium
              luxury item. By utilizing clean lines, minimalist design principles,
              and rich tactile cotton, we deliver a <strong>Quiet Luxury</strong>{" "}
              experience.
            </p>
            <p>
              A Cardle bag doesn't scream for attention — it projects{" "}
              <strong>quiet confidence</strong>. It elevates your everyday look,
              ensuring that even when you are carrying your heaviest load, you
              maintain an air of premium, effortless sophistication.
            </p>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-2xl font-black capitalize tracking-widest text-bold">
                Cardle - Carry everything.<br /> Compromise nothing.
              </p>
            </div>
          </div>

          {/* Image Grid */}
          <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4 md:gap-6 h-[500px] md:h-[700px]">
            <div className="group col-span-1 rounded-3xl overflow-hidden relative mt-12 cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1550426735-c33c7ce414ff?q=80&w=2671&auto=format&fit=crop"
                alt="Aesthetic Detail 1"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-[1500ms] pointer-events-none" />
            </div>
            <div className="group col-span-1 rounded-3xl overflow-hidden relative mb-12 cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=2940&auto=format&fit=crop"
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
