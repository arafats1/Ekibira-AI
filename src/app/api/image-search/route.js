export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return Response.json({ error: "Search query is required" }, { status: 400 });
    }

    const sanitized = query.trim().slice(0, 200);

    const image = await searchWikimedia(sanitized);

    if (image) {
      return Response.json({ image });
    }

    return Response.json({ image: null });
  } catch (error) {
    // Image search error silently handled
    return Response.json({ image: null });
  }
}

async function searchWikimedia(query) {
  try {
    // Search Commons using the exact AI query — no added keywords
    const searchParams = new URLSearchParams({
      action: "query",
      format: "json",
      list: "search",
      srsearch: query,
      srnamespace: "6", // File namespace
      srlimit: "15",
      origin: "*",
    });

    const searchRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?${searchParams.toString()}`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    let results = searchData?.query?.search;

    if (!results?.length) return null;

    // Filter to actual image files only
    const imageResults = results.filter((r) =>
      /\.(jpg|jpeg|png|webp)$/i.test(r.title)
    );

    // Try image results first, then all results as fallback
    const candidates = imageResults.length > 0 ? imageResults : results;

    // Try up to 5 candidates to find a usable photo
    for (const result of candidates.slice(0, 5)) {
      const info = await getImageInfo(result.title);
      if (info) return info;
    }

    return null;
  } catch {
    return null;
  }
}

async function getImageInfo(title) {
  try {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      titles: title,
      prop: "imageinfo",
      iiprop: "url|extmetadata|size|mime",
      iiurlwidth: "800",
      origin: "*",
    });

    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return null;

    for (const page of Object.values(pages)) {
      const info = page?.imageinfo?.[0];
      if (!info || !info.mime?.startsWith("image/")) continue;

      // Skip tiny images (icons, logos) — need at least 200px wide
      if (info.width && info.width < 200) continue;
      // Skip SVG diagrams — they're usually charts/maps, not photos
      if (info.mime === "image/svg+xml") continue;

      const url = info.thumburl || info.url;
      if (!url) continue;

      const meta = info.extmetadata || {};
      return {
        url,
        source: "Wikimedia Commons",
        attribution: meta?.Artist?.value?.replace(/<[^>]*>/g, "") || "Wikimedia Commons",
        license: meta?.LicenseShortName?.value || "CC",
        pageUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
      };
    }

    return null;
  } catch {
    return null;
  }
}
