/**
 * Children's health early warning for a district: how likely the weather is
 * to push up the illnesses that hit young children hardest, so parents,
 * schools and health workers can act before cases rise.
 *
 * Inputs are real: the last 30 days and next 7 days of weather (Open-Meteo),
 * the usual rain for these dates (ERA5, last 5 years) and air quality
 * (CAMS via Open-Meteo). The rules are simple, explainable starting points to
 * review with district health teams, not a diagnosis or a case count.
 * Confirmed outbreaks come from health officials and go out as alerts from
 * the admin console.
 */

import { getDailyWeather, getClimateNormals } from "./weather";
import { heatIndexC } from "../early-warning/predictions";

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const round = (v, d = 0) => (v == null || Number.isNaN(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function levelOf(score) {
  if (score >= 70) return "warning";
  if (score >= 45) return "watch";
  if (score >= 25) return "advisory";
  return "low";
}

const ADVICE = {
  malaria: [
    "Children under 5 sleep under a treated net every night.",
    "Clear standing water, tins and old tyres around the home.",
    "A child with fever: test for malaria at the health centre the same day.",
  ],
  diarrhoea: [
    "Boil or treat drinking water; keep it covered.",
    "Wash hands with soap after the latrine and before feeding children.",
    "Diarrhoea: give ORS and zinc and go to the health centre if it does not stop.",
  ],
  respiratory: [
    "Keep babies away from cooking smoke; cook outside or with a window open.",
    "Keep children warm at night.",
    "Fast or hard breathing, or chest pulling in: go to the health centre at once.",
  ],
  heat: [
    "Children drink water often, even when not asked.",
    "Keep play and school sports out of the midday sun.",
    "Watch for tiredness, headache or vomiting; cool the child and seek care.",
  ],
};

const LABELS = {
  malaria: "Malaria",
  diarrhoea: "Diarrhoea & cholera",
  respiratory: "Pneumonia & coughs",
  heat: "Heat illness",
};

async function getAirQuality(lat, lng) {
  try {
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}` +
      `&hourly=pm2_5,dust&forecast_days=5&timezone=Africa%2FKampala`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000), next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const h = data?.hourly;
    if (!h?.time?.length) return null;
    const byDay = {};
    h.time.forEach((t, i) => {
      const day = t.slice(0, 10);
      (byDay[day] ||= { pm: [], dust: [] });
      if (h.pm2_5?.[i] != null) byDay[day].pm.push(h.pm2_5[i]);
      if (h.dust?.[i] != null) byDay[day].dust.push(h.dust[i]);
    });
    return Object.entries(byDay).map(([date, v]) => ({ date, pm25: round(mean(v.pm), 1), dust: round(Math.max(0, ...v.dust), 0) }));
  } catch {
    return null;
  }
}

function malariaRisk(past, normal, days) {
  // Mosquitoes breed in water left by rain; cases follow 2–4 weeks later.
  const reasons = [];
  let score = 0;
  const rain = past?.rainTotal ?? null;
  const usual = normal?.past30?.meanRain ?? null;
  if (rain != null) {
    score += clamp((rain / 150) * 30, 0, 30); // wet month on its own
    if (usual && usual > 10) {
      const ratio = rain / usual;
      score += clamp((ratio - 0.9) * 50, 0, 25);
      reasons.push(`${Math.round(rain)}mm of rain in the last 30 days (usually ${Math.round(usual)}mm)`);
    } else reasons.push(`${Math.round(rain)}mm of rain in the last 30 days`);
  }
  const temp = past?.meanTemp ?? mean(days.map((d) => (d.tMax + d.tMin) / 2));
  if (temp != null) {
    // Parasites grow fastest around 25–30°C, slowly below 21°C and hardly
    // at all below 16°C, which is why the cool highlands see less malaria.
    const suit =
      temp < 16 ? 0 : temp < 21 ? ((temp - 16) / 5) * 0.6 : temp < 25 ? 0.6 + ((temp - 21) / 4) * 0.4 : temp <= 30 ? 1 : clamp(1 - (temp - 30) / 6, 0, 1);
    score += suit * 30;
    reasons.push(`average ${round(temp, 1)}°C (${suit >= 0.8 ? "warm enough for fast mosquito breeding" : suit > 0.3 ? "mild, mosquitoes breed more slowly" : "cool, slows mosquitoes"})`);
    score *= 0.2 + 0.8 * suit; // too cold, little malaria however wet
  }
  const hum = past?.meanHumidity;
  if (hum != null && hum >= 70) {
    score += 10;
    reasons.push(`humid air (${hum}%) helps mosquitoes live longer`);
  }
  return { score: clamp(score), reasons };
}

function diarrhoeaRisk(past, days) {
  // Heavy rain and floods wash latrine waste into wells and springs; heat
  // helps germs grow in food and water.
  const reasons = [];
  let score = 0;
  const heavyPast = past?.heavyRainDays ?? 0;
  if (heavyPast) {
    score += clamp(heavyPast * 12, 0, 30);
    reasons.push(`${heavyPast} heavy-rain day${heavyPast > 1 ? "s" : ""} (20mm+) in the last 30 days`);
  }
  const next = days.reduce((n, d) => n + (d.rain || 0), 0);
  const heavyNext = days.filter((d) => (d.rain || 0) >= 20).length;
  score += clamp(heavyNext * 15, 0, 30) + clamp((next - 30) / 2, 0, 15);
  if (heavyNext) reasons.push(`${heavyNext} heavy-rain day${heavyNext > 1 ? "s" : ""} forecast this week`);
  else if (next >= 30) reasons.push(`${Math.round(next)}mm of rain forecast this week`);
  const hot = Math.max(...days.map((d) => d.tMax ?? 0));
  if (hot >= 30) {
    score += clamp((hot - 29) * 5, 0, 20);
    reasons.push(`up to ${Math.round(hot)}°C: food and water spoil faster`);
  }
  // Long dry spells push families to unsafe water too.
  if ((past?.rainTotal ?? 99) < 10) {
    score += 15;
    reasons.push("very little rain: families may use unsafe water sources");
  }
  return { score: clamp(score), reasons };
}

function respiratoryRisk(days, air) {
  // Smoke and dust irritate small lungs; cold, damp nights add chest infections.
  const reasons = [];
  let score = 0;
  const pm = air?.length ? Math.max(...air.map((a) => a.pm25 ?? 0)) : null;
  if (pm != null) {
    // WHO daily guideline is 15 µg/m³.
    score += clamp(((pm - 15) / 35) * 50, 0, 50);
    reasons.push(`fine dust and smoke (PM2.5) up to ${round(pm, 0)} µg/m³ (WHO daily guideline 15)`);
  }
  const dust = air?.length ? Math.max(...air.map((a) => a.dust ?? 0)) : null;
  if (dust != null && dust >= 50) {
    score += clamp((dust - 50) / 5, 0, 15);
    reasons.push(`dusty air (${dust} µg/m³)`);
  }
  const coldNights = days.filter((d) => d.tMin != null && d.tMin <= 12).length;
  if (coldNights) {
    score += clamp(coldNights * 6, 0, 25);
    reasons.push(`${coldNights} cold night${coldNights > 1 ? "s" : ""} (12°C or below)`);
  }
  const damp = mean(days.map((d) => d.humidity).filter((h) => h != null));
  if (damp != null && damp >= 85 && coldNights) {
    score += 10;
    reasons.push("cold and damp together");
  }
  return { score: clamp(score), reasons };
}

function heatRisk(days) {
  const reasons = [];
  const peaks = days.map((d) => (d.tMax != null ? heatIndexC(d.tMax, Math.min(90, d.humidity ?? 60)) : null)).filter((v) => v != null);
  if (!peaks.length) return { score: 0, reasons };
  const hi = Math.max(...peaks);
  const hotDays = peaks.filter((v) => v >= 32).length;
  // Children feel heat from about a 30°C heat index; 40°C+ is dangerous.
  const score = clamp(((hi - 29) / 11) * 80) + clamp(hotDays * 4, 0, 20);
  reasons.push(`feels like up to ${Math.round(hi)}°C${hotDays ? ` on ${hotDays} day${hotDays > 1 ? "s" : ""}` : ""}`);
  return { score: clamp(score), reasons };
}

/** The children's health outlook for a place: { place, risks, days, sources }. */
export async function childHealthOutlook(point) {
  const [[weather], [normal], air] = await Promise.all([
    getDailyWeather([point]),
    getClimateNormals([point]),
    getAirQuality(point.lat, point.lng),
  ]);
  if (!weather) throw new Error("Weather is not available right now");
  const days = weather.days || [];
  const past = weather.pastSummary;

  const results = {
    malaria: malariaRisk(past, normal, days),
    diarrhoea: diarrhoeaRisk(past, days),
    respiratory: respiratoryRisk(days, air),
    heat: heatRisk(days),
  };
  const risks = Object.entries(results)
    .map(([key, r]) => {
      const score = Math.round(r.score);
      return { key, label: LABELS[key], score, level: levelOf(score), reasons: r.reasons, advice: ADVICE[key] };
    })
    .sort((a, b) => b.score - a.score);

  const airByDay = Object.fromEntries((air || []).map((a) => [a.date, a]));
  return {
    place: point.name,
    risks,
    days: days.map((d) => ({
      date: d.date,
      tMax: d.tMax,
      tMin: d.tMin,
      rain: d.rain,
      feelsLike: d.tMax != null ? round(heatIndexC(d.tMax, Math.min(90, d.humidity ?? 60)), 0) : null,
      pm25: airByDay[d.date]?.pm25 ?? null,
    })),
    past30: past ? { rain: past.rainTotal, usual: normal?.past30?.meanRain ?? null, heavyRainDays: past.heavyRainDays } : null,
    sources: [
      "Open-Meteo weather (last 30 days and 7-day forecast)",
      normal ? normal.source : null,
      air ? "CAMS air quality via Open-Meteo" : null,
    ].filter(Boolean),
    generatedAt: new Date().toISOString(),
  };
}
