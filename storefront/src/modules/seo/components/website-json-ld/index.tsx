export default function WebsiteJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Cardle",
    url: "https://cardle.lk",
    inLanguage: "en",
    publisher: { "@type": "Organization", name: "Cardle", url: "https://cardle.lk" },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
