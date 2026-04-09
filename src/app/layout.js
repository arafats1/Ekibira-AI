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
  title: "KibiraAI — AI-Powered Climate Intelligence for Africa",
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
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "KibiraAI — AI-Powered Climate Intelligence for Africa",
    description:
      "AI-driven reforestation planning & climate research - Empowering African communities to fight climate change.",
    type: "website",
    url: "https://www.kibiraai.com",
    siteName: "KibiraAI",
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
    title: "KibiraAI — AI-Powered Climate Intelligence for Africa",
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
