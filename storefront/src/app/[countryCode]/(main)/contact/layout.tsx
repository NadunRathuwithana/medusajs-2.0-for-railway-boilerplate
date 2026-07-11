import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us | Cardle",
  description:
    "Get in touch with Cardle's team. Send us a message or chat on WhatsApp for help with orders, shipping, returns, or any product questions.",
  alternates: {
    canonical: "https://cardle.lk/contact",
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
