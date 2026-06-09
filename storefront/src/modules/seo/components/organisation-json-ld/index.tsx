export default function OrganisationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Cardle",
    url: "https://cardle.lk",
    logo: "https://cardle.lk/Logo.png",
    description:
      "Cardle is a Sri Lankan premium cotton tote bag brand. Handcrafted, make-to-order bags delivered across Sri Lanka.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "LK",
      addressRegion: "Western Province",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Sinhala"],
    },
    sameAs: [
      "https://www.instagram.com/cardle.lk",
      "https://www.tiktok.com/@cardle.lk",
      "https://www.facebook.com/cardle.lk",
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
