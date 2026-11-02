/**
 * Probabilistic rainfall forecasts for last-mile early warning.
 *
 * Providers, in order of preference:
 *   1. An external forecast feed — when EWS_FORECAST_URL is set (e.g. a
 *      national met service product). Expected JSON, per location:
 *        { source, issuedAt, days: [{ date, median, p90, exceedance: { "10": 0.4, "20": 0.2, ... } }] }
 *   2. Open-Meteo ensemble (ECMWF IFS 0.25°, 51 members) — free, no key.
 *
 * River discharge comes from the Open-Meteo flood API (GloFAS), at a river
 * point near each flood-prone place, compared with that river's own flood
 * levels (rivers.json, from scripts/glofas-river-points.mjs).
 */

import RIVERS from "./rivers.json";

export const EXCEEDANCE_MM = [10, 20, 30, 50];
const ACCUMULATION_MM = [50, 80];
const DRY_WEEK_MM = 10;
const FORECAST_DAYS = 10;

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function round(n, digits = 1) {
  if (n == null || Number.isNaN(n)) return null;
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function share(values, predicate) {
  return values.length ? values.filter(predicate).length / values.length : 0;
}

/** Group hourly ensemble precipitation into daily totals per member. */
function dailyMemberTotals(hourly) {
  const memberKeys = Object.keys(hourly).filter((k) => k.startsWith("precipitation"));
  const byDate = new Map();
  hourly.time.forEach((t, i) => {
    const date = t.slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, memberKeys.map(() => 0));
    const totals = byDate.get(date);
    memberKeys.forEach((k, m) => {
      totals[m] += hourly[k][i] || 0;
    });
  });
  // Drop a partial final day (fewer than 24 hourly steps).
  const counts = new Map();
  hourly.time.forEach((t) => counts.set(t.slice(0, 10), (counts.get(t.slice(0, 10)) || 0) + 1));
  return [...byDate.entries()]
    .filter(([date]) => counts.get(date) >= 24)
    .map(([date, members]) => ({ date, members }));
}

function summarizeEnsemble(days) {
  const summary = days.map(({ date, members }) => {
    const sorted = [...members].sort((a, b) => a - b);
    const exceedance = {};
    for (const mm of EXCEEDANCE_MM) exceedance[mm] = round(share(members, (v) => v >= mm), 2);
    return {
      date,
      median: round(quantile(sorted, 0.5)),
      p10: round(quantile(sorted, 0.1)),
      p90: round(quantile(sorted, 0.9)),
      exceedance,
    };
  });

  // 3-day accumulations starting each day, per member (landslide trigger).
  const memberCount = days[0]?.members.length || 0;
  const accumulations = [];
  for (let i = 0; i + 2 < days.length; i += 1) {
    const totals = Array.from({ length: memberCount }, (_, m) =>
      days[i].members[m] + days[i + 1].members[m] + days[i + 2].members[m]
    );
    const exceedance = {};
    for (const mm of ACCUMULATION_MM) exceedance[mm] = round(share(totals, (v) => v >= mm), 2);
    accumulations.push({ start: days[i].date, end: days[i + 2].date, exceedance });
  }

  // Probability the next 7 days stay nearly dry.
  let dryWeek = null;
  if (days.length >= 7) {
    const totals = Array.from({ length: memberCount }, (_, m) =>
      days.slice(0, 7).reduce((sum, d) => sum + d.members[m], 0)
    );
    dryWeek = { thresholdMm: DRY_WEEK_MM, probability: round(share(totals, (v) => v < DRY_WEEK_MM), 2) };
  }

  return { days: summary, accumulations, dryWeek, members: memberCount };
}

// The ensemble updates a few times a day and each request is expensive under
// Open-Meteo's fair-use limits, so cache for 3 hours.
async function fetchJson(url, timeoutMs = 15000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), next: { revalidate: 10800 } });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return res.json();
}

function coords(points) {
  return `latitude=${points.map((p) => p.lat).join(",")}&longitude=${points.map((p) => p.lng).join(",")}`;
}

/** Open-Meteo answers a multi-location request with an array, a single one with an object. */
function asArray(data) {
  return Array.isArray(data) ? data : [data];
}

