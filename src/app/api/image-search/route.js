export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return Response.json({ error: "Search query is required" }, { status: 400 });
    }

    const sanitized = query.trim().slice(0, 200);

    // Try Wikimedia Commons first (no API key needed, high-quality images)
    const image = await searchWikimedia(sanitized);

    if (image) {
      return Response.json({ image });
    }

    // Fallback: return null (no image found)
    return Response.json({ image: null });
  } catch (error) {
    console.error("Image search error:", error);
    return Response.json({ image: null });
  }
}

async function searchWikimedia(query) {
  try {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      generator: "images",
      gimlimit: "5",
      prop: "imageinfo",
      iiprop: "url|extmetadata|size|mime",
      iiurlwidth: "800",
      titles: query,
      origin: "*",
    });

    // First try: search for pages matching the query
    const searchParams = new URLSearchParams({
      action: "query",
      format: "json",
      list: "search",
      srsearch: `${query} forest OR tree OR deforestation OR Africa OR reforestation`,
      srnamespace: "6", // File namespace
      srlimit: "8",
      origin: "*",
    });

    const searchRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?${searchParams.toString()}`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const results = searchData?.query?.search;

    if (!results?.length) {
      // Fallback: try simpler search
      const fallbackParams = new URLSearchParams({
        action: "query",
        format: "json",
        list: "search",
        srsearch: query,
        srnamespace: "6",
        srlimit: "5",
        origin: "*",
      });

      const fallbackRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?${fallbackParams.toString()}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!fallbackRes.ok) return null;
      const fallbackData = await fallbackRes.json();
      const fallbackResults = fallbackData?.query?.search;
      if (!fallbackResults?.length) return null;

      return await getImageInfo(fallbackResults[0].title);
    }

    // Filter for actual image files
    for (const result of results) {
      const title = result.title;
      if (/\.(jpg|jpeg|png|svg|webp)$/i.test(title)) {
        const info = await getImageInfo(title);
        if (info) return info;
      }
    }

    // If no direct image file match, try first result anyway
    return await getImageInfo(results[0].title);
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
      if (info && info.thumburl && info.mime?.startsWith("image/")) {
        const meta = info.extmetadata || {};
        return {
          url: info.thumburl || info.url,
          source: "Wikimedia Commons",
          attribution: meta?.Artist?.value?.replace(/<[^>]*>/g, "") || "Wikimedia Commons",
          license: meta?.LicenseShortName?.value || "CC",
          pageUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
