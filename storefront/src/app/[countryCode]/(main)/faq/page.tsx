import { Metadata } from "next"
import FAQJsonLd from "@modules/seo/components/faq-json-ld"

export const metadata: Metadata = {
  title: "FAQ – Cardle Tote Bags | Shipping, Returns & Care",
  description:
    "Find answers to common questions about Cardle's handcrafted cotton tote bags — shipping times, returns, materials, care instructions and more.",
  alternates: {
    canonical: "https://cardle.lk/faq",
  },
}

export default function FAQPage() {
  const faqs = [
    {
      question: "Do you ship internationally?",
      answer: "Currently, we only ship within Sri Lanka through our website. For international orders, please contact our support team at support@cardle.lk to arrange a custom shipping quote."
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping typically takes 3-5 business days. We also offer express shipping which takes 1-2 business days. Personalised items may require an additional 2-4 business days for processing."
    },
    {
      question: "Can I return or exchange my order?",
      answer: "We offer a 30-day return policy for unused items in their original packaging. Please note that custom or personalised items cannot be returned unless they arrive damaged or defective."
    },
    {
      question: "What materials do you use?",
      answer: "We use premium materials sourced globally, focusing on durability and aesthetic appeal. Our core collections feature high-grade vegan leather, water-resistant canvas, and reinforced metal hardware."
    },
    {
      question: "How do I care for my Cardle product?",
      answer: "Wipe clean with a damp cloth. Do not machine wash or tumble dry. Keep away from prolonged direct sunlight and extreme heat to maintain the material's integrity."
    }
  ]

  return (
    <>
      <FAQJsonLd faqs={faqs} />
      <div className="py-24 max-w-3xl mx-auto px-6">
      <h1 className="text-4xl font-bold tracking-tight mb-4 text-center">Frequently Asked Questions</h1>
      <p className="text-gray-500 mb-16 text-center">Have a question? We're here to help.</p>
      
      <div className="flex flex-col gap-10">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-bold mb-3">{faq.question}</h3>
            <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>

      <div className="mt-20 text-center p-8 bg-[#0c0c0c] text-white rounded-3xl">
        <h3 className="text-xl font-bold mb-4">Still have questions?</h3>
        <p className="text-gray-400 mb-6 text-sm">Our customer care team is available 24/7 to assist you.</p>
        <a href="/contact" className="inline-block bg-white text-black px-8 py-3 rounded-full text-sm font-bold tracking-wide hover:bg-gray-200 transition-colors">
          Contact Support
        </a>
      </div>
      </div>
    </>
  )
}
