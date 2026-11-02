/**
 * Districts served by the last-mile early warning system.
 *
 * Coordinates are approximate district headquarters, used as the forecast
 * sampling point for the whole district. Hazard flags reflect well-documented
 * exposure (Rwenzori and Kigezi highland landslides, Nyamwamba/Mubuku and
 * Semliki river floods, cattle-corridor dry spells) and should be refined
 * with the district disaster office.
 *
 * Keep the district list in sync with DISTRICTS in TUOGERE-BE src/api/ews/services/ews.js.
 */

export const REGIONS = {
  kigezi: "Kigezi (South-Western Highlands)",
  ankole: "Ankole (South-Western)",
  rwenzori: "Rwenzori",
  elgon: "Elgon (Eastern)",
};

export const DISTRICTS = [
  { name: "Kisoro", region: "kigezi", lat: -1.285, lng: 29.685, languages: ["rufumbira", "en"], hazards: ["heavy_rain", "landslide", "hailstorm"] },
  { name: "Kabale", region: "kigezi", lat: -1.249, lng: 29.99, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "landslide", "flood", "hailstorm"] },
  { name: "Rubanda", region: "kigezi", lat: -1.19, lng: 29.85, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "landslide", "hailstorm"] },
  { name: "Rukiga", region: "kigezi", lat: -1.17, lng: 30.04, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "landslide"] },
  { name: "Kanungu", region: "kigezi", lat: -0.95, lng: 29.79, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "landslide", "flood"] },
  { name: "Rukungiri", region: "kigezi", lat: -0.79, lng: 29.93, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "dry_spell"] },
  { name: "Ntungamo", region: "ankole", lat: -0.88, lng: 30.26, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "dry_spell"] },
  { name: "Mbarara", region: "ankole", lat: -0.607, lng: 30.654, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "flood", "dry_spell"] },
  { name: "Isingiro", region: "ankole", lat: -0.84, lng: 30.8, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "dry_spell"] },
  { name: "Kazo", region: "ankole", lat: -0.05, lng: 30.76, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "dry_spell"] },
  { name: "Kiruhura", region: "ankole", lat: -0.2, lng: 30.84, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "dry_spell"] },
  { name: "Ibanda", region: "ankole", lat: -0.13, lng: 30.5, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "dry_spell"] },
  { name: "Bushenyi", region: "ankole", lat: -0.54, lng: 30.19, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "landslide"] },
  { name: "Sheema", region: "ankole", lat: -0.57, lng: 30.38, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "dry_spell"] },
  { name: "Mitooma", region: "ankole", lat: -0.62, lng: 30.02, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "dry_spell"] },
  { name: "Rubirizi", region: "ankole", lat: -0.27, lng: 30.11, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "dry_spell"] },
  { name: "Buhweju", region: "ankole", lat: -0.37, lng: 30.33, languages: ["runyankore_rukiga", "en"], hazards: ["heavy_rain", "landslide"] },
  { name: "Kasese", region: "rwenzori", lat: 0.183, lng: 30.083, languages: ["lukonzo", "en"], hazards: ["heavy_rain", "flood", "landslide"] },
  { name: "Bundibugyo", region: "rwenzori", lat: 0.708, lng: 30.063, languages: ["en"], hazards: ["heavy_rain", "flood", "landslide"] },
  { name: "Ntoroko", region: "rwenzori", lat: 1.05, lng: 30.48, languages: ["rutooro", "en"], hazards: ["heavy_rain", "flood"] },
  { name: "Bududa", region: "elgon", lat: 1.01, lng: 34.33, languages: ["lugisu", "en"], hazards: ["heavy_rain", "landslide", "flood"] },
  { name: "Mbale", region: "elgon", lat: 1.08, lng: 34.175, languages: ["lugisu", "en"], hazards: ["heavy_rain", "flood", "landslide"] },
];

/**
 * Extra forecast points inside larger or more varied districts, so one
 * district headquarters doesn't stand in for slopes, lowlands and lake shores
 * alike. Coordinates from the Open-Meteo place search (GeoNames). Each point
 * was checked to get a different ECMWF ensemble grid cell (0.25°) from its
 * district headquarters, as Open-Meteo reports it; a point in the same cell
 * would only repeat the district forecast. Recheck when adding points.
 */
export const AREAS = [
  { name: "Kilembe", district: "Kasese", lat: 0.1984, lng: 30.013, note: "Rwenzori foothills, Nyamwamba river" },
  { name: "Bwera", district: "Kasese", lat: 0.0661, lng: 29.7775, note: "west, on the DRC border" },
  { name: "Karugutu", district: "Ntoroko", lat: 0.7922, lng: 30.2223, note: "south, Semliki valley" },
  { name: "Kihihi", district: "Kanungu", lat: -0.75, lng: 29.7, note: "north, lowland plain" },
  { name: "Rwenshama", district: "Rukungiri", lat: -0.4124, lng: 29.7743, note: "north, Lake Edward shore" },
  { name: "Kikagati", district: "Isingiro", lat: -1.0425, lng: 30.6632, note: "south, Kagera river" },
  { name: "Nakivale", district: "Isingiro", lat: -0.7406, lng: 30.9963, note: "east, Nakivale settlement" },
  { name: "Kinoni", district: "Kiruhura", lat: -0.0394, lng: 31.0172, note: "north-east, Nyabushozi" },
  { name: "Bunagana", district: "Kisoro", lat: -1.2938, lng: 29.6021, note: "west, on the DRC border" },
];

export const areasOf = (districtName) => AREAS.filter((a) => a.district === districtName);

export const PERSONAS = [
  { key: "farmer", label: "Smallholder farmer" },
  { key: "vendor", label: "Market vendor" },
  { key: "flood_zone_resident", label: "Lives in flood/landslide area" },
  { key: "pastoralist", label: "Livestock keeper" },
  { key: "fisher", label: "Fisher" },
  { key: "other", label: "Other" },
];

export const LANGUAGES = [
  { key: "en", label: "English" },
  { key: "runyankore_rukiga", label: "Runyankore/Rukiga" },
  { key: "rufumbira", label: "Rufumbira" },
  { key: "lukonzo", label: "Lukonzo" },
  { key: "rutooro", label: "Rutooro" },
  { key: "luganda", label: "Luganda" },
  { key: "lugisu", label: "Lugisu" },
];

export function findDistrict(name) {
  const n = String(name || "").trim().toLowerCase();
  return DISTRICTS.find((d) => d.name.toLowerCase() === n) || null;
}

/**
 * The district a place belongs to: by name in the text ("Kabale town",
 * "Bwindi, Kanungu"), else the nearest district headquarters within maxKm.
 */
export function districtFor(text, lat, lng, maxKm = 35) {
  const t = String(text || "").toLowerCase();
  const named = DISTRICTS.find((d) => new RegExp(`\\b${d.name.toLowerCase()}\\b`).test(t));
  if (named) return named;
  if (lat == null || lng == null) return null;
  let best = null;
  for (const d of DISTRICTS) {
    const km = Math.hypot((d.lat - lat) * 111, (d.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180));
    if (km <= maxKm && (!best || km < best.km)) best = { d, km };
  }
  return best?.d || null;
}
