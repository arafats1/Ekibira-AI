export const metadata = {
  title: "Dashboard",
  description: "KibiraAI user dashboard.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": 0,
      "max-image-preview": "none",
      "max-video-preview": 0,
    },
  },
  alternates: {
    canonical: "/dashboard",
  },
};

export default function DashboardLayout({ children }) {
  return children;
}
