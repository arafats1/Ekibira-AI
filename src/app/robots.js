export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api", "/admin", "/dashboard", "/login", "/signup"],
      },
    ],
    sitemap: "https://www.kibiraai.com/sitemap.xml",
  };
}
