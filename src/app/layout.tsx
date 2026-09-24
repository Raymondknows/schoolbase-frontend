import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";
import FooterWrapper from "@/components/footer-wrapper";
import PublicShellGate from "@/components/public-shell-gate";
import OfflineStatus from "@/components/offline-status";
import PwaInstallPrompt from "@/components/pwa-install-prompt";
import PublicWhatsAppContact from "@/components/public-whatsapp-contact";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "SchoolBase — Everything your school needs in one simple platform",
  description:
    "Collect fees, publish results, communicate with families, and run school operations in one connected platform.",
  keywords: [
    "school management",
    "fee collection",
    "WhatsApp school communication",
    "student results",
    "school website",
    "attendance tracking",
    "parent communication",
    "school software",
    "education platform",
  ],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "SchoolBase",
    statusBarStyle: "default",
  },
  other: {
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#0052cc",
    "google-site-verification": "cAqU-s5g0iU-8bvOexUa_zShdcpkNX7pMX7QKxLQM2A",
  },
  openGraph: {
    title: "SchoolBase — Everything your school needs in one simple platform",
    description:
      "Collect fees, publish results, communicate with families, and run school operations in one connected platform.",
    url: "https://schoolbase.live",
    siteName: "SchoolBase",
    images: [
      {
        url: "https://schoolbase.live/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SchoolBase",
    description: "School management platform for fee collection and parent communication",
    images: ["https://schoolbase.live/og-image.png"],
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
  verification: {
    google: "t16cQxxS0inhasAplgIcn3t1KCZQMYhzt74Nk8zVFxQ",
  },
  alternates: {
    canonical: "https://schoolbase.live",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "SchoolBase",
                url: "https://schoolbase.live",
                logo: "https://schoolbase.live/og-image.png",
                sameAs: [],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "SchoolBase",
                url: "https://schoolbase.live",
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "SchoolBase",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                url: "https://schoolbase.live/platform",
                description: "Connected school administration, academic, fee, communication, parent, and reporting workflows.",
              },
            ]),
          }}
        />
        <PublicShellGate>
          <Header />
        </PublicShellGate>
        <main className="flex-1">{children}</main>
        <PublicShellGate>
          <FooterWrapper />
        </PublicShellGate>
        <PublicShellGate>
          <PublicWhatsAppContact />
        </PublicShellGate>
        <OfflineStatus />
        <PwaInstallPrompt />
        <Analytics />
      </body>
    </html>
  );
}
