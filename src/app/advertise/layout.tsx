import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertise to Schools and Parents | SchoolBase Education Partners",
  description: "Apply to advertise education products, school services, learning tools, events, scholarships, and trusted resources to SchoolBase schools and families.",
  keywords: [
    "advertise to schools",
    "education advertising Nigeria",
    "school advertising platform",
    "advertise to parents",
    "education marketing West Africa",
    "school supplier advertising",
    "education partner network",
  ],
  alternates: { canonical: "https://schoolbase.live/advertise" },
  openGraph: {
    title: "Advertise to Schools and Parents | SchoolBase",
    description: "Reach school leaders, educators, parents, and families through carefully reviewed SchoolBase partner placements.",
    url: "https://schoolbase.live/advertise",
    siteName: "SchoolBase",
    type: "website",
    locale: "en_NG",
    images: [{ url: "https://schoolbase.live/og-image.png", width: 1200, height: 630, alt: "Advertise with SchoolBase" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Advertise to Schools and Parents | SchoolBase",
    description: "Apply for a trusted education advertising placement across SchoolBase.",
    images: ["https://schoolbase.live/og-image.png"],
  },
  robots: { index: true, follow: true },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Who can advertise on SchoolBase?",
      acceptedAnswer: { "@type": "Answer", text: "Education brands, school suppliers, learning providers, event organisers, scholarship partners, and other trusted school-relevant organisations can apply." },
    },
    {
      "@type": "Question",
      name: "Are SchoolBase advertisements approved before publication?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. Every advertiser and campaign is reviewed by the SchoolBase team before a campaign can go live." },
    },
    {
      "@type": "Question",
      name: "How much does advertising on SchoolBase cost?",
      acceptedAnswer: { "@type": "Answer", text: "Pricing depends on the audience, placement, campaign duration, and creative requirements. The SchoolBase team confirms pricing before launch." },
    },
  ],
};

export default function AdvertiseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {children}
    </>
  );
}
