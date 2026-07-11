export default function OrganisationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Cardle",
    url: "https://cardle.lk",
    logo: "https://cardle.lk/cardle-premium-cotton-tote-bags-logo.png",
    foundingDate: "2024",
    description:
      "Cardle is a Sri Lankan premium cotton tote bag brand. Handcrafted, make-to-order bags delivered across Sri Lanka.",
    email: "hello@cardle.lk",
    telephone: "+94779497859",
    address: {
      "@type": "PostalAddress",
      addressCountry: "LK",
      addressRegion: "Western Province",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "hello@cardle.lk",
      telephone: "+94779497859",
      availableLanguage: ["English", "Sinhala"],
    },
    sameAs: [
      "https://www.instagram.com/cardle_lk/",
      "https://www.tiktok.com/@cardle.srilanka/",
      "https://www.facebook.com/people/Cardlelk/61585796349137/",
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
