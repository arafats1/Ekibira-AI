/**
 * Ground truth by place: which forecast point (district headquarters or an
 * extra point from AREAS) each report belongs to, and each place's track
 * record — how the automatic signals compared with what agents reported and
 * community members replied by SMS.
 *
 * Reports are placed by the phone's GPS, else the typed village found on the
 * map, else the first place the report names that was found. Community replies
 * ("what happened", by app, SMS or USSD) are placed by the app's GPS or the
 * member's village found on the map; without either they count for the
 * headquarters point.
 */

import { areasOf } from "./regions";

const km = (aLat, aLng, bLat, bLng) => Math.hypot((aLat - bLat) * 111, (aLng - bLng) * 111 * Math.cos((aLat * Math.PI) / 180));

/** The district's forecast points: headquarters first, then its extra points. */
export function pointsOf(district) {
  return [{ area: null, name: district.name, lat: district.lat, lng: district.lng }, ...areasOf(district.name).map((a) => ({ area: a.name, name: a.name, lat: a.lat, lng: a.lng }))];
}

/** Where a report is, and the forecast point nearest to it. */
export function placeReport(report, district) {
  let at = null;
  if (report.latitude != null && report.longitude != null) {
    at = { lat: Number(report.latitude), lng: Number(report.longitude), source: report.locationSource || "gps" };
  } else {
    const named = (report.places || []).find((p) => p.lat != null);
    if (named) at = { lat: named.lat, lng: named.lng, source: `named place (${named.name})` };
  }
  if (!at) return { area: null, point: district.name, source: "district only", km: null };
  const nearest = pointsOf(district)
    .map((p) => ({ ...p, km: km(at.lat, at.lng, p.lat, p.lng) }))
    .sort((a, b) => a.km - b.km)[0];
  return { area: nearest.area, point: nearest.name, source: at.source, km: Math.round(nearest.km), lat: at.lat, lng: at.lng };
}

// Which reported events confirm a signal: heavy rain is confirmed by what heavy rain causes.
const CONFIRMS = {
  heavy_rain: ["heavy_rain", "flood", "landslide", "hailstorm"],
  flood: ["flood"],
  landslide: ["landslide"],
  hailstorm: ["hailstorm"],
  strong_wind: ["strong_wind"],
  dry_spell: ["dry_spell"],
  crop_disease: ["crop_disease"],
  livestock_disease: ["livestock_disease"],
  human_disease: ["human_disease"],
};
const FEEDBACK_EVENT = { heavy_rain: "heavy_rain", flood: "flood", landslide: "landslide", hail: "hailstorm", crop_disease: "crop_disease", livestock_disease: "livestock_disease" };
const DENIES_RAIN = ["no_rain", "light_rain"];

const addDays = (date, n) => new Date(Date.parse(`${date}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const dayOf = (v) => String(v || "").slice(0, 10);

/**
 * Per place and hazard since signal logging began (loggingSince, across all
 * districts; nothing before it is counted, as there is no record either way):
 * - signalDays: days with an automatic signal there;
 * - confirmed: of those, days followed within 2 days by a matching report or community reply;
 * - denied: heavy-rain days where community replies said little or no rain and nothing confirmed it;
 * - missed: days something was reported with no signal for it there in the 3 days before.
 * No report after a signal doesn't mean nothing happened, so unconfirmed is not called a false alarm.
 */
export function trackRecord({ district, logs = [], reports = [], feedback = [], loggingSince = null }) {
  const since = loggingSince || (logs.length ? logs.map((l) => l.date).sort()[0] : null);
  const points = pointsOf(district).map((p) => ({ ...p, reports: 0, replies: 0, rows: {} }));
  const pointFor = (area) => points.find((p) => p.area === (area || null)) || points[0];
  const row = (p, hazard) => (p.rows[hazard] ||= { hazard, signalDays: 0, confirmed: 0, denied: 0, missed: 0 });

  const events = points.map(() => []); // { date, event, denies }
  for (const r of reports) {
    if (r.status === "dismissed" || !r.occurredOn) continue;
    if (!since || r.occurredOn < since) continue;
    const i = points.indexOf(pointFor(placeReport(r, district).area));
    points[i].reports++;
    events[i].push({ date: dayOf(r.occurredOn), event: r.category });
  }
  for (const f of feedback) {
    const date = dayOf(f.observedOn || f.createdAt);
    if (!since || date < since) continue;
    const i = points.indexOf(pointFor(placeReport(f, district).area));
    points[i].replies++;
    events[i].push({ date, event: FEEDBACK_EVENT[f.observation] || null, denies: DENIES_RAIN.includes(f.observation) });
  }

  points.forEach((p, i) => {
    const signal = {}; // hazard -> Set(date)
    for (const l of logs) if ((l.area || null) === p.area) (signal[l.hazard] ||= new Set()).add(l.date);
    for (const [hazard, days] of Object.entries(signal)) {
      const r = row(p, hazard);
      for (const d of days) {
        r.signalDays++;
        const window = events[i].filter((e) => e.date >= d && e.date <= addDays(d, 2));
        if (window.some((e) => (CONFIRMS[hazard] || [hazard]).includes(e.event))) r.confirmed++;
        else if (hazard === "heavy_rain" && window.some((e) => e.denies)) r.denied++;
      }
    }
    const seen = new Set();
    for (const e of events[i]) {
      if (!e.event || e.event === "other" || seen.has(`${e.event}|${e.date}`)) continue;
      seen.add(`${e.event}|${e.date}`);
      const covered = Object.entries(signal).some(
        ([hazard, days]) => (CONFIRMS[hazard] || [hazard]).includes(e.event) && [...days].some((d) => d <= e.date && d >= addDays(e.date, -3))
      );
      if (!covered) row(p, e.event).missed++;
    }
  });

  return {
    district: district.name,
    since,
    loggedDays: since ? Math.round((Date.parse(new Date().toISOString().slice(0, 10)) - Date.parse(since)) / 86400000) + 1 : 0,
    places: points.map(({ area, name, reports: n, replies, rows }) => ({ area, name, reports: n, replies, hazards: Object.values(rows) })),
  };
}

/** One line per place for an AI prompt, or [] when there is nothing yet. */
export function trackLines(record) {
  if (!record?.since) return [];
  return record.places
    .filter((p) => p.hazards.length || p.reports || p.replies)
    .map((p) => {
      const parts = p.hazards.map((h) => {
        const bits = [];
        if (h.signalDays) bits.push(`${h.hazard}: signal on ${h.signalDays} day(s), confirmed on the ground ${h.confirmed}${h.denied ? `, contradicted by community replies ${h.denied}` : ""}`);
        if (h.missed) bits.push(`${h.hazard}: reported ${h.missed} time(s) with no signal`);
        return bits.join("; ");
      });
      return `${p.area ? `${p.name} (extra point)` : `${p.name} (district headquarters)`}: ${p.reports} report(s), ${p.replies} community reply(ies). ${parts.join("; ") || "No signals or matched events."}`;
    });
}
