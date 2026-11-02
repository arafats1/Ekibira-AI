/**
 * Satellite data for a district, kept up to date by the TUOGERE-BE sync job:
 * CHIRPS monthly rainfall against the 2006–2025 average, and Sentinel-2 NDVI
 * (vegetation greenness) against the same month in earlier years.
 *
 * Returns { chirps, ndvi, ndviConfigured } (either may be null while the
 * backend has no data yet), or null when the backend can't be reached.
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export async function getSatellite(district) {
  try {
    const res = await fetch(`${STRAPI_URL}/api/ews/satellite?district=${encodeURIComponent(district.name)}`, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { chirps: data.chirps || null, ndvi: data.ndvi || null, ndviConfigured: Boolean(data.ndviConfigured) };
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
