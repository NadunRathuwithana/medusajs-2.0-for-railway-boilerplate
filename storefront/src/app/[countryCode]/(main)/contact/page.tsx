import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact Cardle Customer Support",
}

export default function ContactPage() {
  return (
    <div className="py-24 max-w-5xl mx-auto px-6">
      <div className="text-center mb-20">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Get in Touch</h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          We're here to help. Whether you have a question about our products, need assistance with an order, or just want to share feedback, we'd love to hear from you.
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        {/* Contact Form */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold mb-8">Send us a message</h2>
          <form className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="firstName" className="text-xs font-bold capitalize tracking-wider text-gray-500">First Name</label>
                <input type="text" id="firstName" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors" placeholder="John" />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="lastName" className="text-xs font-bold capitalize tracking-wider text-gray-500">Last Name</label>
                <input type="text" id="lastName" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors" placeholder="Doe" />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-xs font-bold capitalize tracking-wider text-gray-500">Email Address</label>
              <input type="email" id="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors" placeholder="john@example.com" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="subject" className="text-xs font-bold capitalize tracking-wider text-gray-500">Subject</label>
              <input type="text" id="subject" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors" placeholder="How can we help?" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="message" className="text-xs font-bold capitalize tracking-wider text-gray-500">Message</label>
              <textarea id="message" rows={5} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors resize-none" placeholder="Enter your message here..."></textarea>
            </div>

            <button type="button" className="w-full bg-black text-white py-4 rounded-xl text-xs font-bold capitalize tracking-widest hover:bg-gray-800 transition-colors mt-2">
              Send Message
            </button>
          </form>
        </div>

        {/* WhatsApp Option */}
        <div className="mt-8 text-center bg-green-50 p-8 rounded-3xl border border-green-100 shadow-sm flex flex-col items-center">
          <p className="text-green-800 mb-4 font-medium">
            Prefer a quicker response? Send your inquiry directly to our WhatsApp!
          </p>
          <a 
            href="https://wa.me/94779497859" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 px-8 rounded-xl text-sm font-bold tracking-wide hover:bg-[#20b858] transition-colors shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-current"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
