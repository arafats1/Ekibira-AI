export const metadata = {
  title: "Admin",
  description: "KibiraAI admin area.",
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
    canonical: "/admin",
  },
};

export default function AdminLayout({ children }) {
  return children;
}
