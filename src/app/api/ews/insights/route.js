import { NextResponse } from "next/server";
import OpenAI from "openai";
import { PERSONAS, findDistrict } from "@/lib/ews/regions";
import { getDistrictForecast } from "@/lib/ews/forecast";
import { assessHazards, assessDiseaseRisks, HAZARD_LABELS } from "@/lib/ews/hazards";
import { getDailyWeather, getClimateNormals } from "@/lib/ews/weather";
import { smsSegments, FOOTER_SAMPLE } from "@/lib/ews/messages";

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

function compactReports(rows = []) {
  return rows.slice(0, 40).map((r) => ({
    date: r.occurredOn,
    category: r.category,
    impact: r.impact,
    village: r.village,
    status: r.status,
    peopleAffected: r.peopleAffected,
    text: String(r.description || "").slice(0, 300),
    aiPhotoNote: r.aiSummary ? String(r.aiSummary).slice(0, 300) : undefined,
    photos: (r.media || []).filter((m) => m.mime?.startsWith("image/")).length,
    videos: (r.media || []).filter((m) => m.mime?.startsWith("video/")).length,
  }));
}

function tally(rows, key) {
  return rows.reduce((acc, r) => {
    acc[r[key]] = (acc[r[key]] || 0) + 1;
    return acc;
  }, {});
}

function clean(output) {
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
      hazard: HAZARD_KEYS.includes(p.hazard) ? p.hazard : null,
      likelihood: pick(p.likelihood, LIKELIHOODS, "low"),
      timeframe: String(p.timeframe || ""),
      affected: String(p.affected || ""),
      evidence: String(p.evidence || ""),
    })),
    suggestedAlerts,
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
  try {
    [reports, feedback] = await Promise.all([
      strapiAdmin(`/ews/reports?district=${encodeURIComponent(district.name)}&days=60&limit=100`, auth),
      strapiAdmin(`/ews/feedback?district=${encodeURIComponent(district.name)}&limit=300`, auth),
    ]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 403 });
  }

  const [forecast, [weather], [normal]] = await Promise.all([
    getDistrictForecast(district).catch(() => null),
    getDailyWeather([district]),
    getClimateNormals([district]),
  ]);
  if (!forecast && !weather) {
    return NextResponse.json({ error: "No forecast data available right now" }, { status: 502 });
  }

  const signals = forecast ? assessHazards(district, forecast) : [];
  const allSignals = [...signals, ...assessDiseaseRisks(weather, signals, normal)];
  const recentFeedback = (feedback?.data || []).filter((f) => Date.now() - new Date(f.createdAt) < 60 * 86400000);

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
          riverFlowVsUsual: forecast.river?.map((r) => ({ date: r.date, ratio: r.ratio })),
        }
      : null,
    ruleBasedSignals: allSignals.map((s) => ({ hazard: s.hazard, severity: s.severity, reason: s.reason })),
    agentFieldReports: compactReports(reports?.data),
    communityFeedbackLast60Days: { count: recentFeedback.length, byObservation: tally(recentFeedback, "observation") },
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
            "a deterministic 7-day forecast, a 51-member ensemble rainfall forecast with exceedance probabilities, river flow vs usual, " +
            "rule-based hazard signals, field reports from community agents (text, plus an AI note on their photos) and community feedback.\n" +
            "Reason only from this data. Compare recent conditions with the normal. Use agent reports as local ground truth, " +
            "but treat unverified ones with care. Consider weather-driven disease risk (crop blight and fungal disease after humid, mild spells; " +
            "ticks, worms and foot rot in livestock after long wet spells; malaria 2-4 weeks after rains in warm weather; cholera and diarrhoea after floods). " +
            "Never claim certainty you do not have, never invent numbers, and say what data is missing.\n" +
            "Suggested alerts are SMS drafts for a person to review: plain words for people with little schooling, one practical action, " +
            "under 140 characters, starting with WARNING, BE READY or NOTICE to match severity. Only suggest an alert when the data supports it.\n" +
            "Reply with JSON: {\"headline\": string, \"summary\": string (3-4 sentences), \"patterns\": [string], " +
            "\"groundTruth\": string (what reports and feedback show, or that there are none), " +
            `"predictions": [{"outcome": string, "hazard": one of ${JSON.stringify(HAZARD_KEYS)} or null, "likelihood": "low"|"medium"|"high", "timeframe": string, "affected": string, "evidence": string}], ` +
            `"suggestedAlerts": [{"hazard": one of ${JSON.stringify(HAZARD_KEYS)}, "severity": "advisory"|"watch"|"warning", "personas": subset of ${JSON.stringify(PERSONA_KEYS)}, "message": string, "why": string}], ` +
            "\"dataGaps\": [string], \"confidence\": \"low\"|\"medium\"|\"high\"}",
        },
        { role: "user", content: JSON.stringify(evidence) },
      ],
    });
    const output = JSON.parse(completion.choices?.[0]?.message?.content || "{}");
    return NextResponse.json({
      district: district.name,
      generatedAt: new Date().toISOString(),
      model: completion.model,
      insights: clean(output),
      inputs: {
        reports: evidence.agentFieldReports.length,
        feedback: recentFeedback.length,
        normal: Boolean(normal),
        ensemble: Boolean(forecast),
        signals: allSignals.length,
      },
      needsReview: true,
    });
  } catch (err) {
    return NextResponse.json({ error: `AI analysis failed: ${err.message}` }, { status: 502 });
  }
}
