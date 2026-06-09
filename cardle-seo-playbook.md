# Cardle SEO Playbook — Medusa v2 Next.js Storefront
> **Business:** Cardle (cardle.lk) — Premium Cotton Tote Bags, Sri Lanka  
> **Stack:** Medusa v2 backend (Railway) + Next.js 14 App Router storefront  
> **Last Updated:** June 2026

---

## Table of Contents

1. [Keyword Strategy](#1-keyword-strategy)
2. [Search Query Targeting](#2-search-query-targeting)
3. [Technical SEO — Code Implementation](#3-technical-seo--code-implementation)
4. [Sitemap](#4-sitemap)
5. [Robots.txt](#5-robotstxt)
6. [Structured Data / JSON-LD](#6-structured-data--json-ld)
7. [AI Search Optimisation (AEO)](#7-ai-search-optimisation-aeo)
8. [Instant Articles / Content Strategy](#8-instant-articles--content-strategy)
9. [On-Page SEO Checklist](#9-on-page-seo-checklist)
10. [Performance & Core Web Vitals](#10-performance--core-web-vitals)
11. [Off-Page & Authority Building](#11-off-page--authority-building)
12. [Google Search Console Setup](#12-google-search-console-setup)
13. [Execution Timeline](#13-execution-timeline)

---

## 1. Keyword Strategy

### Primary Keywords (Buying Intent — Target These First)

| Keyword | Monthly Volume (LK est.) | Difficulty | Priority |
|---|---|---|---|
| tote bag price in sri lanka | 500–1,000 | Low | 🔴 #1 |
| cotton tote bag sri lanka | 300–600 | Low | 🔴 #1 |
| tote bag lk | 200–400 | Low | 🔴 #1 |
| buy tote bag online sri lanka | 100–300 | Low | 🟠 High |
| premium tote bag colombo | 50–150 | Low | 🟠 High |
| branded tote bag sri lanka | 100–200 | Low | 🟠 High |
| custom tote bag sri lanka | 200–400 | Low | 🟠 High |
| eco friendly bag sri lanka | 100–300 | Medium | 🟡 Medium |

### Secondary Keywords (Informational — Drives Blog Traffic)

| Keyword | Intent | Use In |
|---|---|---|
| what is a tote bag | Informational | Blog article |
| tote bag vs handbag | Informational | Blog article |
| best bags for daily use sri lanka | Informational | Blog article |
| cotton bag benefits | Informational | Blog + Product desc |
| sustainable bags sri lanka | Research | Blog + Homepage |
| handmade bags sri lanka | Research | Product page |
| gift ideas sri lanka | Seasonal | Blog article |

### Brand Keywords (Easy Wins — Protect These)

| Keyword | Action |
|---|---|
| cardle | Ensure homepage ranks #1 |
| cardle bags | Product collection page |
| cardle tote bag | Product pages |
| cardle.lk | Homepage metadata |

### Long-Tail Keywords (Low Competition, High Conversion)

```
"tote bag for office women sri lanka"
"cotton bag under 1000 rupees sri lanka"
"personalised bag gift sri lanka"
"natural cotton tote bag colombo"
"reusable grocery bag sri lanka"
"tote bag bulk order sri lanka"
"make to order bag sri lanka"
"canvas bag price sri lanka"
```

---

## 2. Search Query Targeting

### Homepage (`cardle.lk`)
**Target queries:**
- `cardle bags`
- `premium tote bag sri lanka`
- `cotton bags online sri lanka`
- `cardle.lk`

**Title tag:**
```
Cardle – Premium Cotton Tote Bags Sri Lanka | Shop Online
```

**Meta description:**
```
Shop handcrafted cotton tote bags made to order in Sri Lanka. Free delivery available. 
Explore Cardle's collection of premium, sustainable bags. Order online at cardle.lk
```

---

### Collection / Store Page (`cardle.lk/store`)
**Target queries:**
- `buy tote bag online sri lanka`
- `tote bag price in sri lanka`
- `cotton tote bag lk`

**Title tag:**
```
Buy Cotton Tote Bags Online Sri Lanka | Cardle Store
```

---

### Individual Product Pages (`cardle.lk/products/[handle]`)
**Target queries:**
- `[product name] price sri lanka`
- `[colour/material] tote bag sri lanka`
- `buy [product name] online lk`

**Title tag formula:**
```
{Product Name} – Cotton Tote Bag | Cardle Sri Lanka
```

**Example:**
```
Natural Beige Tote Bag – Handmade Cotton | Cardle Sri Lanka
```

---

## 3. Technical SEO — Code Implementation

### 3.1 Root Layout Metadata

```ts
// app/layout.tsx
import { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL("https://cardle.lk"),
  title: {
    default: "Cardle – Premium Cotton Tote Bags Sri Lanka",
    template: "%s | Cardle Sri Lanka",
  },
  description:
    "Shop handcrafted, make-to-order cotton tote bags in Sri Lanka. Premium quality, sustainable materials. Order online at cardle.lk",
  keywords: [
    "tote bag sri lanka",
    "cotton tote bag",
    "buy tote bag online sri lanka",
    "premium bags lk",
    "cardle",
    "cardle bags",
    "sustainable bags sri lanka",
  ],
  authors: [{ name: "Cardle", url: "https://cardle.lk" }],
  creator: "Cardle",
  publisher: "Cardle",
  alternates: {
    canonical: "https://cardle.lk",
  },
  openGraph: {
    type: "website",
    locale: "en_LK",
    url: "https://cardle.lk",
    siteName: "Cardle",
    title: "Cardle – Premium Cotton Tote Bags Sri Lanka",
    description:
      "Handcrafted, make-to-order cotton tote bags. Shop the Cardle collection online.",
    images: [
      {
        url: "https://cardle.lk/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cardle Premium Cotton Tote Bags Sri Lanka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cardle – Premium Cotton Tote Bags Sri Lanka",
    description: "Handcrafted make-to-order cotton tote bags. Shop online at cardle.lk",
    images: ["https://cardle.lk/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}
```

---

### 3.2 Dynamic Product Page Metadata

```ts
// app/products/[handle]/page.tsx
import { Metadata } from "next"

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const product = await getProductByHandle(handle)

  if (!product) {
    return { title: "Product Not Found | Cardle" }
  }

  const title = `${product.title} – Cotton Tote Bag | Cardle Sri Lanka`
  const description =
    product.description?.slice(0, 155) ??
    `Shop ${product.title} — a premium handcrafted cotton tote bag from Cardle Sri Lanka. Made to order.`

  return {
    title,
    description,
    alternates: {
      canonical: `https://cardle.lk/products/${handle}`,
    },
    openGraph: {
      title,
      description,
      url: `https://cardle.lk/products/${handle}`,
      images: product.thumbnail
        ? [
            {
              url: product.thumbnail,
              width: 800,
              height: 800,
              alt: `${product.title} – Cardle Sri Lanka`,
            },
          ]
        : [],
    },
  }
}
```

---

### 3.3 Collection Page Metadata

```ts
// app/collections/[handle]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const collection = await getCollectionByHandle(handle)

  return {
    title: `${collection.title} | Cotton Tote Bags Sri Lanka – Cardle`,
    description: `Browse the ${collection.title} collection from Cardle. Premium handcrafted cotton tote bags made to order in Sri Lanka.`,
    alternates: {
      canonical: `https://cardle.lk/collections/${handle}`,
    },
  }
}
```

---

## 4. Sitemap

```ts
// app/sitemap.ts
import { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://cardle.lk"

  // Fetch all products from Medusa
  const products = await getAllProducts() // your existing fetch util
  const collections = await getAllCollections()
  const blogPosts = await getAllBlogPosts() // if applicable

  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.handle}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const collectionUrls: MetadataRoute.Sitemap = collections.map((col) => ({
    url: `${baseUrl}/collections/${col.handle}`,
    lastModified: new Date(col.updated_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  const blogUrls: MetadataRoute.Sitemap = (blogPosts ?? []).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/store`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ]

  return [...staticPages, ...collectionUrls, ...productUrls, ...blogUrls]
}
```

**After deployment:**
1. Visit `https://cardle.lk/sitemap.xml` — verify all URLs appear
2. Submit to Google Search Console → Sitemaps → Add new sitemap
3. Submit to Bing Webmaster Tools as well

---

## 5. Robots.txt

```ts
// app/robots.ts
import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/checkout/",
          "/account/",
          "/cart",
          "/_next/",
          "/admin/",
        ],
      },
      // Allow AI crawlers explicitly (important for AEO)
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/"],
      },
      {
        userAgent: "Claude-Web",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: "/",
      },
    ],
    sitemap: "https://cardle.lk/sitemap.xml",
    host: "https://cardle.lk",
  }
}
```

---

## 6. Structured Data / JSON-LD

### 6.1 Product Schema

```tsx
// components/seo/ProductJsonLd.tsx
interface Product {
  title: string
  description: string
  images: { url: string }[]
  thumbnail: string
  variants: {
    prices: { amount: number; currency_code: string }[]
  }[]
  handle: string
}

export function ProductJsonLd({ product }: { product: Product }) {
  const price = product.variants[0]?.prices?.find(
    (p) => p.currency_code === "lkr"
  )

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((i) => i.url),
    brand: {
      "@type": "Brand",
      name: "Cardle",
    },
    manufacturer: {
      "@type": "Organization",
      name: "Cardle",
      url: "https://cardle.lk",
    },
    url: `https://cardle.lk/products/${product.handle}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      price: price ? price.amount / 100 : undefined,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Cardle",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          currency: "LKR",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 7,
            unitCode: "DAY",
          },
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "LK",
        },
      },
    },
    countryOfOrigin: {
      "@type": "Country",
      name: "Sri Lanka",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

---

### 6.2 Organisation Schema (Homepage)

```tsx
// components/seo/OrganisationJsonLd.tsx
export function OrganisationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Cardle",
    url: "https://cardle.lk",
    logo: "https://cardle.lk/logo.png",
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
```

---

### 6.3 BreadcrumbList Schema

```tsx
// components/seo/BreadcrumbJsonLd.tsx
interface Crumb {
  name: string
  url: string
}

export function BreadcrumbJsonLd({ crumbs }: { crumbs: Crumb[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Usage on product page:
// <BreadcrumbJsonLd crumbs={[
//   { name: "Home", url: "https://cardle.lk" },
//   { name: "Store", url: "https://cardle.lk/store" },
//   { name: product.title, url: `https://cardle.lk/products/${product.handle}` },
// ]} />
```

---

### 6.4 FAQ Schema (for blog posts & product pages)

```tsx
// components/seo/FaqJsonLd.tsx
interface FAQ {
  question: string
  answer: string
}

export function FaqJsonLd({ faqs }: { faqs: FAQ[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Example FAQs for product pages:
const cardleFaqs = [
  {
    question: "How long does Cardle take to deliver in Sri Lanka?",
    answer:
      "Cardle bags are made to order and typically delivered within 5–7 working days across Sri Lanka.",
  },
  {
    question: "What material are Cardle tote bags made from?",
    answer:
      "Cardle tote bags are made from 100% natural cotton, making them durable, eco-friendly, and washable.",
  },
  {
    question: "Can I order Cardle bags in bulk for events or gifting?",
    answer:
      "Yes, Cardle accepts bulk and custom orders. Contact us via cardle.lk for corporate or event pricing.",
  },
  {
    question: "What is the price of tote bags in Sri Lanka?",
    answer:
      "Cardle tote bags are priced starting from LKR 990. Visit cardle.lk/store for the full range.",
  },
]
```

---

## 7. AI Search Optimisation (AEO)

AI search engines (ChatGPT, Perplexity, Claude, Gemini) pull answers from web pages. These are separate from Google but increasingly important.

### 7.1 What AI Crawlers Look For

- Clear, direct answers in the first paragraph
- Factual statements with specific data (prices, materials, locations)
- Well-structured HTML (H1 → H2 → H3)
- FAQ content
- Schema markup
- `llms.txt` file (new standard)

### 7.2 Add `llms.txt` to Your Storefront

```txt
// public/llms.txt

# Cardle

> Cardle is a Sri Lankan premium cotton tote bag brand founded in 2024.
> All bags are handcrafted and made to order. We deliver across Sri Lanka.
> Website: https://cardle.lk

## Products
- Cotton tote bags in multiple sizes and colours
- Made from 100% natural cotton
- Starting price: LKR 990
- Make-to-order model (not stock-based)
- Delivery: 5–7 working days across Sri Lanka

## Contact
- Website: https://cardle.lk
- Instagram: @cardle.lk
- Payment: OnePay, Koko (BNPL), Cash on Delivery

## Key Facts
- Country of manufacture: Sri Lanka
- Sustainable, eco-friendly product
- Suitable for daily use, gifting, corporate orders
- Custom and bulk orders available
```

This file is increasingly indexed by AI crawlers. Place it at `cardle.lk/llms.txt`.

### 7.3 Write Answer-First Content

Every product description and blog post should open with a direct answer sentence:

**Instead of:**
> "Our tote bags are lovingly crafted using fine materials..."

**Write:**
> "The Cardle Natural Beige Tote Bag is a 100% cotton, handmade bag available for LKR 1,490, delivered anywhere in Sri Lanka within 7 days."

AI search engines extract the first sentence to answer user queries. Lead with facts.

### 7.4 Mention Competitor Context Naturally

Write content like:
> "Unlike mass-produced bags from Colombo retail stores, Cardle bags are made to order — you're getting a bag made specifically for you."

This surfaces in AI answers when users compare options.

---

## 8. Instant Articles / Content Strategy

### 8.1 Blog Setup

Add a blog to your Next.js storefront. Even 6 well-written articles will significantly lift your domain authority.

**Recommended blog URL structure:**
```
cardle.lk/blog/[slug]
```

### 8.2 Article Topics (Priority Order)

#### Article 1 — Target: "tote bag price in sri lanka"
```
Title: Tote Bag Prices in Sri Lanka (2025 Guide) — What to Expect
Slug: /blog/tote-bag-price-sri-lanka
Word count: 800–1,000
Target keyword: tote bag price in sri lanka
Content: Price range overview, materials, why Cardle is worth it, CTA to shop
```

#### Article 2 — Target: "cotton tote bag benefits"
```
Title: 7 Reasons Cotton Tote Bags Are Better Than Plastic Bags in Sri Lanka
Slug: /blog/cotton-tote-bag-benefits-sri-lanka
Word count: 700–900
Target keyword: cotton bag benefits sri lanka
Content: Environmental + practical benefits, reference to Sri Lanka's plastic ban
```

#### Article 3 — Target: "gift ideas sri lanka"
```
Title: 10 Unique Gift Ideas in Sri Lanka (That Aren't Boring)
Slug: /blog/unique-gift-ideas-sri-lanka
Word count: 900–1,100
Target keyword: gift ideas sri lanka
Content: List format, Cardle included as item #1 or #2, link to product page
```

#### Article 4 — Target: "sustainable bags sri lanka"
```
Title: Where to Buy Sustainable Bags in Sri Lanka (2025)
Slug: /blog/sustainable-bags-sri-lanka
Word count: 700–900
Content: Sustainable bag options, Cardle as the premium option, why cotton beats jute/nylon
```

#### Article 5 — Target: "custom tote bag sri lanka"
```
Title: Custom Tote Bags in Sri Lanka — Bulk Orders, Events & Corporate Gifting
Slug: /blog/custom-tote-bag-bulk-orders-sri-lanka
Word count: 600–800
Content: How bulk ordering works at Cardle, pricing tiers, turnaround time
```

#### Article 6 — Target: "cardle bags review"
```
Title: About Cardle — Sri Lanka's Make-to-Order Cotton Tote Bag Brand
Slug: /blog/about-cardle-cotton-tote-bags
Word count: 500–700
Content: Brand story, mission, make-to-order model, social proof
```

### 8.3 Article Template Structure

Every blog post must follow this HTML structure for SEO:

```
H1: [Main keyword in title]
  → First paragraph: Direct answer (2–3 sentences with keyword)
  
H2: [Section topic]
  → 100–150 words
  → 1 internal link to a product or other article
  
H2: [FAQ section]
  → 3–5 questions with concise answers
  → Attach FaqJsonLd component
  
H2: Conclusion
  → CTA: "Shop the full Cardle range at cardle.lk/store"
```

### 8.4 Blog Post Metadata Template

```ts
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getBlogPost(params.slug)
  return {
    title: `${post.title} | Cardle Blog`,
    description: post.excerpt?.slice(0, 155),
    alternates: { canonical: `https://cardle.lk/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: ["https://cardle.lk"],
      tags: post.tags,
    },
  }
}
```

---

## 9. On-Page SEO Checklist

### Every Product Page

- [ ] H1 contains primary keyword (e.g. "Natural Cotton Tote Bag – Sri Lanka")
- [ ] Title tag uses formula: `{Product} – Cotton Tote Bag | Cardle Sri Lanka`
- [ ] Meta description is 130–155 chars with keyword + CTA
- [ ] Product description is 150–300 words (not just specs)
- [ ] All images have descriptive `alt` text
- [ ] ProductJsonLd component rendered
- [ ] BreadcrumbJsonLd component rendered
- [ ] FaqJsonLd component rendered (3–5 FAQs)
- [ ] Canonical URL set to product URL (not `?variant=` URLs)
- [ ] Internal link to collection page

### Every Collection Page

- [ ] H1 contains keyword (e.g. "Cotton Tote Bags Sri Lanka")
- [ ] 100+ word intro paragraph above product grid
- [ ] CollectionJsonLd or BreadcrumbJsonLd rendered
- [ ] Canonical URL set

### Homepage

- [ ] OrganisationJsonLd rendered
- [ ] Hero H1 contains primary keyword
- [ ] 50–100 word below-fold paragraph with keywords
- [ ] Google Business Profile link referenced

---

## 10. Performance & Core Web Vitals

Google uses Core Web Vitals as a ranking factor. Railway cold starts will kill your LCP score.

### Check Your Score

```
https://pagespeed.web.dev/report?url=https://cardle.lk
```

**Target scores:**
- LCP (Largest Contentful Paint): < 2.5s
- FID / INP (Interaction to Next Paint): < 200ms
- CLS (Cumulative Layout Shift): < 0.1

### Fixes for Medusa + Railway

#### Fix 1 — Enable Railway "Always On"

In Railway dashboard → your Medusa service → Settings → Enable "Always On" to prevent cold starts.

#### Fix 2 — Image Optimisation in Next.js

```tsx
// Use Next.js Image with priority for above-fold images
import Image from "next/image"

<Image
  src={product.thumbnail}
  alt={`${product.title} – Cardle Sri Lanka`}
  width={800}
  height={800}
  priority // Add this for hero/above-fold images only
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

#### Fix 3 — Add Cloudflare in Front of cardle.lk

Cloudflare free tier provides:
- Edge caching (global CDN)
- Image compression
- DDoS protection
- Faster TTFB

Steps: Add cardle.lk to Cloudflare → Update nameservers → Enable "Cache Everything" rule for `/store`, `/products/*`, `/collections/*`

#### Fix 4 — Static Generation for Product Pages

```ts
// app/products/[handle]/page.tsx
export async function generateStaticParams() {
  const products = await getAllProducts()
  return products.map((p) => ({ handle: p.handle }))
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600 // Re-generate every 1 hour
```

---

## 11. Off-Page & Authority Building

Technical SEO gets you crawled. Authority gets you ranked.

### Quick Win Backlinks (Sri Lanka)

| Source | Action | Authority |
|---|---|---|
| Google Business Profile | Create/verify listing at business.google.com | High |
| ikman.lk | List Cardle bags as a business | High |
| takas.lk | List products | Medium |
| Daraz.lk | List even if not primary channel | High |
| Sri Lankan Facebook Groups | Share cardle.lk links in buy/sell groups | Low |
| Lifestyle blogs (e.g. Colombo Food Fest) | Pitch a feature | High |

### Social Signals

Every Instagram, TikTok, and Facebook post description should include:
```
cardle.lk | Link in bio
```

Backlinks from social profiles pass domain authority signals to Google.

### Internal Linking Rules

Every blog post must link to at least 2 product or collection pages.
Every product page must link to the collection it belongs to.

---

## 12. Google Search Console Setup

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property: `https://cardle.lk` (URL prefix)
3. Verify via HTML tag in `<head>` — add to `app/layout.tsx`:

```ts
export const metadata = {
  verification: {
    google: "YOUR_VERIFICATION_CODE_HERE",
  },
}
```

4. Submit sitemap: Sitemaps → `https://cardle.lk/sitemap.xml`
5. Run URL Inspection on homepage after submission
6. Check weekly: Coverage report, Search queries report, Core Web Vitals

---

## 13. Execution Timeline

### Week 1 — Foundation (Do This First)
- [ ] Add `sitemap.ts` and `robots.ts`
- [ ] Add `generateMetadata` to homepage, store, product, and collection pages
- [ ] Add `ProductJsonLd` and `OrganisationJsonLd`
- [ ] Check PageSpeed score — fix LCP if > 2.5s
- [ ] Submit sitemap to Google Search Console
- [ ] Create `/public/llms.txt`

### Week 2 — Content
- [ ] Rewrite all product descriptions (150–300 words each, keyword-rich)
- [ ] Add FAQ section to each product page with `FaqJsonLd`
- [ ] Write Article 1: "Tote bag price in Sri Lanka"
- [ ] Add `BreadcrumbJsonLd` to all product pages

### Week 3–4 — Authority
- [ ] Create/verify Google Business Profile
- [ ] List on ikman.lk
- [ ] Write Articles 2 and 3
- [ ] Set up Cloudflare in front of cardle.lk

### Month 2–3 — Scale
- [ ] Write remaining 3 blog articles
- [ ] Submit to Bing Webmaster Tools
- [ ] Pursue 1 Sri Lankan blog feature or media mention
- [ ] Review Search Console data — double down on ranking keywords

### Month 4–6 — Compound
- [ ] By month 4, expect page 1 for brand keywords and long-tail queries
- [ ] By month 6, expect page 1–2 for primary buying keywords
- [ ] Continue publishing 1–2 articles per month

---

> **Realistic expectation:** Page 1 for brand terms within 4–6 weeks. Page 1 for "tote bag price in sri lanka" within 4–6 months with consistent content + backlinks. No shortcut exists for competitive buying-intent keywords — authority and content take time.

---

*Playbook maintained by Cardle dev team. Update keyword table quarterly using Google Search Console query data.*
