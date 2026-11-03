/**
 * Early warnings for any place someone looks up, not only the covered
 * districts: the same rules the district outlook uses (ECMWF ensemble rain,
 * GloFAS rivers, the last 30 days against the usual for these dates), plus a
 * very-hot-days notice from the heat score.
 *
 * A place within 35 km of a covered district uses that district's hazards
 * and satellite season; anywhere else gets heavy rain, flooding and dry
 * spells, and landslides on high ground.
 */

import { districtFor } from "./regions";
import { getDistrictForecast } from "./forecast";
import { getDailyWeather, getClimateNormals } from "./weather";
import { assessHazards, assessDiseaseRisks, applySeason, HAZARD_LABELS, SEVERITY_ORDER } from "./hazards";
import { draftMessages } from "./messages";
import { getSatellite } from "./satellite";

const HIGH_GROUND_M = 1400;

const HEAT_ADVICE = {
  other: "Very hot days ahead. Drink water often, rest in the shade at midday, and keep children, older people and the sick cool.",
  farmer: "Very hot days ahead. Water and mulch young crops early or late in the day, and work in the cool hours.",
};

const sum = (list, key) => list.reduce((n, d) => n + (d[key] || 0), 0);
const round = (v) => (v == null ? null : Math.round(v));

/** "much more than usual", or null without a normal to compare with. */
function versusUsual(amount, usual) {
  if (usual == null || usual < 5) return null;
  const r = amount / usual;
  if (r < 0.6) return "much less than usual";
  if (r < 0.85) return "less than usual";
  if (r <= 1.2) return "about usual";
  if (r <= 1.6) return "more than usual";
  return "much more than usual";
}

export async function placeWarnings({ name, lat, lng, elevation }) {
  const covered = districtFor(name, lat, lng);
  const highGround = elevation != null && elevation >= HIGH_GROUND_M;
  const point = covered
    ? { ...covered, lat, lng }
    : { name, lat, lng, hazards: ["heavy_rain", "flood", "dry_spell", ...(highGround ? ["landslide"] : [])] };
  const placeName = covered && covered.name.toLowerCase() !== String(name).toLowerCase() ? `${name}, ${covered.name}` : name;

  const [forecast, [weather], [normal], satellite] = await Promise.all([
    getDistrictForecast(point).catch(() => null),
    getDailyWeather([point]),
    getClimateNormals([point]),
    covered ? getSatellite(covered).catch(() => null) : null,
  ]);

  const signals = forecast ? assessHazards(point, forecast) : [];
  let all = [...signals, ...assessDiseaseRisks(weather, signals, normal)];
  if (covered) all = applySeason(point, all, satellite, weather, normal);

  const hazards = all
    .sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity])
    .map((s) => {
      const [community, farmer] = draftMessages(s, placeName, ["other", "farmer"]);
      return {
        hazard: s.variant || s.hazard,
        label: s.label || HAZARD_LABELS[s.hazard],
        severity: s.severity,
        date: s.date || null,
        endDate: s.endDate || null,
        probability: s.probability ?? null,
        reason: s.reason,
        advice: community?.message || null,
        farmerAdvice: farmer?.message || null,
      };
    });

  // Past, now and next, in rain against the usual for these dates.
  const past = weather?.pastSummary;
  const days = forecast?.rainfall?.days?.slice(0, 7) || [];
  const next7 = days.length ? round(sum(days, "median")) : null;
  return {
    place: placeName,
    district: covered?.name || null,
    covered: Boolean(covered),
    hazards,
    past30: past
      ? {
          rain: round(past.rainTotal),
          usual: round(normal?.past30?.meanRain),
          vsUsual: versusUsual(past.rainTotal, normal?.past30?.meanRain),
          heavyRainDays: past.heavyRainDays ?? null,
        }
      : null,
    now: weather?.current || null,
    next7: next7 != null
      ? {
          rain: next7,
          usual: round(normal?.next7?.meanRain),
          vsUsual: versusUsual(next7, normal?.next7?.meanRain),
          wettest: days.reduce((a, d) => ((d.median || 0) > (a?.median || 0) ? d : a), null),
        }
      : null,
    sources: [
      forecast ? forecast.rainfall.label : null,
      forecast?.river ? "GloFAS river forecast" : null,
      normal ? normal.source : null,
      covered && satellite?.chirps ? "CHIRPS satellite rainfall" : null,
    ].filter(Boolean),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Add a very-hot-days notice when the heat score (computed alongside, from
 * the usual highs here) is high. Returns a new warnings object.
 */
export function withHeatWarning(warnings, heat) {
  if (!warnings || !(heat?.score >= 60) || !heat.detail) return warnings;
  const hazards = [
    ...warnings.hazards,
    {
      hazard: "heat",
      label: "Very hot days",
      severity: heat.score >= 80 ? "watch" : "advisory",
      date: null,
      endDate: null,
      probability: null,
      reason: `Up to ${Math.round(heat.detail.peak)}°C this week${heat.detail.usualHigh != null ? `; usually about ${Math.round(heat.detail.usualHigh)}°C here at this time of year` : ""}`,
      advice: HEAT_ADVICE.other,
      farmerAdvice: HEAT_ADVICE.farmer,
    },
  ].sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
  return { ...warnings, hazards };
}
