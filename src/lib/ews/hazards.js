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
  crop_disease: "Crop disease risk",
  livestock_disease: "Livestock disease risk",
  human_disease: "Malaria & waterborne disease risk",
};

export const DISEASE_HAZARDS = ["crop_disease", "livestock_disease", "human_disease"];

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
  // Weather that favours disease. Starting points to agree with district
  // agriculture, veterinary and health officers; they flag risk, not cases.
  // Rain rules compare with the normal for the same dates (getClimateNormals)
  // and fall back to fixed totals only when no normal is available.
  blight: { minHumidity: 88, minTMin: 10, maxTMax: 28, watchDays: 4, advisoryDays: 3 },
  livestock: {
    advisory: { ratio: 1.4, minRain14: 60 },
    watch: { ratio: 1.8, minRain14: 100 },
    fallback: { advisory: 120, watch: 180 },
    minMeanTemp: 16,
  },
  malaria: {
    advisory: { ratio: 1.3, minRain30: 100 },
    watch: { ratio: 1.7, minRain30: 150 },
    fallback: { advisory: 220, watch: 320 },
    minMeanTemp: 17,
    maxMeanTemp: 32,
  },
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

function longestRun(days, test) {
  let best = { length: 0 };
  let run = [];
  for (const d of days) {
    if (test(d)) run.push(d);
    else run = [];
    if (run.length > best.length) best = { length: run.length, start: run[0].date, end: run[run.length - 1].date };
  }
  return best;
}

/** Late blight and other fungal disease: runs of humid, mild days. */
function cropDiseaseSignal(days) {
  const r = RULES.blight;
  const run = longestRun(days, (d) => d.humidity >= r.minHumidity && d.tMin >= r.minTMin && d.tMax <= r.maxTMax);
  if (run.length < r.advisoryDays) return null;
  return {
    hazard: "crop_disease",
    severity: run.length >= r.watchDays ? "watch" : "advisory",
    probability: null,
    thresholdMm: null,
    date: run.start,
    endDate: run.end,
    reason: `${run.length} humid, mild days in a row forecast (${run.start} to ${run.end}): good conditions for late blight and fungal leaf disease`,
  };
}

function vsNormal(rain, normalRain) {
  if (!normalRain) return "";
  const pct = Math.round((rain / normalRain - 1) * 100);
  return pct >= 0 ? `, ${pct}% above the usual ${normalRain}mm` : `, ${-pct}% below the usual ${normalRain}mm`;
}

/** Ticks, worms and foot rot follow unusually long wet spells. */
function livestockDiseaseSignal(summary, normal) {
  const r = RULES.livestock;
  if (!summary || summary.meanTemp14 == null || summary.meanTemp14 < r.minMeanTemp) return null;
  const usual = normal?.past14?.meanRain;
  let severity = null;
  if (usual) {
    const ratio = summary.rain14 / Math.max(usual, 1);
    if (ratio >= r.watch.ratio && summary.rain14 >= r.watch.minRain14) severity = "watch";
    else if (ratio >= r.advisory.ratio && summary.rain14 >= r.advisory.minRain14) severity = "advisory";
  } else if (summary.rain14 >= r.fallback.watch) severity = "watch";
  else if (summary.rain14 >= r.fallback.advisory) severity = "advisory";
  if (!severity) return null;
  return {
    hazard: "livestock_disease",
    severity,
    probability: null,
    thresholdMm: null,
    date: null,
    endDate: null,
    reason: `${summary.rain14}mm of rain in the last 14 days${vsNormal(summary.rain14, usual)}, ${summary.meanTemp14}°C average: tick, worm and foot rot risk rises`,
  };
}

/** Malaria rises 2–4 weeks after unusually heavy rains; floods spread waterborne disease. */
function humanDiseaseSignal(summary, flood, normal) {
  const r = RULES.malaria;
  let signal = null;
  const warmEnough = summary?.meanTemp != null && summary.meanTemp >= r.minMeanTemp && summary.meanTemp <= r.maxMeanTemp;
  if (warmEnough) {
    // Rain only: recent temperatures come from a forecast model and the
    // normal from ERA5, which differ by a degree or more in the highlands.
    const usual = normal?.past30?.meanRain;
    let severity = null;
    if (usual) {
      const ratio = summary.rainTotal / Math.max(usual, 1);
      if (ratio >= r.watch.ratio && summary.rainTotal >= r.watch.minRain30) severity = "watch";
      else if (ratio >= r.advisory.ratio && summary.rainTotal >= r.advisory.minRain30) severity = "advisory";
    } else if (summary.rainTotal >= r.fallback.watch) severity = "watch";
    else if (summary.rainTotal >= r.fallback.advisory) severity = "advisory";
    if (severity) {
      signal = {
        hazard: "human_disease",
        severity,
        probability: null,
        thresholdMm: null,
        date: null,
        endDate: null,
        reason: `${summary.rainTotal}mm of rain in the last 30 days${vsNormal(summary.rainTotal, usual)}: mosquito breeding and malaria usually rise 2–4 weeks later`,
      };
    }
  }
  if (flood && SEVERITY_ORDER[flood.severity] >= SEVERITY_ORDER.watch) {
    signal = stronger(signal, {
      hazard: "human_disease",
      severity: "advisory",
      probability: null,
      thresholdMm: null,
      date: flood.date,
      endDate: flood.endDate,
      reason: "Flooding expected: risk of diarrhoea and cholera from contaminated water",
    });
  }
  return signal;
}

/**
 * Disease-risk signals from everyday weather (getDailyWeather) and the normal
 * for these dates (getClimateNormals). Separate from assessHazards because
 * they use observed past rain, not the ensemble.
 */
export function assessDiseaseRisks(weather, otherSignals = [], normal = null) {
  if (!weather) return [];
  const flood = otherSignals.find((s) => s.hazard === "flood");
  return [
    cropDiseaseSignal(weather.days || []),
    livestockDiseaseSignal(weather.pastSummary, normal),
    humanDiseaseSignal(weather.pastSummary, flood, normal),
  ].filter(Boolean);
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
