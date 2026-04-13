import { Space_Grotesk, Fraunces } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  metadataBase: new URL("https://www.kibiraai.com"),
  title: {
    default: "Kibira AI — AI-Powered Climate Intelligence for Africa",
    template: "%s | Kibira AI",
  },
  description:
    "KibiraAI is an integrated climate intelligence platform combining AI research, real-time forest monitoring, urban flood and heat risk prediction, and community reforestation tools to protect Africa's forests and cities.",
  keywords: [
    "climate intelligence",
    "Africa",
    "reforestation",
    "AI",
    "deforestation",
    "forest monitoring",
    "flood risk",
    "urban heat",
    "carbon credits",
    "sustainability",
    "acoustic monitoring",
    "climate adaptation",
  ],
  applicationName: "Kibira AI",
  authors: [{ name: "Kibira AI", url: "https://www.kibiraai.com" }],
  creator: "Kibira AI",
  publisher: "Kibira AI",
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
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Kibira AI — AI-Powered Climate Intelligence for Africa",
    description:
      "AI-driven reforestation planning & climate research - Empowering African communities to fight climate change.",
    type: "website",
    url: "https://www.kibiraai.com",
    siteName: "Kibira AI",
    locale: "en_US",
    images: [
      {
        url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "KibiraAI — AI-Powered Climate Intelligence for Africa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kibira AI — AI-Powered Climate Intelligence for Africa",
    description:
      "AI climate research, real-time forest sentinel monitoring, urban flood and heat warnings, and direct reforestation — empowering African communities to fight climate change.",
    creator: "@KibiraAI",
    images: ["https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.kibiraai.com/#organization",
        name: "Kibira AI",
        url: "https://www.kibiraai.com",
        logo: {
          "@type": "ImageObject",
          url: "https://www.kibiraai.com/logo.png",
          width: 512,
          height: 512,
        },
        description:
          "AI-powered climate intelligence platform protecting Africa's forests and cities through real-time monitoring, research, and community reforestation.",
        foundingDate: "2024",
        sameAs: [
          "https://twitter.com/KibiraAI",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://www.kibiraai.com/#website",
        url: "https://www.kibiraai.com",
        name: "Kibira AI",
        alternateName: ["KibiraAI", "kibiraai.com"],
        publisher: { "@id": "https://www.kibiraai.com/#organization" },
        description:
          "AI-powered climate intelligence for Africa — forest monitoring, urban risk prediction, climate research, and reforestation.",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://www.kibiraai.com/dashboard?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebApplication",
        "@id": "https://www.kibiraai.com/#app",
        name: "Kibira AI",
        url: "https://www.kibiraai.com",
        applicationCategory: "EnvironmentApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        provider: { "@id": "https://www.kibiraai.com/#organization" },
      },
    ],
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${fraunces.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