async function fetchOpenMeteoEnsemble(points) {
  const url =
    `https://ensemble-api.open-meteo.com/v1/ensemble?${coords(points)}` +
    `&hourly=precipitation&models=ecmwf_ifs025&forecast_days=${FORECAST_DAYS}&timezone=Africa%2FKampala`;
  const data = asArray(await fetchJson(url, 30000));
  return points.map((_, i) => {
    const hourly = data[i]?.hourly;
    if (!hourly?.time?.length) return null;
    return {
      provider: "open-meteo-ensemble",
      label: "ECMWF IFS ensemble (51 members) via Open-Meteo",
      ...summarizeEnsemble(dailyMemberTotals(hourly)),
    };
  });
}

async function fetchExternal(lat, lng) {
  const base = process.env.EWS_FORECAST_URL;
  if (!base) return null;
  const url = `${base}${base.includes("?") ? "&" : "?"}lat=${lat}&lng=${lng}`;
  const data = await fetchJson(url);
  if (!Array.isArray(data?.days) || !data.days.length) return null;
  return {
    provider: "external",
    label: data.source || "External forecast",
    issuedAt: data.issuedAt || null,
    days: data.days,
    accumulations: data.accumulations || [],
    dryWeek: data.dryWeek || null,
    members: data.members || null,
  };
}

/** The river point for a district or extra forecast point, if it has one. */
export function riverFor(point) {
  return RIVERS.points[point.district ? `${point.name}, ${point.district}` : point.name] || null;
}

/**
 * 7-day river forecast at each place's river point: the ensemble median and
 * 75th percentile (a wet case), with the river's usual flow for the month and
 * its 2- and 5-year flood levels. Null for places without a river point.
 */
async function fetchRiverDischarge(points) {
  const rivers = points.map(riverFor);
  const withRiver = rivers.map((r, i) => (r ? i : -1)).filter((i) => i >= 0);
  if (!withRiver.length) return points.map(() => null);
  const url =
    `https://flood-api.open-meteo.com/v1/flood?${coords(withRiver.map((i) => rivers[i]))}` +
    `&daily=river_discharge_median,river_discharge_p75,river_discharge_max&forecast_days=7`;
  try {
    const data = asArray(await fetchJson(url, 15000));
    const out = points.map(() => null);
    withRiver.forEach((i, k) => {
      const d = data[k]?.daily;
      const r = rivers[i];
      if (!d?.time?.length) return;
      out[i] = d.time.map((date, j) => ({
        date,
        median: round(d.river_discharge_median?.[j], 2),
        p75: round(d.river_discharge_p75?.[j], 2),
        max: round(d.river_discharge_max?.[j], 2),
        usual: r.usualByMonth[+date.slice(5, 7) - 1],
        flood2: r.flood2,
        flood5: r.flood5,
      }));
    });
    return out;
  } catch {
    return points.map(() => null);
  }
}

/**
 * Forecast bundles for several districts in one request per provider.
 * A district whose rainfall forecast is missing gets { error }.
 */
export async function getDistrictForecasts(districts) {
  const [external, river] = await Promise.all([
    Promise.all(districts.map((d) => fetchExternal(d.lat, d.lng).catch(() => null))),
    fetchRiverDischarge(districts),
  ]);

  const needEnsemble = districts.filter((_, i) => !external[i]);
  let ensemble = [];
  let ensembleError = null;
  if (needEnsemble.length) {
    try {
      ensemble = await fetchOpenMeteoEnsemble(needEnsemble);
    } catch (err) {
      ensembleError = err.message;
    }
  }

  const generatedAt = new Date().toISOString();
  return districts.map((district, i) => {
    const rainfall = external[i] || ensemble[needEnsemble.indexOf(district)] || null;
    const base = { district: district.name, lat: district.lat, lng: district.lng, generatedAt };
    if (!rainfall) return { ...base, error: ensembleError || "No rainfall forecast returned" };
    const point = riverFor(district);
    return { ...base, rainfall, river: river[i], riverPoint: point ? { lat: point.lat, lng: point.lng } : null };
  });
}

/** Forecast bundle for one district. Throws when no rainfall provider answers. */
export async function getDistrictForecast(district) {
  const [forecast] = await getDistrictForecasts([district]);
  if (forecast.error) throw new Error(forecast.error);
  return forecast;
}
