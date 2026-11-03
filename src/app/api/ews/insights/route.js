import { NextResponse } from "next/server";
import OpenAI from "openai";
import { PERSONAS, findDistrict } from "@/lib/ews/regions";
import { getDistrictForecast } from "@/lib/ews/forecast";
import { assessHazards, assessDiseaseRisks, applySeason, seasonState, HAZARD_LABELS } from "@/lib/ews/hazards";
import { getDailyWeather, getClimateNormals } from "@/lib/ews/weather";
import { smsSegments, FOOTER_SAMPLE } from "@/lib/ews/messages";
import { getSatellite } from "@/lib/ews/satellite";
import { placeReport, pointsOf, trackRecord, trackLines } from "@/lib/ews/track";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

const PERSONA_KEYS = PERSONAS.map((p) => p.key);
const HAZARD_KEYS = Object.keys(HAZARD_LABELS);
const SEVERITIES = ["advisory", "watch", "warning"];
const LIKELIHOODS = ["low", "medium", "high"];
const LEADS = { warning: "WARNING", watch: "BE READY", advisory: "NOTICE" };

/** Admin-only Strapi data; doubles as the admin check. */
async function strapiAdmin(path, auth) {
  const res = await fetch(`${STRAPI_URL}/api${path}`, { headers: { Authorization: auth }, cache: "no-store" });
  if (res.status === 401 || res.status === 403) {
    const err = new Error("Admin access required");
    err.status = res.status;
    throw err;
  }
  if (!res.ok) return null;
  return res.json();
}

function compactReports(rows = [], district) {
  return rows.slice(0, 40).map((r) => {
    const where = placeReport(r, district);
    return {
    date: r.occurredOn,
    category: r.category,
    impact: r.impact,
    village: r.village,
    // The forecast point the report is nearest to, and how it was located.
    nearestPoint: where.point,
    kmFromPoint: where.km,
    locatedBy: where.source,
    placesNamed: (r.places || []).map((p) => p.name),
    // new = not yet checked; verified = reviewed by the team; responded = reviewed and acted on.
    status: r.status === "new" ? "unverified" : r.status === "verified" ? "reviewed" : r.status,
    peopleAffected: r.peopleAffected,
    text: String(r.description || "").slice(0, 300),
    aiPhotoNote: r.aiSummary ? String(r.aiSummary).slice(0, 300) : undefined,
    photos: (r.media || []).filter((m) => m.mime?.startsWith("image/")).length,
    videos: (r.media || []).filter((m) => m.mime?.startsWith("video/")).length,
    };
  });
}

function tally(rows, key) {
  return rows.reduce((acc, r) => {
    acc[r[key]] = (acc[r[key]] || 0) + 1;
    return acc;
  }, {});
}

function clean(output, places) {
  const pick = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);
  const suggestedAlerts = (output.suggestedAlerts || [])
    .filter((a) => HAZARD_KEYS.includes(a.hazard) && a.message)
    .slice(0, 4)
    .map((a) => {
      const severity = pick(a.severity, SEVERITIES, "advisory");
      const body = String(a.message).replace(/^(WARNING|BE READY|NOTICE)\s*:\s*/i, "").trim();
      const message = `${LEADS[severity]}: ${body}`;
      return {
        hazard: a.hazard,
        severity,
        personas: (a.personas || []).filter((p) => PERSONA_KEYS.includes(p)),
        message,
        why: String(a.why || ""),
        sms: smsSegments(message + FOOTER_SAMPLE),
      };
    });
  return {
    headline: String(output.headline || ""),
    summary: String(output.summary || ""),
    patterns: (output.patterns || []).map(String).slice(0, 6),
    groundTruth: String(output.groundTruth || ""),
    predictions: (output.predictions || []).slice(0, 6).map((p) => ({
      outcome: String(p.outcome || ""),
      place: places.includes(p.place) ? p.place : null,
      // Days from today, for the timeline; clamped so a bad value can't break the chart.
      fromDay: Math.max(0, Math.min(90, Math.round(Number(p.fromDay) || 0))),
      toDay: Math.max(1, Math.min(90, Math.round(Number(p.toDay) || 7))),
      hazard: HAZARD_KEYS.includes(p.hazard) ? p.hazard : null,
      likelihood: pick(p.likelihood, LIKELIHOODS, "low"),
      timeframe: String(p.timeframe || ""),
      affected: String(p.affected || ""),
      evidence: String(p.evidence || ""),
    })),
    suggestedAlerts,
    policyBrief: String(output.policyBrief || ""),
    agentChecks: (output.agentChecks || []).map(String).slice(0, 5),
    dataGaps: (output.dataGaps || []).map(String).slice(0, 5),
    confidence: pick(output.confidence, LIKELIHOODS, "low"),
  };
}

