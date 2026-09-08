import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";
import FooterWrapper from "@/components/footer-wrapper";
import PwaInstallPrompt from "@/components/pwa-install-prompt";

export const metadata: Metadata = {
  title: "SchoolBase — Everything your school needs in one simple platform",
  description:
    "Collect fees, reach parents on WhatsApp, publish results, and run a beautiful school website. Live in 48 hours.",
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
      "Collect fees, reach parents on WhatsApp, publish results, and run a beautiful school website. Live in 48 hours.",
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
        <Header />
        <main className="flex-1">{children}</main>
        <FooterWrapper />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
