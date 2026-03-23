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
  metadataBase: new URL("https://kibira-ai.vercel.app"),
  title: "KibiraAI — AI-Powered Reforestation for Africa",
  description:
    "KibiraAI uses artificial intelligence to combat deforestation in Africa by providing smart reforestation plans, carbon sequestration estimates, and climate-smart land-use recommendations for communities across the continent.",
  keywords: [
    "climate change",
    "Africa",
    "reforestation",
    "AI",
    "deforestation",
    "carbon credits",
    "sustainability",
  ],
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "KibiraAI — AI-Powered Reforestation for Africa",
    description:
      "Combating deforestation across Africa with AI-driven reforestation planning and carbon tracking.",
    type: "website",
    url: "https://kibira-ai.vercel.app/",
    siteName: "KibiraAI",
    images: [
      {
        url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "KibiraAI — AI-Powered Reforestation for Africa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KibiraAI — AI-Powered Reforestation for Africa",
    description:
      "Combating deforestation across Africa with AI-driven reforestation planning and carbon tracking.",
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
  return (
    <html lang="en" className="scroll-smooth">
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
