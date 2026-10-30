/**
 * Turn a probabilistic forecast into hazard signals for one district.
 *
 * Thresholds are starting points for discussion with the national met
 * service and district disaster offices, not operational standards.
 * Every signal is a draft: a person reviews it before anything is sent.
 */

export const SEVERITY_ORDER = { advisory: 1, watch: 2, warning: 3 };

export const HAZARD_LABELS = {
  heavy_rain: "Heavy rain",
  flood: "Flooding",
  landslide: "Landslide",
  dry_spell: "Dry spell",
  hailstorm: "Hailstorm",
  strong_wind: "Strong wind",
};

const RULES = {
  heavyRain: [
    { severity: "warning", mm: 50, minProbability: 0.3 },
    { severity: "warning", mm: 30, minProbability: 0.6 },
    { severity: "watch", mm: 30, minProbability: 0.35 },
    { severity: "advisory", mm: 20, minProbability: 0.4 },
  ],
  landslide: [
    { severity: "warning", mm: 80, minProbability: 0.3 },
    { severity: "watch", mm: 50, minProbability: 0.4 },
    { severity: "advisory", mm: 50, minProbability: 0.2 },
  ],
  riverRatio: [
    { severity: "warning", ratio: 2 },
    { severity: "watch", ratio: 1.5 },
  ],
  dryWeek: [
    { severity: "watch", minProbability: 0.8 },
    { severity: "advisory", minProbability: 0.6 },
  ],
  lookaheadDays: 7,
};

function stronger(a, b) {
  if (!a) return b;
  if (!b) return a;
  return SEVERITY_ORDER[b.severity] > SEVERITY_ORDER[a.severity] ? b : a;
}

function heavyRainSignal(days) {
  let best = null;
  for (const day of days.slice(0, RULES.lookaheadDays)) {
    for (const rule of RULES.heavyRain) {
      const p = day.exceedance?.[rule.mm] ?? day.exceedance?.[String(rule.mm)];
      if (p != null && p >= rule.minProbability) {
        best = stronger(best, {
          hazard: "heavy_rain",
          severity: rule.severity,
          probability: p,
          thresholdMm: rule.mm,
          date: day.date,
          endDate: day.date,
          reason: `${Math.round(p * 100)}% chance of ${rule.mm}mm or more on ${day.date}`,
        });
        break;
      }
    }
  }
  return best;
}

function landslideSignal(accumulations) {
  let best = null;
  for (const acc of accumulations.slice(0, RULES.lookaheadDays)) {
    for (const rule of RULES.landslide) {
      const p = acc.exceedance?.[rule.mm] ?? acc.exceedance?.[String(rule.mm)];
      if (p != null && p >= rule.minProbability) {
        best = stronger(best, {
          hazard: "landslide",
          severity: rule.severity,
          probability: p,
          thresholdMm: rule.mm,
          date: acc.start,
          endDate: acc.end,
          reason: `${Math.round(p * 100)}% chance of ${rule.mm}mm or more over 3 days (${acc.start} to ${acc.end}) on saturated slopes`,
        });
        break;
      }
    }
  }
  return best;
}

function floodSignal(river, rain) {
  let best = null;
  for (const day of river || []) {
    if (day.ratio == null) continue;
    const rule = RULES.riverRatio.find((r) => day.ratio >= r.ratio);
    if (rule) {
      best = stronger(best, {
        hazard: "flood",
        severity: rule.severity,
        probability: null,
        thresholdMm: null,
        date: day.date,
        endDate: day.date,
        reason: `River flow forecast at ${day.ratio}x its usual level on ${day.date} (GloFAS)`,
      });
    }
  }
  // Heavy rain in a flood-prone district raises flood risk one step lower.
  if (rain && SEVERITY_ORDER[rain.severity] >= SEVERITY_ORDER.watch) {
    best = stronger(best, {
      ...rain,
      hazard: "flood",
      severity: rain.severity === "warning" ? "watch" : "advisory",
      reason: `${rain.reason}; rivers and low ground may flood`,
    });
  }
  return best;
}

function drySpellSignal(dryWeek) {
  if (!dryWeek?.probability) return null;
  const rule = RULES.dryWeek.find((r) => dryWeek.probability >= r.minProbability);
  if (!rule) return null;
  return {
    hazard: "dry_spell",
    severity: rule.severity,
    probability: dryWeek.probability,
    thresholdMm: dryWeek.thresholdMm,
    date: null,
    endDate: null,
    reason: `${Math.round(dryWeek.probability * 100)}% chance of less than ${dryWeek.thresholdMm}mm in the next 7 days`,
  };
}

/** Hazard signals for a district, most severe first. */
export function assessHazards(district, forecast) {
  const { rainfall, river } = forecast;
  const enabled = new Set(district.hazards);
  const signals = [];

  const rain = heavyRainSignal(rainfall.days || []);
  if (rain && enabled.has("heavy_rain")) signals.push(rain);

  if (enabled.has("landslide")) {
    const slide = landslideSignal(rainfall.accumulations || []);
    if (slide) signals.push(slide);
  }

  if (enabled.has("flood")) {
    const flood = floodSignal(river, rain);
    if (flood) signals.push(flood);
  }

  if (enabled.has("dry_spell")) {
    const dry = drySpellSignal(rainfall.dryWeek);
    if (dry) signals.push(dry);
  }

  return signals.sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
}
