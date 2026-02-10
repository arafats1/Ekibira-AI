import { Space_Grotesk, Fraunces } from "next/font/google";
import "./globals.css";

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
  title: "KijaniAI — AI-Powered Reforestation for Africa",
  description:
    "KijaniAI uses artificial intelligence to combat deforestation in Africa by providing smart reforestation plans, carbon sequestration estimates, and climate-smart land-use recommendations for communities across the continent.",
  keywords: [
    "climate change",
    "Africa",
    "reforestation",
    "AI",
    "deforestation",
    "carbon credits",
    "sustainability",
  ],
  openGraph: {
    title: "KijaniAI — AI-Powered Reforestation for Africa",
    description:
      "Combating deforestation across Africa with AI-driven reforestation planning and carbon tracking.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${spaceGrotesk.variable} ${fraunces.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
