export const metadata = {
  title: "Sign Up",
  description: "Create your KibiraAI account.",
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
    canonical: "/signup",
  },
};

export default function SignupLayout({ children }) {
  return children;
}
