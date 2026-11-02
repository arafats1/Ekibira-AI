/**
 * Picks a river point for each flood-prone district (and its extra forecast
 * points) and works out its flood levels from GloFAS, writing
 * src/lib/ews/rivers.json. Run again when districts or areas change:
 *
 *   node scripts/glofas-river-points.mjs
 *
 * - River point: of a 5×5 grid of GloFAS cells (0.05°) around the place, the
 *   one carrying the most water on two sample days (one wet season each), so
 *   we watch the main river nearby rather than whatever stream the district
 *   headquarters happens to sit on.
 * - Flood levels from 10 years of daily discharge (2013–2022): the 2-year
 *   level (median of the yearly peaks, about bank-full) and the 5-year level
 *   (80th percentile of the yearly peaks), the levels GloFAS itself warns on.
 *   Ten years is short for return periods, so treat them as estimates.
 * - Usual flow per calendar month (median of daily values), for charts.
 *
 * Open-Meteo counts long requests as many calls; this stays well inside the
 * free daily limit by sampling two days for the search.
 */

import { writeFileSync } from "node:fs";
import { AREAS, DISTRICTS } from "../src/lib/ews/regions.js";

const API = "https://flood-api.open-meteo.com/v1/flood";
const SAMPLE_DAYS = ["2020-05-05", "2020-11-20"];
const YEARS = [2013, 2022];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(params) {
  const res = await fetch(`${API}?${new URLSearchParams(params)}`);
  if (!res.ok) throw new Error(`Open-Meteo answered ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

const quantile = (sorted, q) => {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  return sorted[lo] + (sorted[Math.ceil(pos)] - sorted[lo]) * (pos - lo);
};
const round = (n) => (n >= 10 ? Math.round(n) : Math.round(n * 100) / 100);

async function riverPoint(lat, lng) {
  const grid = [];
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) grid.push([+(lat + i * 0.05).toFixed(3), +(lng + j * 0.05).toFixed(3)]);
  const totals = grid.map(() => 0);
  const cells = [];
  for (const day of SAMPLE_DAYS) {
    const rows = await get({ latitude: grid.map((g) => g[0]).join(","), longitude: grid.map((g) => g[1]).join(","), daily: "river_discharge", start_date: day, end_date: day });
    rows.forEach((r, k) => {
      totals[k] += r.daily?.river_discharge?.[0] || 0;
      cells[k] = [r.latitude, r.longitude];
    });
    await sleep(1500);
  }
  const best = totals.indexOf(Math.max(...totals));
  return { lat: +cells[best][0].toFixed(4), lng: +cells[best][1].toFixed(4) };
}

async function levels(lat, lng) {
  const [row] = await get({ latitude: lat, longitude: lng, daily: "river_discharge", start_date: `${YEARS[0]}-01-01`, end_date: `${YEARS[1]}-12-31` });
  const { time, river_discharge: q } = row.daily;
  const peaks = {};
  const byMonth = Array.from({ length: 12 }, () => []);
  time.forEach((d, i) => {
    if (q[i] == null) return;
    const y = d.slice(0, 4);
    peaks[y] = Math.max(peaks[y] ?? 0, q[i]);
    byMonth[+d.slice(5, 7) - 1].push(q[i]);
  });
  const sortedPeaks = Object.values(peaks).sort((a, b) => a - b);
  return {
    flood2: round(quantile(sortedPeaks, 0.5)),
    flood5: round(quantile(sortedPeaks, 0.8)),
    usualByMonth: byMonth.map((v) => round(quantile(v.sort((a, b) => a - b), 0.5))),
  };
}

const places = [
  ...DISTRICTS.filter((d) => d.hazards.includes("flood")).map((d) => ({ key: d.name, lat: d.lat, lng: d.lng })),
  ...AREAS.filter((a) => DISTRICTS.find((d) => d.name === a.district)?.hazards.includes("flood")).map((a) => ({ key: `${a.name}, ${a.district}`, lat: a.lat, lng: a.lng })),
];

const out = { source: `GloFAS v4 via Open-Meteo, daily discharge ${YEARS[0]}–${YEARS[1]}`, generated: new Date().toISOString().slice(0, 10), points: {} };
for (const p of places) {
  const river = await riverPoint(p.lat, p.lng);
  await sleep(1500);
  const lv = await levels(river.lat, river.lng);
  out.points[p.key] = { ...river, ...lv };
  console.log(p.key.padEnd(20), JSON.stringify(out.points[p.key]));
  await sleep(1500);
}
writeFileSync(new URL("../src/lib/ews/rivers.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log("Wrote src/lib/ews/rivers.json");
