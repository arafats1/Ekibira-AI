/**
 * Satellite data for a district, kept up to date by the TUOGERE-BE sync job:
 * CHIRPS v3 monthly rainfall against the 2006–2025 average (preliminary for
 * recent months, plus the month so far), and Sentinel-2 NDVI
 * (vegetation greenness) against the same month in earlier years.
 *
 * Returns { chirps, ndvi, ndviConfigured } (either may be null while the
 * backend has no data yet), or null when the backend can't be reached.
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

async function fetchSatellite(district, cache) {
  const res = await fetch(`${STRAPI_URL}/api/ews/satellite?district=${encodeURIComponent(district.name)}`, {
    signal: AbortSignal.timeout(8000),
    ...cache,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { chirps: data.chirps || null, ndvi: data.ndvi || null, ndviConfigured: Boolean(data.ndviConfigured) };
}

export async function getSatellite(district) {
  try {
    // New months arrive nightly, so a short cache is plenty.
    const cached = await fetchSatellite(district, { next: { revalidate: 900 } });
    // While the backend is still filling a district, don't let a cached empty
    // answer hide data that has since arrived.
    if (cached && !cached.chirps) return (await fetchSatellite(district, { cache: "no-store" })) || cached;
    return cached;
  } catch {
    return null;
  }
}

export const RAIN_CATEGORY = {
  very_dry: "much drier than usual",
  dry: "drier than usual",
  normal: "close to usual",
  wet: "wetter than usual",
  very_wet: "much wetter than usual",
};

const monthLabel = (m) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/**
 * Plain-text summary of a district's satellite record for an AI prompt, or ""
 * when there is none. Figures are as published; the prompt should say not to
 * change them.
 */
export function satelliteBrief(district, satellite) {
  const c = satellite?.chirps;
  const n = satellite?.ndvi;
  if (!c?.latest && !n?.latest) return "";
  const lines = [`SATELLITE RECORD FOR ${district.name.toUpperCase()} DISTRICT (the season so far, not a forecast):`];
  if (c?.latest) {
    lines.push(`Rainfall, CHIRPS satellite estimates vs the ${c.baseline} average for each month:`);
    for (const m of c.months.slice(-6)) {
      lines.push(`- ${monthLabel(m.month)}${m.prelim ? " (preliminary)" : ""}: ${m.total}mm${m.normal != null ? `, usual ${m.normal}mm (${m.pct}%, ${RAIN_CATEGORY[m.category]})` : ""}`);
    }
    if (c.season?.pct != null) lines.push(`Last 3 months together: ${c.season.total}mm, ${c.season.pct}% of usual (${RAIN_CATEGORY[c.season.category]}).`);
    if (c.current) {
      const cur = c.current;
      lines.push(`${monthLabel(cur.month)} so far (to ${cur.throughLabel}, preliminary): ${cur.total}mm${cur.pct != null ? `, ${cur.pct}% of the usual for these days (${RAIN_CATEGORY[cur.category]})` : ""}.`);
    }
  }
  if (n?.latest) {
    lines.push("Vegetation greenness (Sentinel-2 NDVI) vs the same month in earlier years:");
    for (const m of n.months.slice(-3)) {
      const vs = m.change == null ? "" : m.change <= -0.05 ? "less green than usual" : m.change >= 0.05 ? "greener than usual" : "about usual";
      lines.push(`- ${monthLabel(m.month)}${m.partial ? " (early reading)" : ""}: ${m.ndvi}${m.usual != null ? ` vs usual ${m.usual}, ${vs}` : ""}`);
    }
  }
  return lines.join("\n");
}
