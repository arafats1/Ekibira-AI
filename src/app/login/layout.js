export const metadata = {
  title: "Login",
  description: "Sign in to your KibiraAI account.",
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
    canonical: "/login",
  },
};

export default function LoginLayout({ children }) {
  return children;
}
