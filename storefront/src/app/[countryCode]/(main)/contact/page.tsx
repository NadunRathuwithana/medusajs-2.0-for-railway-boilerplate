import { Metadata } from "next"
import { Headset, MapPin, Mail, Clock } from "lucide-react"

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
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

        {/* Contact Info */}
        <div className="flex flex-col gap-10 pt-4">
          <div className="flex gap-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-bold" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold capitalize tracking-widest text-bold mb-2">Our Headquarters</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Cardle Headquarters<br />
                Colombo 03<br />
                Sri Lanka
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-bold" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold capitalize tracking-widest text-bold mb-2">Email Us</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-1">
                For general inquiries:
              </p>
              <a href="mailto:support@cardle.com" className="text-bold font-medium hover:underline">support@cardle.com</a>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Headset className="w-5 h-5 text-bold" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold capitalize tracking-widest text-bold mb-2">Call Us</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-1">
                Mon - Fri, 9am - 6pm (LKT)
              </p>
              <a href="tel:+94777993883" className="text-bold font-medium hover:underline">+94 777 993 883</a>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-bold" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold capitalize tracking-widest text-bold mb-2">Business Hours</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-500">
                <span>Monday - Friday</span>
                <span className="text-bold font-medium text-right">9:00 AM - 6:00 PM</span>
                <span>Saturday</span>
                <span className="text-bold font-medium text-right">10:00 AM - 4:00 PM</span>
                <span>Sunday</span>
                <span className="text-bold font-medium text-right">Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
