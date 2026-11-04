export default function sitemap() {
  const baseUrl = "https://www.kibiraai.com";
  const page = (path, changeFrequency, priority) => ({ url: `${baseUrl}${path}`, lastModified: new Date(), changeFrequency, priority });

  return [
    page("", "weekly", 1),
    page("/last-mile", "daily", 0.9),
    page("/childrens-early-warning", "daily", 0.9),
    page("/problem", "monthly", 0.7),
    page("/solution", "monthly", 0.7),
    page("/advisor", "daily", 0.8),
    page("/contact", "monthly", 0.6),
    page("/signup", "monthly", 0.6),
    page("/docs/early-warning", "weekly", 0.5),
    page("/privacy", "yearly", 0.3),
    page("/terms", "yearly", 0.3),
  ];
}