/**
 * POST /api/ews/insights { district }
 * AI reading of a district's weather: recent pattern against the long-term
 * normal, the ensemble outlook, rule-based signals and what agents and
 * community members reported. Suggests warnings; a person decides.
 */
export async function POST(request) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { district: name } = await request.json().catch(() => ({}));
  const district = findDistrict(name);
  if (!district) return NextResponse.json({ error: "Unknown district" }, { status: 400 });

  let reports;
  let feedback;
  let logs;
  try {
    [reports, feedback, logs] = await Promise.all([
      strapiAdmin(`/ews/reports?district=${encodeURIComponent(district.name)}&days=120&limit=300`, auth),
      strapiAdmin(`/ews/feedback?district=${encodeURIComponent(district.name)}&limit=500`, auth),
      strapiAdmin(`/ews/signal-logs?district=${encodeURIComponent(district.name)}&days=120`, auth),
    ]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 403 });
  }

  const [forecast, [weather], [normal], satellite] = await Promise.all([
    getDistrictForecast(district).catch(() => null),
    getDailyWeather([district]),
    getClimateNormals([district]),
    getSatellite(district),
  ]);
  if (!forecast && !weather) {
    return NextResponse.json({ error: "No forecast data available right now" }, { status: 502 });
  }

  const signals = forecast ? assessHazards(district, forecast) : [];
  const allSignals = applySeason(district, [...signals, ...assessDiseaseRisks(weather, signals, normal)], satellite, weather, normal);
  const season = seasonState(satellite, weather, normal);
  const recentFeedback = (feedback?.data || []).filter((f) => Date.now() - new Date(f.createdAt) < 60 * 86400000);
  const recentReports = (reports?.data || []).filter((r) => Date.now() - new Date(r.createdAt) < 60 * 86400000);
  const record = trackRecord({ district, logs: logs?.data || [], reports: reports?.data || [], feedback: feedback?.data || [], loggingSince: logs?.loggingSince });
  const places = pointsOf(district).map((p) => p.name);

  const evidence = {
    district: {
      name: district.name,
      region: district.region,
      knownHazards: district.hazards,
      languages: district.languages,
    },
    today: new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Kampala" }),
    observedLast30Days: weather
      ? {
          summary: weather.pastSummary,
          daily: weather.past.map((d) => ({ date: d.date, rain: d.rain, tMax: d.tMax, tMin: d.tMin, humidity: d.humidity })),
        }
      : null,
    longTermNormal: normal,
    next7DaysDeterministic: weather?.days?.map((d) => ({
      date: d.date,
      condition: d.label,
      tMax: d.tMax,
      tMin: d.tMin,
      rain: d.rain,
      rainChance: d.rainChance,
      wind: d.wind,
      humidity: d.humidity,
    })),
    ensembleRainfall: forecast
      ? {
          source: forecast.rainfall.label,
          days: forecast.rainfall.days.map((d) => ({ date: d.date, median: d.median, p90: d.p90, exceedance: d.exceedance })),
          threeDayTotals: forecast.rainfall.accumulations,
          dryWeek: forecast.rainfall.dryWeek,
          riverFlow: forecast.river
            ? {
                note: "m³/s at the main river near the district point (GloFAS). median = middle forecast, p75 = wet case reached by 1 in 4 forecasts; flood2/flood5 = the river's 2- and 5-year flood levels; usual = median flow for this month.",
                days: forecast.river,
              }
            : null,
        }
      : null,
    satelliteRainfallMonthly: satellite?.chirps
      ? {
          source: satellite.chirps.source,
          note: `Monthly totals; pct is against the ${satellite.chirps.baseline} average for the month; rank 1 = driest year on record for that month. prelim = built from preliminary 5-day totals, final data later. monthSoFar compares the rain so far with the usual for the same days.`,
          months: satellite.chirps.months.map(({ month, total, normal, pct, rank, years, prelim }) => ({ month, total, normal, pct, rank, years, prelim })),
          last3Months: satellite.chirps.season,
          monthSoFar: satellite.chirps.current,
        }
      : null,
    vegetationNdviMonthly: satellite?.ndvi
      ? {
          source: satellite.ndvi.source,
          note: "Mean NDVI over a ~22 km box; usual = same month in earlier years since " + satellite.ndvi.since + ". partial = not final yet (month unfinished or ended under a week ago).",
          months: satellite.ndvi.months,
        }
      : null,
    seasonSoFar: season
      ? {
          note: "pct = CHIRPS rain for the last 3 published months as % of the 2006-2025 usual; recentPct = last 30 days (model analysis) as % of usual; ndvi.change = greenness vs the same month in earlier years.",
          ...season,
        }
      : null,
    ruleBasedSignals: allSignals.map((s) => ({ hazard: s.hazard, severity: s.severity, basis: s.basis || "forecast", reason: s.reason })),
    forecastPoints: pointsOf(district).map((p) => ({ name: p.name, kind: p.area ? "extra point" : "district headquarters" })),
    agentFieldReports: compactReports(recentReports, district),
    localTrackRecord: record.since
      ? {
          note: `Since ${record.since} (${record.loggedDays} days logged): how automatic signals at each place compared with reports and community replies. Unconfirmed is not proof nothing happened.`,
          places: trackLines(record),
        }
      : { note: "Signal logging has only just started; no track record yet." },
    communityFeedbackLast60Days: {
      count: recentFeedback.length,
      byObservation: tally(recentFeedback, "observation"),
      // Replies with the app's GPS or the member's village on the map, by nearest forecast point.
      byPlace: Object.entries(
        recentFeedback.reduce((acc, f) => {
          const where = placeReport(f, district);
          if (where.lat != null) (acc[where.point] ||= []).push(f);
          return acc;
        }, {})
      ).map(([place, rows]) => ({ place, byObservation: tally(rows, "observation") })),
    },
  };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a climate risk analyst supporting a community early warning team in rural Uganda. " +
            "You get data for one district: observed weather for the last 30 days, the normal for the same dates in recent years, " +
            "a deterministic 7-day forecast, a 51-member ensemble rainfall forecast with exceedance probabilities, river flow against the river's usual flow and flood levels, " +
            "CHIRPS satellite rainfall by month against the long-term average (use it for season-scale dryness or wetness, e.g. drought or saturated slopes), " +
            "Sentinel-2 vegetation greenness (NDVI) by month when available, " +
            "rule-based hazard signals, field reports from community agents (text, plus an AI note on their photos) and community feedback.\n" +
            "Reason only from this data. Compare recent conditions with the normal. Use agent reports as local ground truth, " +
            "but treat unverified ones with care. Consider weather-driven disease risk (crop blight and fungal disease after humid, mild spells; " +
            "ticks, worms and foot rot in livestock after long wet spells; malaria 2-4 weeks after rains in warm weather; cholera and diarrhoea after floods). " +
            "Never claim certainty you do not have, never invent numbers, and say what data is missing.\n" +
            "Think place by place: each report has its nearest forecast point (forecastPoints) and how it was located. Where reports cluster at one place, " +
            "say so and set that prediction's place. Use localTrackRecord to judge how far to trust signals at each place: signals often confirmed there deserve more weight; " +
            "events reported with no signal mean the forecast tends to miss them there, so watch for them even below thresholds; say when the record is too short to judge.\n" +
            "Think at two time scales: the next 7 days (forecast) and the season so far (CHIRPS and NDVI). A dry or wet season changes what a forecast means: " +
            "rain after a dry season is less of a flood or landslide threat but matters for planting; heavy rain on ground that is already wet is more dangerous; " +
            "months of low rain with less green pasture point to water and pasture shortages, food insecurity and rising food prices before they are visible in a weekly forecast. " +
            "Lower greenness can also mean harvest or cleared land, so treat NDVI alone as a prompt to check, not proof.\n" +
            "When seasonSoFar shows a dry season (pct under 75) or a wet one (pct 130 or more), address it explicitly in the summary, patterns, predictions and policyBrief, " +
            "quoting the figures (e.g. 'Jul–Sep had 51% of the usual rain'), and say whether the last 30 days (recentPct) show it easing or continuing. " +
            "Every pattern and every prediction's evidence must cite at least one number from the data. " +
            "Only predict disease when a rule-based disease signal or a clear run of humid or unusually wet days supports it; near-normal rain is not evidence of disease. " +
            "Prefer fewer, well-supported predictions to generic ones.\n" +
            "policyBrief is for district disaster, agriculture and health officials: 3-5 plain sentences on the situation, what it could lead to in the coming weeks, " +
            "and preparedness actions within their remit (e.g. pre-position supplies, water trucking, seed for drought-tolerant varieties, drain clearing, health centre stock). " +
            "agentChecks are short, specific things community agents should look at and report this week to confirm or rule out the risks (e.g. water levels at named kinds of sources, pasture, crop wilting, cracks on slopes).\n" +
            "Suggested alerts are SMS drafts for a person to review: plain words for people with little schooling, one practical action, " +
            "under 140 characters, starting with WARNING, BE READY or NOTICE to match severity. Only suggest an alert when the data supports it.\n" +
            "Reply with JSON: {\"headline\": string, \"summary\": string (3-4 sentences), \"patterns\": [string], " +
            "\"groundTruth\": string (what reports and feedback show, or that there are none), " +
            `"predictions": [{"outcome": string, "place": one of ${JSON.stringify(places)} or null for the whole district, "hazard": one of ${JSON.stringify(HAZARD_KEYS)} or null, "likelihood": "low"|"medium"|"high", "timeframe": string, "fromDay": integer days from today when it could start, "toDay": integer days from today when it would end (max 90), "affected": string, "evidence": string}], ` +
            `"suggestedAlerts": [{"hazard": one of ${JSON.stringify(HAZARD_KEYS)}, "severity": "advisory"|"watch"|"warning", "personas": subset of ${JSON.stringify(PERSONA_KEYS)}, "message": string, "why": string}], ` +
            "\"policyBrief\": string, \"agentChecks\": [string], \"dataGaps\": [string], \"confidence\": \"low\"|\"medium\"|\"high\"}",
        },
        { role: "user", content: JSON.stringify(evidence) },
      ],
    });
    const output = JSON.parse(completion.choices?.[0]?.message?.content || "{}");
    const recentUsual = normal?.past30?.meanRain;
    return NextResponse.json({
      district: district.name,
      generatedAt: new Date().toISOString(),
      model: completion.model,
      insights: clean(output, places),
      // The numbers behind the analysis, for the charts beside it.
      visuals: {
        daily: [
          ...(weather?.past || []).map((d) => ({ date: d.date, observed: d.rain })),
          ...(forecast?.rainfall.days || []).slice(0, 7).map((d) => ({ date: d.date, median: d.median, p90: d.p90 })),
        ],
        usualDaily: recentUsual ? Math.round((recentUsual / 30) * 10) / 10 : null,
        recent: weather?.pastSummary ? { total: weather.pastSummary.rainTotal, usual: recentUsual ?? null } : null,
        next7: forecast
          ? {
              median: Math.round(forecast.rainfall.days.slice(0, 7).reduce((n, d) => n + (d.median || 0), 0)),
              p90: Math.round(forecast.rainfall.days.slice(0, 7).reduce((n, d) => n + (d.p90 || 0), 0)),
              usual: normal?.next7?.meanRain ?? null,
            }
          : null,
        season,
        signals: allSignals.map((s) => ({ hazard: s.hazard, label: s.label || HAZARD_LABELS[s.hazard], severity: s.severity, basis: s.basis || "forecast" })),
      },
      inputs: {
        reports: evidence.agentFieldReports.length,
        loggedDays: record.loggedDays,
        feedback: recentFeedback.length,
        normal: Boolean(normal),
        ensemble: Boolean(forecast),
        signals: allSignals.length,
        satellite: Boolean(satellite?.chirps),
        ndvi: Boolean(satellite?.ndvi),
      },
      needsReview: true,
    });
  } catch (err) {
    return NextResponse.json({ error: `AI analysis failed: ${err.message}` }, { status: 502 });
  }
}
