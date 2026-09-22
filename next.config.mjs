/** @type {import('next').NextConfig} */
const strapiOrigin = process.env.NEXT_PUBLIC_STRAPI_URL
  ? new URL(process.env.NEXT_PUBLIC_STRAPI_URL).origin
  : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
  // Next.js + Stripe; 'unsafe-inline' needed for App Router inline scripts/styles
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.stripe.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  [
    "connect-src 'self'",
    "https://js.stripe.com",
    "https://api.stripe.com",
    strapiOrigin,
  ]
    .filter(Boolean)
    .join(" "),
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "worker-src 'self' blob:",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
