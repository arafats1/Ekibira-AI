/**
 * Official early warnings from the Department of Meteorological Services
 * (DMS), Ministry of Water and Environment, from its open CAP feed (no token
 * needed): https://wids.mwe.go.ug/portal/api-docs
 *
 * Each alert is CAP 1.2 XML with an English, Swahili and Luganda block and a
 * polygon of the affected area. The feed names no districts, so ours are
 * matched by their point (and extra area points) falling inside a polygon, or
 * by name in the headline.
 */

import { AREAS, DISTRICTS } from "./regions";

const BASE = "https://wids.mwe.go.ug/api/v1";
export const DMS_SOURCE = "Department of Meteorological Services, Ministry of Water and Environment";

// CAP severity → our levels.
const LEVEL = { Extreme: "warning", Severe: "warning", Moderate: "watch", Minor: "advisory" };

const decode = (s) =>
  String(s || "")
    .replace(/&#13;/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : null;
};
const tags = (xml, name) => [...xml.matchAll(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "g"))].map((m) => decode(m[1]));

/** "lat,lng lat,lng …" → [[lat, lng], …] */
const polygonOf = (s) =>
  s
    .trim()
    .split(/\s+/)
    .map((p) => p.split(",").map(Number))
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));

function inside([lat, lng], poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** One CAP alert's XML → a plain object, with the districts it covers. */
export function parseCap(xml, id = null) {
  const infos = [...xml.matchAll(/<info>([\s\S]*?)<\/info>/g)].map((m) => m[1]);
  if (!infos.length) return null;
  const byLang = Object.fromEntries(infos.map((i) => [(tag(i, "language") || "en-UG").slice(0, 2), i]));
  const en = byLang.en || infos[0];
  const polygons = tags(en, "polygon").map(polygonOf).filter((p) => p.length >= 3);
  const headline = tag(en, "headline") || "";

  const text = headline.toLowerCase();
  const points = [...DISTRICTS.map((d) => ({ district: d.name, lat: d.lat, lng: d.lng })), ...AREAS.map((a) => ({ district: a.district, lat: a.lat, lng: a.lng }))];
  const districts = [
    ...new Set([
      ...points.filter((p) => polygons.some((poly) => inside([p.lat, p.lng], poly))).map((p) => p.district),
      ...DISTRICTS.filter((d) => new RegExp(`\\b${d.name.toLowerCase()}\\b`).test(text)).map((d) => d.name),
    ]),
  ];

  const severity = tag(en, "severity");
  return {
    id: id ?? tag(xml, "identifier"),
    identifier: tag(xml, "identifier"),
    sent: tag(xml, "sent"),
    event: tag(en, "event"),
    severity,
    level: LEVEL[severity] || "advisory",
    urgency: tag(en, "urgency"),
    certainty: tag(en, "certainty"),
    headline,
    description: tag(en, "description"),
    instruction: tag(en, "instruction"),
    effective: tag(en, "effective"),
    onset: tag(en, "onset"),
    expires: tag(en, "expires"),
    web: tag(en, "web"),
    // Other languages DMS sent, e.g. { sw: {event, headline, instruction}, lg: {…} }
    translations: Object.fromEntries(
      Object.entries(byLang)
        .filter(([lang]) => lang !== "en")
        .map(([lang, i]) => [lang, { event: tag(i, "event"), headline: tag(i, "headline"), instruction: tag(i, "instruction") }])
    ),
    polygons,
    districts,
    source: DMS_SOURCE,
  };
}

async function fetchText(url, revalidate = 300) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), next: { revalidate } });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`DMS ${res.status}`);
  return res.text();
}

/**
 * Active DMS alerts (not yet expired), most severe first. Returns
 * { alerts, error } so a DMS outage never breaks our own warnings.
 */
export async function getDmsAlerts() {
  try {
    const list = JSON.parse((await fetchText(`${BASE}/cap/all`)) || "{}");
    const items = Array.isArray(list.alerts) ? list.alerts : [];
    const parsed = await Promise.all(
      items.map(async (a) => {
        const id = a.id ?? a.alert_id ?? null;
        const url = a.cap_xml_url || (id != null ? `${BASE}/cap/${id}` : null);
        if (!url) return null;
        const xml = await fetchText(url).catch(() => null);
        if (!xml) return null;
        const alert = parseCap(xml, id);
        return alert && { ...alert, web: alert.web || a.html_url || null };
      })
    );
    const now = Date.now();
    const rank = { warning: 3, watch: 2, advisory: 1 };
    const alerts = parsed
      .filter((a) => a && (!a.expires || new Date(a.expires).getTime() > now))
      .sort((a, b) => rank[b.level] - rank[a.level]);
    return { alerts, error: null };
  } catch (err) {
    return { alerts: [], error: err.message };
  }
}

/** The active DMS alerts that cover one of our districts. */
export const dmsFor = (alerts, district) => alerts.filter((a) => a.districts.includes(district));
