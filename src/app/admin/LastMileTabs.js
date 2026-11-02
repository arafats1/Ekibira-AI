"use client";

/**
 * Last-mile early warning tabs of the admin dashboard: forecasts and alerts,
 * registering people, agents and field reports, reach and feedback.
 */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { DISTRICTS, PERSONAS, LANGUAGES, REGIONS } from "@/lib/ews/regions";
import { RAIN_CATEGORY } from "@/lib/ews/satellite";
import { HAZARD_LABELS } from "@/lib/ews/hazards";
import { smsSegments, FOOTER_SAMPLE, draftMessages } from "@/lib/ews/messages";
import { parseContactsCsv } from "@/lib/ews/csv";
import { placeReport, trackRecord } from "@/lib/ews/track";
import "leaflet/dist/leaflet.css";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

const SEVERITY_STYLES = {
  warning: "bg-red-100 text-red-800 border-red-200",
  watch: "bg-orange-100 text-orange-800 border-orange-200",
  advisory: "bg-amber-100 text-amber-800 border-amber-200",
  none: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const PERSONA_LABEL = Object.fromEntries(PERSONAS.map((p) => [p.key, p.label]));
const LANGUAGE_LABEL = Object.fromEntries(LANGUAGES.map((l) => [l.key, l.label]));
const OBSERVATION_LABEL = {
  heavy_rain: "Heavy rain",
  light_rain: "Light rain",
  flood: "Flooding",
  landslide: "Landslide",
  no_rain: "No rain",
  hail: "Hailstorm",
  crop_disease: "Crop disease",
  livestock_disease: "Animal disease",
  other: "Other",
};
const REPORT_LABEL = {
  ...HAZARD_LABELS,
  crop_disease: "Crop disease",
  livestock_disease: "Livestock disease",
  human_disease: "Human sickness",
  other: "Other",
};

function mediaUrl(url) {
  return /^https?:\/\//.test(url) ? url : `${STRAPI_URL}${url}`;
}

function SeverityBadge({ severity }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${SEVERITY_STYLES[severity] || SEVERITY_STYLES.none}`}
    >
      {severity ? severity.toUpperCase() : "NO SIGNAL"}
    </span>
  );
}

function Card({ title, subtitle, children, right }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {(title || right) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {title && <h2 className="text-lg font-bold text-[#1b4332] font-[family-name:var(--font-display)]">{title}</h2>}
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

function SmsMeter({ text }) {
  const info = smsSegments(`${text}${FOOTER_SAMPLE}`);
  const tone = info.segments > 2 ? "text-red-600" : info.segments === 2 ? "text-amber-700" : "text-gray-500";
  return (
    <span className={`text-[11px] ${tone}`}>
      {info.length} chars with reply footer · {info.segments} SMS · {info.encoding}
    </span>
  );
}

/* ── Outlook & alerts ── */

function DistrictOverview({ overview, loading, selected, onSelect }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        Loading ensemble forecasts for {DISTRICTS.length} districts…
      </div>
    );
  }
  const byRegion = Object.keys(REGIONS).map((region) => ({
    region,
    rows: (overview || []).filter((d) => d.region === region),
  }));
  return (
    <div className="space-y-4">
      {byRegion.map(({ region, rows }) => (
        <div key={region}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{REGIONS[region]}</h3>
          <div className="space-y-1">
            {rows.map((d) => {
              const top = d.hazards?.[0];
              return (
                <button
                  key={d.district}
                  onClick={() => onSelect(d.district)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                    selected === d.district ? "bg-emerald-50 ring-1 ring-emerald-300" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="font-medium text-gray-800">{d.district}</span>
                  <span className="flex items-center gap-2">
                    {top && (
                      <span title={top.reason} className="flex items-center gap-1">
                        <span className="text-[11px] text-gray-500 hidden 2xl:inline">{top.label || HAZARD_LABELS[top.hazard]}</span>
                        <SeverityBadge severity={top.severity} />
                      </span>
                    )}
                    {d.current ? (
                      <span className="text-sm font-semibold text-gray-700 whitespace-nowrap" title={d.current.label}>
                        {d.current.icon} {d.current.temp}°C
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function WeatherStrip({ weather, normal }) {
  if (!weather?.days?.length) return null;
  const past = weather.pastSummary;
  return (
    <div className="mb-5">
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {weather.days.map((d, i) => (
          <div key={d.date} className={`rounded-xl border p-2 text-center ${i === 0 ? "border-emerald-300 bg-emerald-50/60" : "border-gray-100 bg-gray-50/60"}`}>
            <p className="text-[11px] font-semibold text-gray-500">
              {i === 0 ? "Today" : new Date(`${d.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}
            </p>
            <p className="text-2xl leading-8" title={d.label}>{d.icon}</p>
            <p className="text-sm font-bold text-gray-800">
              {Math.round(d.tMax)}° <span className="font-normal text-gray-400">{Math.round(d.tMin)}°</span>
            </p>
            <p className="text-[11px] text-gray-600 truncate">{d.label}</p>
            <p className="text-[11px] text-sky-700">
              {d.rain}mm{d.rainChance != null ? ` · ${d.rainChance}%` : ""}
            </p>
            <p className="text-[10px] text-gray-400">💨 {d.wind} km/h</p>
          </div>
        ))}
      </div>
      {past && (
        <p className="text-xs text-gray-500 mt-2">
          Last {past.days} days: {past.rainTotal}mm of rain over {past.rainyDays} rainy days ({past.heavyRainDays} heavy), average {past.meanTemp}°C,
          humidity {past.meanHumidity}%.
          {normal?.past30 && (
            <>
              {" "}Usual for these dates: {normal.past30.meanRain}mm ({normal.past30.driestRain}–{normal.past30.wettestRain}mm over the last{" "}
              {normal.years} years), {normal.past30.meanTemp}°C.
            </>
          )}
        </p>
      )}
    </div>
  );
}

const LIKELIHOOD_STYLES = {
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-gray-100 text-gray-700",
};

/* ── Visuals for AI insights ── */

const RAIN_OBSERVED = "#2f855a";
const RAIN_FORECAST = "#0284c7";
const LIKELIHOOD_BAR = { high: "#c2410c", medium: "#f59e0b", low: "#cbd5e1" };

// Share of usual: amber below, green near, blue above (the CHIRPS dry/normal/wet
// bands). Always shown with its number.
function pctTone(pct) {
  if (pct == null) return "#cbd5e1";
  if (pct < 80) return "#d97706";
  if (pct <= 120) return "#2f855a";
  return "#0284c7";
}

/** A number with a bar against the usual (100% marker), on a 0–200% track. */
function VsUsual({ pct }) {
  if (pct == null) return null;
  return (
    <div className="relative h-1.5 rounded-full bg-gray-100 mt-2" title={`${pct}% of usual`}>
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, pct / 2)}%`, background: pctTone(pct) }} />
      <div className="absolute -top-1 -bottom-1 w-0.5 bg-gray-500" style={{ left: "50%" }} />
    </div>
  );
}

function StatTile({ label, value, sub, pct, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
      <VsUsual pct={pct} />
      {children}
    </div>
  );
}

function KeyNumbers({ v }) {
  const recentPct = v.recent?.usual ? Math.round((v.recent.total / v.recent.usual) * 100) : null;
  const nextPct = v.next7?.usual ? Math.round((v.next7.median / v.next7.usual) * 100) : null;
  const ndvi = v.season?.ndvi;
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {v.recent && (
        <StatTile
          label="Last 30 days"
          value={`${Math.round(v.recent.total)}mm`}
          sub={recentPct != null ? `${recentPct}% of the usual ${Math.round(v.recent.usual)}mm` : "no normal available"}
          pct={recentPct}
        />
      )}
      {v.next7 && (
        <StatTile
          label="Next 7 days"
          value={`${v.next7.median}mm`}
          sub={`wet case ${v.next7.p90}mm${nextPct != null ? ` · ${nextPct}% of usual` : ""}`}
          pct={nextPct}
        />
      )}
      {v.season && (
        <StatTile label={`Season, ${v.season.span}`} value={`${v.season.pct}%`} sub={`of usual rain · ${Math.round(v.season.total)}mm (CHIRPS)`} pct={v.season.pct} />
      )}
      {ndvi && (
        <StatTile
          label="Greenness"
          value={ndvi.value.toFixed(2)}
          sub={`usual ${ndvi.usual.toFixed(2)} · ${ndvi.change <= -0.05 ? "less green" : ndvi.change >= 0.05 ? "greener" : "about usual"}${ndvi.partial ? " (early)" : ""}`}
        >
          <div className="relative h-1.5 rounded-full bg-gray-100 mt-2" title="NDVI vs usual, 0 to 1">
            <div className="absolute inset-y-0 left-0 rounded-full bg-[#2f855a]" style={{ width: `${Math.max(0, Math.min(1, ndvi.value)) * 100}%` }} />
            <div className="absolute -top-1 -bottom-1 w-0.5 bg-gray-500" style={{ left: `${Math.max(0, Math.min(1, ndvi.usual)) * 100}%` }} />
          </div>
        </StatTile>
      )}
    </div>
  );
}

function RainTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-gray-800">{d.label}</p>
      {d.observed != null && <p className="text-gray-700">Rain: {d.observed}mm</p>}
      {d.median != null && <p className="text-gray-700">Forecast: {d.median}mm (wet case {d.p90}mm)</p>}
      {d.usual != null && <p className="text-gray-500">Usual: about {d.usual}mm a day</p>}
    </div>
  );
}

/** Daily rain for the last 30 days and the 7-day forecast, against the usual daily amount. */
function RainPastAndAhead({ v }) {
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Kampala" });
  const data = v.daily.map((d) => ({
    ...d,
    usual: v.usualDaily,
    label: new Date(`${d.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
    tick: new Date(`${d.date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  }));
  if (!data.length) return null;
  const today = data.find((d) => d.date === todayKey)?.tick;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mb-2">
        <span className="font-semibold text-gray-700">Rain each day: last 30 days and next 7</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: RAIN_OBSERVED }} />Rain so far</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: RAIN_FORECAST }} />Forecast (median)</span>
        {v.usualDaily != null && <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-gray-400" />Usual per day</span>}
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap={2}>
            <CartesianGrid vertical={false} stroke="#f1f3ee" />
            <XAxis dataKey="tick" tick={{ fontSize: 10, fill: "#6b7280" }} interval={6} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} unit="mm" tickLine={false} axisLine={false} />
            <Tooltip content={<RainTooltip />} cursor={{ fill: "#f3f4f6" }} />
            {today && <ReferenceLine x={today} stroke="#9ca3af" label={{ value: "Today", position: "insideTopLeft", fontSize: 10, fill: "#6b7280" }} />}
            {v.usualDaily != null && <ReferenceLine y={v.usualDaily} stroke="#9ca3af" strokeDasharray="4 3" />}
            <Bar dataKey="observed" fill={RAIN_OBSERVED} radius={[4, 4, 0, 0]} />
            <Bar dataKey="median" fill={RAIN_FORECAST} radius={[4, 4, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** When each likely outcome could happen, from today out to the furthest one. */
function OutcomeTimeline({ predictions }) {
  const rows = predictions.filter((p) => p.toDay > p.fromDay);
  if (!rows.length) return null;
  const span = Math.max(14, ...rows.map((p) => p.toDay));
  const ticks = [0, 7, 14, 28, 56, 84].filter((t) => t <= span);
  const pos = (day) => `${(day / span) * 100}%`;
  const tickLabel = (t) => (t === 0 ? "Today" : `${t / 7} wk`);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mb-2">
        <span className="font-semibold text-gray-700">When</span>
        {["high", "medium", "low"].map((l) => (
          <span key={l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: LIKELIHOOD_BAR[l] }} />{l} likelihood</span>
        ))}
      </div>
      <div className="space-y-2">
        {rows.map((p, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,180px)_1fr] items-center gap-3">
            <p className="text-xs text-gray-700 truncate" title={p.outcome}>{p.outcome}</p>
            <div className="relative h-5 rounded bg-gray-50">
              {ticks.map((t) => <div key={t} className="absolute inset-y-0 w-px bg-gray-200" style={{ left: pos(t) }} />)}
              <div
                className="absolute inset-y-1 rounded"
                title={`${p.outcome}: ${p.timeframe} (${p.likelihood} likelihood)`}
                style={{ left: pos(p.fromDay), width: `max(6px, ${((p.toDay - p.fromDay) / span) * 100}%)`, background: LIKELIHOOD_BAR[p.likelihood] }}
              />
            </div>
          </div>
        ))}
        <div className="grid grid-cols-[minmax(0,180px)_1fr] gap-3">
          <span />
          <div className="relative h-4 text-[10px] text-gray-500">
            {ticks.map((t) => (
              <span
                key={t}
                className="absolute whitespace-nowrap"
                style={{ left: pos(t), transform: t === 0 ? "none" : t === span ? "translateX(-100%)" : "translateX(-50%)" }}
              >
                {tickLabel(t)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightsCard({ district, token, onUseDraft }) {
  const [state, setState] = useState({ loading: false, data: null, error: null });

  useEffect(() => {
    setState({ loading: false, data: null, error: null });
  }, [district]);

  async function analyse() {
    setState({ loading: true, data: null, error: null });
    try {
      const res = await fetch("/api/ews/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ district }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setState({ loading: false, data, error: null });
    } catch (err) {
      setState({ loading: false, data: null, error: err.message });
    }
  }

  const ins = state.data?.insights;
  return (
    <Card
      title="AI weather insights"
      subtitle="Reads the last 30 days against the normal for these dates, the ensemble outlook, river flow, CHIRPS satellite rainfall, Sentinel-2 greenness, agent field reports and community feedback. Suggestions only."
      right={
        <button
          onClick={analyse}
          disabled={state.loading || !token}
          className="shrink-0 bg-[#1b4332] hover:bg-[#2d6a4f] disabled:bg-gray-300 text-white text-sm font-semibold px-4 py-2 rounded-full"
        >
          {state.loading ? "Analysing…" : ins ? "Re-analyse" : `Analyse ${district}`}
        </button>
      }
    >
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {!ins && !state.loading && !state.error && (
        <p className="text-sm text-gray-500">Run an analysis to see patterns, likely outcomes and suggested warnings for {district}.</p>
      )}
      {state.loading && <p className="text-sm text-gray-500">Gathering past years, forecasts and field reports…</p>}
      {ins && (
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-bold text-gray-900">{ins.headline}</p>
            <p className="text-gray-700 mt-1 leading-relaxed">{ins.summary}</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Confidence: {ins.confidence} · {state.data.inputs.reports} field reports · {state.data.inputs.feedback} feedback replies ·
              {state.data.inputs.normal ? " seasonal normal" : " no normal available"}
              {state.data.inputs.satellite ? (state.data.inputs.ndvi ? " · CHIRPS + Sentinel-2" : " · CHIRPS") : " · no satellite data"} · {new Date(state.data.generatedAt).toLocaleString("en-GB")}
            </p>
          </div>
          {state.data.visuals && (
            <div className="space-y-4 rounded-2xl bg-gray-50/70 p-3">
              <KeyNumbers v={state.data.visuals} />
              <div className="rounded-xl border border-gray-100 bg-white p-3">
                <RainPastAndAhead v={state.data.visuals} />
              </div>
              {state.data.visuals.signals.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-gray-600">Rule-based signals:</span>
                  {state.data.visuals.signals.map((s, i) => (
                    <span key={i} className="flex items-center gap-1 rounded-full border border-gray-200 bg-white pl-1 pr-2 py-0.5">
                      <SeverityBadge severity={s.severity} />
                      <span className="text-gray-700">{s.label}</span>
                      {s.basis === "satellite" && <span title="Uses satellite data">🛰️</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {ins.patterns.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Patterns</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {ins.patterns.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">From the ground</h4>
            <p className="text-gray-700">{ins.groundTruth}</p>
          </div>
          {ins.predictions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Likely outcomes</h4>
              <div className="rounded-xl border border-gray-100 p-3 mb-3">
                <OutcomeTimeline predictions={ins.predictions} />
              </div>
              <div className="space-y-2">
                {ins.predictions.map((p, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${LIKELIHOOD_STYLES[p.likelihood]}`}>{p.likelihood} likelihood</span>
                      <span className="font-semibold text-gray-800">{p.outcome}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {p.place ? `📍 ${p.place} · ` : ""}{p.timeframe}{p.affected ? ` · ${p.affected}` : ""}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{p.evidence}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {ins.suggestedAlerts.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Suggested warnings</h4>
              <div className="space-y-2">
                {ins.suggestedAlerts.map((a, i) => (
                  <div key={i} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <SeverityBadge severity={a.severity} />
                      <span className="font-semibold text-gray-800">{HAZARD_LABELS[a.hazard]}</span>
                      <span className="text-xs text-gray-500">→ {a.personas.map((p) => PERSONA_LABEL[p]).join(", ") || "everyone"}</span>
                    </div>
                    <p className="text-gray-800">{a.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{a.why}</p>
                    <button onClick={() => onUseDraft(a)} className="text-xs font-semibold text-emerald-700 hover:underline mt-2">
                      Edit and send as a custom alert ↓
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {ins.policyBrief && (
            <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-sky-800">Brief for district officials</h4>
                <button
                  onClick={() => navigator.clipboard?.writeText(`${district} early warning brief (${new Date(state.data.generatedAt).toLocaleDateString("en-GB")})\n\n${ins.policyBrief}`)}
                  className="text-xs font-semibold text-sky-800 hover:underline"
                >
                  Copy
                </button>
              </div>
              <p className="text-gray-800 leading-relaxed">{ins.policyBrief}</p>
            </div>
          )}
          {ins.agentChecks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Ask agents to check this week</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {ins.agentChecks.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
          {ins.dataGaps.length > 0 && (
            <p className="text-xs text-gray-500">
              <span className="font-semibold">Data gaps:</span> {ins.dataGaps.join(" · ")}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function ForecastChart({ rainfall }) {
  const data = (rainfall?.days || []).map((d) => ({
    day: new Date(`${d.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }),
    median: d.median,
    p90: d.p90,
    p30: d.exceedance?.[30] != null ? Math.round(d.exceedance[30] * 100) : null,
  }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2e6" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="mm" tick={{ fontSize: 11 }} unit="mm" />
          <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="pct" dataKey="p30" name="Chance of ≥30mm (%)" fill="#95d5b2" radius={[4, 4, 0, 0]} />
          <Line yAxisId="mm" dataKey="median" name="Median rain (mm)" stroke="#2d6a4f" strokeWidth={2} dot={false} />
          <Line yAxisId="mm" dataKey="p90" name="Wet case, 90th pct (mm)" stroke="#c1440e" strokeDasharray="4 3" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

const monthName = (key, opts = { month: "short", year: "2-digit" }) => new Date(`${key}-15T12:00:00`).toLocaleDateString("en-GB", opts);
const ordinal = (n) => `${n}${["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10 < 4 ? n % 10 : 0]}`;

function chirpsSentence(m, season) {
  const parts = [`${m.total}mm${m.pct != null ? `, ${m.pct}% of usual (${RAIN_CATEGORY[m.category]})` : ""}.`];
  if (m.years > 3 && m.rank <= 3) parts.push(`The ${m.rank === 1 ? "driest" : `${ordinal(m.rank)} driest`} of ${m.years} years on record.`);
  else if (m.years > 3 && m.rank > m.years - 3) {
    const n = m.years - m.rank + 1;
    parts.push(`The ${n === 1 ? "wettest" : `${ordinal(n)} wettest`} of ${m.years} years on record.`);
  }
  if (m.prelim) parts.push("Preliminary.");
  if (season?.pct != null) {
    parts.push(`Last 3 months (${monthName(season.from, { month: "short" })}–${monthName(season.to, { month: "short" })}): ${season.total}mm, ${season.pct}% of usual.`);
  }
  return parts.join(" ");
}

/** CHIRPS monthly rainfall against the long-term average, and Sentinel-2 NDVI when configured. */
const fmtDay = (date) => new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** Plain words for where a district's flood signal comes from. */
function floodReason(forecast, hazards, district) {
  const flood = hazards.find((h) => h.hazard === "flood" && !h.area);
  const river = forecast.river || [];
  const peak = river.reduce((best, d) => (d.median != null && (!best || d.median > best.median) ? d : best), null);
  const parts = [];
  if (peak) {
    const vsLevel =
      peak.median >= peak.flood5 ? `above its 5-year flood level (${peak.flood5} m³/s)`
      : peak.median >= peak.flood2 ? `above its 2-year flood level (${peak.flood2} m³/s)`
      : `below its 2-year flood level of ${peak.flood2} m³/s`;
    const vsUsual = peak.usual ? `, ${Math.round((peak.median / peak.usual) * 10) / 10}× the usual ${peak.usual} m³/s for the month` : "";
    parts.push(`The river near ${district} is forecast to peak at ${peak.median} m³/s on ${fmtDay(peak.date)}, ${vsLevel}${vsUsual}.`);
  }
  if (!flood) parts.push("There is no flood signal.");
  else if (flood.basis === "river") parts.push("The flood signal comes from this river forecast.");
  else parts.push(`The flood signal comes from heavy rain forecast in a flood-prone district${peak ? ", not from the river" : ""}.`);
  return parts.join(" ");
}

/** River forecast at the district's river point against its usual flow and flood levels. */
function RiverChart({ forecast, hazards, district, floodProne }) {
  const river = forecast?.river;
  if (!river?.length) {
    return floodProne ? <p className="text-xs text-gray-500 mt-5">No river forecast available for {district} right now.</p> : null;
  }
  const { flood2, flood5 } = river[0];
  const data = river.map((d) => ({ ...d, day: fmtDay(d.date) }));
  const top = Math.max(flood5, ...river.map((d) => d.p75 || 0)) * 1.15;
  const km = forecast.riverPoint
    ? Math.round(Math.hypot((forecast.riverPoint.lat - forecast.lat) * 111, (forecast.riverPoint.lng - forecast.lng) * 111 * Math.cos((forecast.lat * Math.PI) / 180)))
    : null;
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold text-gray-700">River flow (GloFAS)</h3>
      <p className="text-sm text-gray-700 mt-1 mb-2">{floodReason(forecast, hazards, district)}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mb-2">
        <span className="flex items-center gap-1.5"><span className="w-4 border-t-2" style={{ borderColor: RAIN_FORECAST }} />Forecast (middle)</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed" style={{ borderColor: RAIN_FORECAST }} />Wet case (1 in 4)</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-gray-400" />Usual for the month</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-t-2" style={{ borderColor: SEVERITY_COLOR.advisory }} />2-year flood level</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-t-2" style={{ borderColor: SEVERITY_COLOR.warning }} />5-year flood level</span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f3ee" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} domain={[0, Math.ceil(top)]} tickLine={false} axisLine={false} unit=" m³/s" width={70} />
            <Tooltip formatter={(v, name) => [`${v} m³/s`, name]} />
            <ReferenceLine y={flood2} stroke={SEVERITY_COLOR.advisory} strokeWidth={1.5} />
            <ReferenceLine y={flood5} stroke={SEVERITY_COLOR.warning} strokeWidth={1.5} />
            <Line dataKey="usual" name="Usual for the month" stroke="#9ca3af" strokeDasharray="4 3" dot={false} />
            <Line dataKey="p75" name="Wet case (1 in 4)" stroke={RAIN_FORECAST} strokeDasharray="5 3" strokeWidth={2} dot={false} />
            <Line dataKey="median" name="Forecast (middle)" stroke={RAIN_FORECAST} strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        River point{km != null ? ` about ${km}km from the district headquarters` : ""}: the GloFAS cell carrying the most water nearby. Flood levels are estimated from
        10 years of GloFAS flow (2013–2022); a 2-year flood is about bank-full. GloFAS cells are about 5km, so small streams and flash floods can be missed.
      </p>
    </div>
  );
}

function SatelliteCard({ satellite, district }) {
  const chirps = satellite?.chirps;
  const ndvi = satellite?.ndvi;
  const latest = chirps?.latest;
  const data = (chirps?.months || []).map((m) => ({ month: `${monthName(m.month)}${m.prelim ? " *" : ""}`, total: m.total, normal: m.normal }));
  return (
    <Card
      title="Satellite record"
      subtitle={chirps ? `${chirps.source}. Usual = ${chirps.baseline} average for the month.` : "CHIRPS satellite rainfall by month"}
    >
      {!satellite && <p className="text-sm text-gray-500">The satellite data service could not be reached.</p>}
      {satellite && !chirps && (
        <p className="text-sm text-gray-500">No CHIRPS months for {district} yet. The backend sync fills them in (the first run takes about an hour).</p>
      )}
      {chirps && (
        <>
          <p className="text-sm text-gray-700 mb-3">
            <b>{monthName(latest.month, { month: "long", year: "numeric" })}:</b> {chirpsSentence(latest, chirps.season)}
          </p>
          {chirps.current && (
            <p className="text-sm text-gray-700 mb-3">
              <b>{monthName(chirps.current.month, { month: "long" })} so far</b> (to {chirps.current.throughLabel}, preliminary): {chirps.current.total}mm
              {chirps.current.pct != null ? `, ${chirps.current.pct}% of the usual ${chirps.current.usualSoFar}mm for these days (${RAIN_CATEGORY[chirps.current.category]}).` : "."}
            </p>
          )}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2e6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="mm" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" name="Rain (mm)" fill="#74c69d" radius={[4, 4, 0, 0]} />
                <Line dataKey="normal" name="Usual (mm)" stroke="#1b4332" strokeDasharray="4 3" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Averaged over about 22km around the district headquarters. Final CHIRPS comes out in the third week of the next month; until then
            months are built from preliminary 5-day totals, published 2 days after each 5 days (* = preliminary).
          </p>
        </>
      )}

      <h3 className="text-sm font-semibold text-gray-700 mt-5 mb-2">Vegetation greenness (Sentinel-2 NDVI)</h3>
      {ndvi ? (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ndvi.months.slice(-6).map((m) => (
              <div key={m.month} className="rounded-xl border border-gray-100 bg-gray-50/60 p-2 text-center">
                <p className="text-[11px] font-semibold text-gray-500">
                  {monthName(m.month)}
                  {m.partial ? " *" : ""}
                </p>
                <p className="text-lg font-bold text-gray-800">{m.ndvi.toFixed(2)}</p>
                {m.change != null && (
                  <p className={`text-[11px] ${m.change < -0.05 ? "text-amber-700" : m.change > 0.05 ? "text-emerald-700" : "text-gray-500"}`}>
                    {m.change > 0 ? "+" : ""}
                    {m.change.toFixed(2)} vs usual
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {ndvi.source}, mean over the same area. Usual = the same month in earlier years since {ndvi.since}. * not final yet: more satellite passes may still be added. Lower than usual
            can mean dry stress, harvest or cleared land; check with agents.
          </p>
        </>
      ) : (
        <p className="text-xs text-gray-500">
          {satellite?.ndviConfigured
            ? "No clear Sentinel-2 months yet; the sync fills them in."
            : "Not switched on. Add a free Copernicus Data Space client (CDSE_CLIENT_ID and CDSE_CLIENT_SECRET) to the backend to fetch it."}
        </p>
      )}
    </Card>
  );
}

function DraftEditor({ draft, languages, token, onChange }) {
  const [translating, setTranslating] = useState(null);
  const [error, setError] = useState(null);

  async function translate(lang) {
    setTranslating(lang);
    setError(null);
    try {
      const res = await fetch("/api/ews/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: draft.message, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translation failed");
      onChange({ ...draft, translations: { ...draft.translations, [lang]: { text: data.translation, reviewed: false } } });
    } catch (err) {
      setError(err.message);
    } finally {
      setTranslating(null);
    }
  }

  return (
    <div className={`rounded-xl border p-3 ${draft.include ? "border-emerald-200 bg-emerald-50/40" : "border-gray-100 bg-gray-50/50"}`}>
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
        <input type="checkbox" checked={draft.include} onChange={(e) => onChange({ ...draft, include: e.target.checked })} />
        {PERSONA_LABEL[draft.persona]}
      </label>
      <textarea
        value={draft.message}
        onChange={(e) => onChange({ ...draft, message: e.target.value })}
        rows={3}
        className="w-full text-sm rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
      />
      <SmsMeter text={draft.message} />

      {languages.map((lang) => {
        const t = draft.translations[lang];
        return (
          <div key={lang} className="mt-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-600">{LANGUAGE_LABEL[lang]}</span>
              <button
                type="button"
                onClick={() => translate(lang)}
                disabled={!token || translating === lang}
                className="text-xs text-emerald-700 hover:underline disabled:text-gray-400"
              >
                {translating === lang ? "Drafting…" : t ? "Redraft with AI" : "Draft with AI"}
              </button>
            </div>
            {t && (
              <>
                <textarea
                  value={t.text}
                  onChange={(e) =>
                    onChange({ ...draft, translations: { ...draft.translations, [lang]: { text: e.target.value, reviewed: false } } })
                  }
                  rows={3}
                  className="w-full text-sm rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
                <div className="flex items-center justify-between gap-2">
                  <SmsMeter text={t.text} />
                  <label className="flex items-center gap-1.5 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={t.reviewed}
                      onChange={(e) =>
                        onChange({ ...draft, translations: { ...draft.translations, [lang]: { ...t, reviewed: e.target.checked } } })
                      }
                    />
                    Checked by a native speaker
                  </label>
                </div>
              </>
            )}
          </div>
        );
      })}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}

function DeliveryChoice({ voice, setVoice, meta }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700">
      <span className="font-semibold">Deliver by</span>
      <label className="flex items-center gap-1.5">
        <input type="checkbox" checked={voice.sms} onChange={(e) => setVoice((v) => ({ ...v, sms: e.target.checked }))} />
        SMS
      </label>
      <label className={`flex items-center gap-1.5 ${meta?.voiceConfigured ? "" : "text-gray-400"}`} title={meta?.voiceConfigured ? "" : "Set AT_VOICE_NUMBER on the backend"}>
        <input
          type="checkbox"
          disabled={!meta?.voiceConfigured}
          checked={voice.call}
          onChange={(e) => setVoice((v) => ({ ...v, call: e.target.checked }))}
        />
        Voice call{meta?.voiceConfigured ? "" : " (not set up)"}
      </label>
    </div>
  );
}

function buildDrafts(hazards) {
  const state = {};
  hazards.forEach((h, i) => {
    for (const d of h.drafts) {
      // Area signals start unticked: they go to the whole district, so choose them on purpose.
      state[`${i}:${d.persona}`] = { persona: d.persona, message: d.message, include: d.persona !== "other" && !h.area, translations: {} };
    }
  });
  return state;
}

function alertsFromDrafts(hazards, drafts, district, forecast) {
  const alerts = [];
  hazards.forEach((h, i) => {
    for (const persona of PERSONAS.map((p) => p.key)) {
      const d = drafts[`${i}:${persona}`];
      if (!d?.include || !d.message.trim()) continue;
      const translations = Object.fromEntries(
        Object.entries(d.translations)
          .filter(([, t]) => t.reviewed && t.text.trim())
          .map(([lang, t]) => [lang, t.text.trim()])
      );
      alerts.push({
        hazard: h.hazard,
        severity: h.severity,
        district,
        personas: [persona],
        message: d.message.trim(),
        translations,
        probability: h.probability,
        thresholdMm: h.thresholdMm,
        validFrom: h.date,
        validTo: h.endDate,
        forecastSource: forecast.rainfall.label,
        forecastSnapshot: { reason: h.reason, generatedAt: forecast.generatedAt },
      });
    }
  });
  return alerts;
}

function CustomAlert({ district, onSend, sending, preset }) {
  const [hazard, setHazard] = useState(preset?.hazard || "hailstorm");
  const [severity, setSeverity] = useState(preset?.severity || "watch");
  const [personas, setPersonas] = useState(preset?.personas?.length ? preset.personas : PERSONAS.map((p) => p.key));
  const [message, setMessage] = useState(preset?.message || "");

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        For official met-service bulletins, hazards the model does not cover (hail, wind), local reports or AI suggestions. Sent in English
        by SMS; calls play your recordings where you added them.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <select value={hazard} onChange={(e) => setHazard(e.target.value)} className="text-sm rounded-lg border border-gray-200 p-2">
          {Object.entries(HAZARD_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="text-sm rounded-lg border border-gray-200 p-2">
          <option value="advisory">Advisory</option>
          <option value="watch">Watch</option>
          <option value="warning">Warning</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {PERSONAS.map((p) => (
          <label key={p.key} className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50 rounded-full px-2.5 py-1">
            <input
              type="checkbox"
              checked={personas.includes(p.key)}
              onChange={(e) => setPersonas(e.target.checked ? [...personas, p.key] : personas.filter((x) => x !== p.key))}
            />
            {p.label}
          </label>
        ))}
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder={`e.g. WARNING: Hailstorm reported moving towards ${district} this afternoon. Shelter animals and stay indoors.`}
        className="w-full text-sm rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
      />
      <div className="flex items-center justify-between gap-2">
        <SmsMeter text={message} />
        <button
          disabled={sending || !message.trim() || !personas.length}
          onClick={() => onSend([{ hazard, severity, district, personas, message: message.trim(), forecastSource: "manual" }])}
          className="bg-[#1b4332] hover:bg-[#2d6a4f] disabled:bg-gray-300 text-white text-sm font-semibold px-4 py-2 rounded-full"
        >
          Send custom alert
        </button>
      </div>
    </div>
  );
}

function VoicePanel({ languages, meta, token, voice, setVoice }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  async function upload(lang, file) {
    setBusy(lang);
    setError(null);
    try {
      const body = new FormData();
      body.append("language", lang);
      body.append("file", file);
      const res = await fetch(`${STRAPI_URL}/api/ews/voice/audio`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Upload failed");
      if (!data.reachable) throw new Error("Saved, but the link is not public: set PUBLIC_URL or B2 storage on the backend");
      setVoice((v) => ({ ...v, audio: { ...v.audio, [lang]: data.url } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function generate(lang, provider) {
    const text = window.prompt(`Text to speak in ${LANGUAGE_LABEL[lang]} (write it in that language):`);
    if (!text?.trim()) return;
    setBusy(lang);
    setError(null);
    try {
      const res = await fetch(`${STRAPI_URL}/api/ews/voice/audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ language: lang, text, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Could not generate audio");
      setVoice((v) => ({ ...v, audio: { ...v.audio, [lang]: data.url } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 space-y-2">
      <p className="text-xs text-gray-600">
        Calls ring everyone matched, including people who cannot read. With no recording the gateway reads the English message aloud.
        Add a recording per language for people who prefer it; listen to every generated clip before sending.
      </p>
      {["en", ...languages].map((lang) => {
        const url = voice.audio[lang];
        const sunbird = meta?.voiceProviders?.sunbird && meta?.voiceLanguages?.includes(lang);
        const eleven = meta?.voiceProviders?.elevenlabs && lang === "en";
        return (
          <div key={lang} className="flex flex-wrap items-center gap-2 text-xs">
            <span className="w-36 font-semibold text-gray-700">{LANGUAGE_LABEL[lang]}</span>
            {url ? (
              <>
                <audio controls src={url} className="h-8" />
                <button onClick={() => setVoice((v) => ({ ...v, audio: Object.fromEntries(Object.entries(v.audio).filter(([k]) => k !== lang)) }))} className="text-red-600 hover:underline">
                  Remove
                </button>
              </>
            ) : (
              <>
                <label className="cursor-pointer text-emerald-700 hover:underline">
                  {busy === lang ? "Working…" : "Upload recording"}
                  <input type="file" accept="audio/mpeg,audio/wav,audio/*" className="hidden" disabled={!!busy} onChange={(e) => e.target.files?.[0] && upload(lang, e.target.files[0])} />
                </label>
                {sunbird && (
                  <button disabled={!!busy} onClick={() => generate(lang, "sunbird")} className="text-emerald-700 hover:underline">
                    Generate (Sunbird AI)
                  </button>
                )}
                {eleven && (
                  <button disabled={!!busy} onClick={() => generate(lang, "elevenlabs")} className="text-emerald-700 hover:underline">
                    Generate (ElevenLabs)
                  </button>
                )}
                {lang === "en" && <span className="text-gray-400">or leave empty to read the SMS text aloud</span>}
              </>
            )}
          </div>
        );
      })}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

/* ── Areas inside a district, and the risk map ── */

function AreaTable({ district, areas }) {
  if (!areas?.length) return null;
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold text-gray-700">Inside {district}</h3>
      <p className="text-xs text-gray-500 mb-2">Extra forecast points where the district headquarters may not tell the whole story.</p>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400">
              <th className="px-2 py-1.5 font-semibold">Place</th>
              <th className="px-2 py-1.5 font-semibold">Next 7 days</th>
              <th className="px-2 py-1.5 font-semibold">Signal</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((a) => {
              const top = a.hazards?.[0];
              return (
                <tr key={a.name} className="border-t border-gray-100 align-top">
                  <td className="px-2 py-1.5">
                    <span className="font-medium text-gray-800">{a.name}</span>
                    <span className="block text-[11px] text-gray-400">{a.note}</span>
                  </td>
                  <td className="px-2 py-1.5 text-gray-700">{a.next7 ? `${a.next7.median}mm (wet case ${a.next7.p90}mm)` : "no forecast"}</td>
                  <td className="px-2 py-1.5">
                    {top ? (
                      <span className="flex items-start gap-1.5" title={top.reason}>
                        <SeverityBadge severity={top.severity} />
                        <span className="text-xs text-gray-600">{top.label || HAZARD_LABELS[top.hazard]}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">none</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Status colours, checked for colour-blind separation. Never colour alone: the
// legend and popups name the severity, and dots grow with it (warnings get "!").
const SEVERITY_COLOR = { warning: "#be123c", watch: "#f97316", advisory: "#a16207", none: "#16a34a" };
const SEVERITY_GROW = { warning: 6, watch: 4, advisory: 2, none: 0 };

const escapeHtml = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function markerIcon(L, severity, base, selected) {
  const level = severity || "none";
  const color = SEVERITY_COLOR[level];
  const size = base + SEVERITY_GROW[level];
  const ring = selected ? `box-shadow:0 0 0 3px #fff,0 0 0 5px ${color};` : "box-shadow:0 1px 4px rgba(0,0,0,0.35);";
  const mark = level === "warning" && size >= 16 ? "!" : "";
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid #fff;${ring}color:#fff;font:700 ${Math.round(size * 0.6)}px/1 sans-serif;display:flex;align-items:center;justify-content:center">${mark}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Hover card for a map point: every signal, why the top one fired, and the
 * general advice its SMS draft would give.
 */
function cardHtml(title, sub, hazards, place) {
  const list = hazards || [];
  const top = list[0];
  const badge = (h) =>
    `<span style="display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;color:#fff;background:${SEVERITY_COLOR[h.severity]};border-radius:999px;padding:1px 7px;margin-right:6px">${escapeHtml(h.severity)}</span>`;
  let body = `<div style="margin-top:6px;color:#15803d;font-weight:600">No signal for the next 7 days or the season so far</div>`;
  if (top) {
    const advice = draftMessages(top, place, ["other"])[0]?.message.replace(/^[A-Z ]+:\s*/, "");
    body =
      list
        .slice(0, 4)
        .map((h) => `<div style="margin-top:6px;display:flex;align-items:center">${badge(h)}<b>${escapeHtml(h.label || HAZARD_LABELS[h.hazard])}</b></div>`)
        .join("") +
      `<div style="color:#4b5563;font-size:12px;margin-top:6px;line-height:1.35">${escapeHtml(top.reason)}</div>` +
      (advice ? `<div style="margin-top:6px;padding:6px 8px;border-radius:8px;background:#f0f7f3;font-size:12px;line-height:1.35"><b>What to do:</b> ${escapeHtml(advice)}</div>` : "");
  }
  return `<div style="width:260px;white-space:normal;font-size:13px;color:#111827"><b style="font-size:14px">${escapeHtml(title)}</b><div style="color:#6b7280;font-size:12px">${escapeHtml(sub)}</div>${body}<div style="margin-top:6px;color:#9ca3af;font-size:11px">Click to open the district</div></div>`;
}

const TIP = { direction: "top", offset: [0, -10], opacity: 1 };

// Open the card below points in the top half of the map, so the map edge doesn't cut it off.
function placeCard(map, marker) {
  marker.on("tooltipopen", ({ tooltip }) => {
    const below = map.latLngToContainerPoint(marker.getLatLng()).y < map.getSize().y / 2;
    tooltip.options.direction = below ? "bottom" : "top";
    tooltip.options.offset = below ? [0, 10] : [0, -10];
    tooltip.update();
  });
}

/** Districts and extra forecast points, coloured by their highest signal. */
const REPORT_HAZARD = { heavy_rain: "Heavy rain", flood: "Flooding", landslide: "Landslide", hailstorm: "Hailstorm", strong_wind: "Strong wind", dry_spell: "Dry spell", crop_disease: "Crop disease", livestock_disease: "Livestock disease", human_disease: "People sick", other: "Other" };

function reportCardHtml(r, where) {
  const text = String(r.description || "");
  return `<div style="width:260px;white-space:normal;font-size:13px;color:#111827"><div style="font-size:11px;font-weight:700;color:#1e3a8a;text-transform:uppercase">Field report · ${escapeHtml(r.impact || "")}</div>` +
    `<b style="font-size:14px">${escapeHtml(REPORT_HAZARD[r.category] || r.category)}</b>` +
    `<div style="color:#6b7280;font-size:12px">${escapeHtml([r.village, r.district, r.occurredOn].filter(Boolean).join(" · "))}</div>` +
    `<div style="color:#374151;font-size:12px;margin-top:6px;line-height:1.35">${escapeHtml(text.length > 220 ? `${text.slice(0, 220)}…` : text)}</div>` +
    `<div style="color:#9ca3af;font-size:11px;margin-top:6px">Located by ${escapeHtml(where.source)}${where.km != null ? ` · ${where.km}km from ${escapeHtml(where.point)}` : ""} · ${escapeHtml(r.status === "new" ? "not yet reviewed" : r.status)}</div></div>`;
}

const reportIcon = (L) =>
  L.divIcon({
    className: "",
    html: '<div style="width:12px;height:12px;background:#1e3a8a;border:2px solid #fff;transform:rotate(45deg);box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

function RiskMap({ overview, reports = [], selected, onSelect }) {
  const box = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);

  useEffect(() => {
    if (!overview?.length) return;
    let cancelled = false;
    (async () => {
      // Leaflet touches window on import, so load it in the browser only.
      const L = (await import("leaflet")).default;
      if (cancelled || !box.current) return;
      if (!map.current) {
        map.current = L.map(box.current, { scrollWheelZoom: false });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 13,
        }).addTo(map.current);
        layer.current = L.layerGroup().addTo(map.current);
        map.current.fitBounds(overview.map((d) => [d.lat, d.lng]), { padding: [24, 24] });
      }
      layer.current.clearLayers();
      for (const d of overview) {
        for (const a of d.areas || []) {
          const m = L.marker([a.lat, a.lng], { icon: markerIcon(L, a.hazards?.[0]?.severity, 10, false) });
          m.bindTooltip(cardHtml(`${a.name}, ${d.district}`, a.note, a.hazards, `${a.name}, ${d.district}`), TIP);
          placeCard(map.current, m);
          m.on("click", () => onSelect(d.district));
          layer.current.addLayer(m);
        }
        const own = (d.hazards || []).filter((h) => !h.area);
        const m = L.marker([d.lat, d.lng], { icon: markerIcon(L, own[0]?.severity, 16, d.district === selected), zIndexOffset: 500 });
        m.bindTooltip(cardHtml(d.district, `${REGIONS[d.region]} · district headquarters`, own, d.district), TIP);
        placeCard(map.current, m);
        m.on("click", () => onSelect(d.district));
        layer.current.addLayer(m);
      }
      // Field reports with a location (phone GPS, village or named place).
      for (const r of reports) {
        const district = DISTRICTS.find((x) => x.name === r.district);
        const where = district && placeReport(r, district);
        if (!where?.lat) continue;
        const m = L.marker([where.lat, where.lng], { icon: reportIcon(L), zIndexOffset: 800 });
        m.bindTooltip(reportCardHtml(r, where), TIP);
        placeCard(map.current, m);
        m.on("click", () => onSelect(r.district));
        layer.current.addLayer(m);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [overview, reports, selected, onSelect]);

  useEffect(() => () => map.current?.remove(), []);

  if (!overview?.length) return null;
  const counts = overview.reduce((acc, d) => {
    const s = d.hazards?.[0]?.severity || "none";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  return (
    <Card
      title="Risk map"
      subtitle="District headquarters (large dots) and extra forecast points (small dots), coloured by the highest signal for the next 7 days or the season so far. Point at one for details; click to open it."
    >
      <div ref={box} className="h-[380px] rounded-xl overflow-hidden border border-gray-100 relative z-0" />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-600">
        {["warning", "watch", "advisory", "none"].map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-white shadow" style={{ background: SEVERITY_COLOR[s] }} />
            {s === "none" ? "No signal" : s[0].toUpperCase() + s.slice(1)} ({counts[s] || 0} {counts[s] === 1 ? "district" : "districts"})
          </span>
        ))}
        {reports.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 border-2 border-white shadow" style={{ background: "#1e3a8a" }} />
            Field reports, last 14 days
          </span>
        )}
      </div>
    </Card>
  );
}

const HAZARD_NAME = (h) => REPORT_HAZARD[h] || HAZARD_LABELS[h] || h;

/** Reports and SMS replies by place, and how signals there compared with them. */
function GroundTruthCard({ district, token }) {
  const [state, setState] = useState({ loading: true, record: null, error: null });
  useEffect(() => {
    const d = DISTRICTS.find((x) => x.name === district);
    if (!d || !token) return;
    let active = true;
    setState({ loading: true, record: null, error: null });
    const get = (path) =>
      fetch(`${STRAPI_URL}/api${path}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : { data: [] }));
    const q = encodeURIComponent(district);
    Promise.all([get(`/ews/reports?district=${q}&days=120&limit=300`), get(`/ews/feedback?district=${q}&limit=500`), get(`/ews/signal-logs?district=${q}&days=120`)])
      .then(([reports, feedback, logs]) =>
        active && setState({ loading: false, record: trackRecord({ district: d, logs: logs.data, reports: reports.data, feedback: feedback.data, loggingSince: logs.loggingSince }), error: null })
      )
      .catch((err) => active && setState({ loading: false, record: null, error: err.message }));
    return () => {
      active = false;
    };
  }, [district, token]);

  const rec = state.record;
  return (
    <Card
      title="On the ground"
      subtitle="Agent reports and SMS replies by place, and how the automatic signals there compared with them. This is the local evidence AI insights weigh."
    >
      {state.loading && <p className="text-sm text-gray-500">Loading reports and signal history…</p>}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {rec && (
        <>
          <p className="text-sm text-gray-700 mb-3">
            {rec.since
              ? `Signals logged for ${rec.loggedDays} day${rec.loggedDays === 1 ? "" : "s"}, since ${rec.since}. Only reports and replies from then on count. A track record needs a few months before it means much.`
              : "Signal logging starts with the next warning check (every 3 hours), so there is no track record yet."}
          </p>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400">
                  <th className="px-2 py-1.5 font-semibold">Place</th>
                  <th className="px-2 py-1.5 font-semibold">Reports</th>
                  <th className="px-2 py-1.5 font-semibold">SMS replies</th>
                  <th className="px-2 py-1.5 font-semibold">Signals against the ground</th>
                </tr>
              </thead>
              <tbody>
                {rec.places.map((p) => (
                  <tr key={p.name} className="border-t border-gray-100 align-top">
                    <td className="px-2 py-1.5">
                      <span className="font-medium text-gray-800">{p.name}</span>
                      <span className="block text-[11px] text-gray-400">{p.area ? "extra forecast point" : "district headquarters"}</span>
                    </td>
                    <td className="px-2 py-1.5 text-gray-700">{p.reports}</td>
                    <td className="px-2 py-1.5 text-gray-700">{p.area ? "—" : p.replies}</td>
                    <td className="px-2 py-1.5 text-xs text-gray-700">
                      {p.hazards.length ? (
                        <ul className="space-y-0.5">
                          {p.hazards.map((h) => (
                            <li key={h.hazard}>
                              <b>{HAZARD_NAME(h.hazard)}</b>
                              {h.signalDays ? `: signal on ${h.signalDays} day${h.signalDays === 1 ? "" : "s"}, confirmed ${h.confirmed}` : ""}
                              {h.denied ? `, SMS said no heavy rain ${h.denied}` : ""}
                              {h.missed ? `${h.signalDays ? ";" : ":"} reported ${h.missed} time${h.missed === 1 ? "" : "s"} with no signal` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400">nothing yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Reports are placed by phone location, else the village or a place they name found on the map; SMS replies count for the district headquarters.
            Confirmed = a matching report or reply within 2 days of a signal. No report doesn&apos;t prove nothing happened.
          </p>
        </>
      )}
    </Card>
  );
}

const SEASON_STYLES = {
  very_dry: "bg-amber-100 text-amber-900",
  dry: "bg-amber-50 text-amber-800",
  normal: "bg-emerald-50 text-emerald-800",
  wet: "bg-sky-50 text-sky-800",
  very_wet: "bg-sky-100 text-sky-900",
};

function greennessWords(ndvi) {
  if (!ndvi) return "—";
  const words = ndvi.change <= -0.05 ? "less green" : ndvi.change >= 0.05 ? "greener" : "about usual";
  const v = Math.abs(ndvi.change) < 0.005 ? 0 : ndvi.change;
  return `${words} (${v > 0 ? "+" : ""}${v.toFixed(2)})`;
}

function downloadSeasonCsv(rows) {
  const head = ["district", "region", "months", "rain_mm", "usual_mm", "pct_of_usual", "category", "last_30_days_pct", "ndvi_month", "ndvi", "ndvi_usual", "ndvi_change", "top_signal", "signal_severity"];
  const cell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v);
  const lines = rows.map(({ d, s, top }) => [
    d.district, REGIONS[d.region], s?.months?.join(" "), s?.total, s?.usual, s?.pct, s?.category, s?.recentPct,
    s?.ndvi?.month, s?.ndvi?.value, s?.ndvi?.usual, s?.ndvi?.change, top ? top.label || HAZARD_LABELS[top.hazard] : "", top?.severity,
  ].map(cell).join(","));
  const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `kibiraai-season-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Every district's season so far, driest first: for district and national planners. */
function SeasonOverview({ overview, onSelect }) {
  const rows = (overview || [])
    .map((d) => ({ d, s: d.season, top: d.hazards?.[0] }))
    .sort((a, b) => (a.s?.pct ?? 999) - (b.s?.pct ?? 999));
  const withData = rows.filter((r) => r.s);
  if (!withData.length) return null;
  const span = withData[0].s.span;
  const dry = withData.filter((r) => r.s.pct < 75).length;
  const wet = withData.filter((r) => r.s.pct >= 130).length;
  const lessGreen = withData.filter((r) => r.s.ndvi?.change <= -0.05).length;
  return (
    <Card
      title="Season overview, all districts"
      subtitle={`Rain for ${span} as a share of the 2006–2025 usual (CHIRPS satellite), the last 30 days, and how green plants and pasture are (Sentinel-2). Driest first.`}
      right={
        <button onClick={() => downloadSeasonCsv(rows)} className="shrink-0 text-sm font-semibold text-emerald-800 border border-emerald-200 hover:bg-emerald-50 px-4 py-2 rounded-full">
          Download CSV
        </button>
      }
    >
      <p className="text-sm text-gray-700 mb-3">
        {dry ? `${dry} of ${withData.length} districts had under 75% of usual rain` : `No district had under 75% of usual rain`}
        {wet ? `, ${wet} had 130% or more` : ""}
        {lessGreen ? `, and ${lessGreen} ${lessGreen === 1 ? "is" : "are"} less green than usual` : ""}.
      </p>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400">
              <th className="px-2 py-1.5 font-semibold">District</th>
              <th className="px-2 py-1.5 font-semibold">Rain, {span}</th>
              <th className="px-2 py-1.5 font-semibold">Last 30 days</th>
              <th className="px-2 py-1.5 font-semibold">Greenness vs usual</th>
              <th className="px-2 py-1.5 font-semibold">Top signal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ d, s, top }) => (
              <tr key={d.district} onClick={() => onSelect(d.district)} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer">
                <td className="px-2 py-1.5">
                  <span className="font-medium text-gray-800">{d.district}</span>
                  <span className="block text-[11px] text-gray-400">{REGIONS[d.region]}</span>
                </td>
                <td className="px-2 py-1.5">
                  {s ? (
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${SEASON_STYLES[s.category] || ""}`} title={`${s.total}mm vs ${s.usual}mm usual`}>
                      {s.pct}% · {RAIN_CATEGORY[s.category]}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">no data yet</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-gray-700">{s?.recentPct != null ? `${s.recentPct}%` : "—"}</td>
                <td className="px-2 py-1.5 text-gray-700">{greennessWords(s?.ndvi)}</td>
                <td className="px-2 py-1.5">
                  {top ? (
                    <span className="flex items-center gap-1.5">
                      <SeverityBadge severity={top.severity} />
                      <span className="text-xs text-gray-600">{top.label || HAZARD_LABELS[top.hazard]}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">none</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        CHIRPS is published a few weeks after each month ends; the last 30 days come from weather model analysis. Lower greenness can also mean harvest or cleared land, so check with agents before acting on it alone.
      </p>
    </Card>
  );
}

export function OutlookTab({ token, isAdmin, meta }) {
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [selected, setSelected] = useState("Kisoro");
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [voice, setVoice] = useState({ sms: true, call: false, audio: {} });
  const [preset, setPreset] = useState(null);

  useEffect(() => {
    setVoice((v) => ({ ...v, audio: {} }));
    setPreset(null);
  }, [selected]);

  useEffect(() => {
    fetch("/api/ews/outlook")
      .then((r) => r.json())
      .then((d) => setOverview(d.districts || []))
      .catch(() => setOverview([]))
      .finally(() => setLoadingOverview(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingDetail(true);
    setError(null);
    setResult(null);
    fetch(`/api/ews/outlook?district=${encodeURIComponent(selected)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Forecast unavailable");
        setDetail(d);
        setDrafts(buildDrafts(d.hazards));
      })
      .catch((err) => {
        setDetail(null);
        setError(err.message);
      })
      .finally(() => setLoadingDetail(false));
  }, [selected]);

  const languages = useMemo(() => (detail?.district.languages || []).filter((l) => l !== "en"), [detail]);

  // Recent field reports for the map (admins only).
  const [mapReports, setMapReports] = useState([]);
  useEffect(() => {
    if (!token || !isAdmin) return;
    fetch(`${STRAPI_URL}/api/ews/reports?days=14&limit=300`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setMapReports((d.data || []).filter((r) => r.status !== "dismissed")))
      .catch(() => {});
  }, [token, isAdmin]);

  const openDistrict = useCallback((name) => {
    setSelected(name);
    document.getElementById("district-outlook")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  async function send(drafted) {
    if (!drafted.length) return;
    const channels = [voice.sms && "sms", voice.call && "voice"].filter(Boolean);
    if (!channels.length) {
      setError("Choose SMS, a voice call, or both");
      return;
    }
    const hasRecordings = voice.call && Object.keys(voice.audio).length > 0;
    if (hasRecordings && drafted.length > 1) {
      setError("Recordings belong to one message. Send one message group at a time when you use recordings.");
      return;
    }
    const alerts = drafted.map((a) => ({ ...a, channels, voiceAudio: voice.call ? voice.audio : {} }));
    const how = channels.map((c) => (c === "sms" ? "SMS" : "voice call")).join(" + ");
    const summary = alerts.map((a) => `• ${HAZARD_LABELS[a.hazard]} (${a.severity}) → ${a.personas.map((p) => PERSONA_LABEL[p]).join(", ")}`).join("\n");
    if (!window.confirm(`Send ${alerts.length} alert(s) by ${how} to registered people in ${selected}?\n\n${summary}`)) return;
    setSending(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`${STRAPI_URL}/api/ews/alerts/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ alerts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Send failed");
      setResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  const ready = detail ? alertsFromDrafts(detail.hazards, drafts, selected, detail.forecast) : [];

  return (
    <div className="space-y-6">
      <RiskMap overview={overview} reports={mapReports} selected={selected} onSelect={openDistrict} />
      <SeasonOverview overview={overview} onSelect={openDistrict} />
      <div id="district-outlook" className="grid lg:grid-cols-[300px_1fr] gap-6">
        <Card title="Districts" subtitle="Temperature now, with the highest signal for the next 7 days or the season so far">
          <DistrictOverview overview={overview} loading={loadingOverview} selected={selected} onSelect={setSelected} />
        </Card>

        <div className="space-y-6 min-w-0">
          <Card
            title={`${selected} weather outlook`}
            subtitle={detail ? `${detail.forecast.rainfall.label} · updated ${new Date(detail.forecast.generatedAt).toLocaleString("en-GB")}` : null}
          >
            {loadingDetail && <p className="text-sm text-gray-500">Loading forecast…</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {detail && !loadingDetail && (
              <>
                <WeatherStrip weather={detail.weather} normal={detail.normal} />
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Rainfall probability (ensemble)</h3>
                <ForecastChart rainfall={detail.forecast.rainfall} />
                <p className="text-xs text-gray-500 mt-3">
                  Forecast points are district headquarters on an ensemble grid of about 25km, so neighbouring districts can share values.
                </p>
                <RiverChart forecast={detail.forecast} hazards={detail.hazards} district={selected} floodProne={detail.district.hazards.includes("flood")} />
                <AreaTable district={selected} areas={detail.areas} />
              </>
            )}
          </Card>

          {detail && !loadingDetail && <SatelliteCard satellite={detail.satellite} district={selected} />}

          {isAdmin && <GroundTruthCard district={selected} token={token} />}

          {isAdmin && <InsightsCard district={selected} token={token} onUseDraft={(a) => {
            setPreset({ ...a, key: Date.now() });
            setTimeout(() => document.getElementById("custom-alert")?.scrollIntoView({ behavior: "smooth" }), 50);
          }} />}

          {detail && !loadingDetail && (
            <Card
              title="Hazard signals and draft messages"
              subtitle="Drafts only. Edit them, add reviewed translations, then send. Thresholds should be agreed with the met service and district disaster office."
            >
              {!detail.hazards.length && (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  No hazard signal for {selected} in the next 7 days or from the season so far.
                </p>
              )}
              <div className="space-y-6">
                {detail.hazards.map((h, i) => (
                  <div key={`${h.hazard}-${i}`}>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <SeverityBadge severity={h.severity} />
                      <span className="font-semibold text-gray-800">{h.label || HAZARD_LABELS[h.hazard]}</span>
                      {h.area && (
                        <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 rounded-full px-2 py-0.5">📍 {h.area} area</span>
                      )}
                      {h.basis === "satellite" && (
                        <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 border border-sky-100 rounded-full px-2 py-0.5">🛰️ uses satellite data</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{h.reason}</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {h.drafts.map((d) => {
                        const key = `${i}:${d.persona}`;
                        return drafts[key] ? (
                          <DraftEditor
                            key={key}
                            draft={drafts[key]}
                            languages={languages}
                            token={token}
                            onChange={(next) => setDrafts((prev) => ({ ...prev, [key]: next }))}
                          />
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {detail.hazards.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100">
                  <DeliveryChoice voice={voice} setVoice={setVoice} meta={meta} />
                  <p className="text-xs text-gray-500">
                    {ready.length} message group(s) selected. People get their language only where a translation is ticked as checked; everyone else gets English.
                  </p>
                  <button
                    disabled={!isAdmin || sending || !ready.length}
                    onClick={() => send(ready)}
                    className="bg-[#1b4332] hover:bg-[#2d6a4f] disabled:bg-gray-300 text-white text-sm font-semibold px-5 py-2.5 rounded-full"
                  >
                    {sending ? "Sending…" : "Send selected alerts"}
                  </button>
                </div>
              )}
              {!isAdmin && <p className="text-xs text-amber-700 mt-3">Only admins can send alerts.</p>}
            </Card>
          )}

          {result && (
            <Card title="Send result">
              <ul className="space-y-1 text-sm">
                {result.map((a, i) => (
                  <li key={i} className="flex flex-wrap gap-2">
                    {a.error ? (
                      <span className="text-red-600">{a.error}</span>
                    ) : (
                      <>
                        <span className="font-mono text-xs bg-gray-100 rounded px-1.5">#{a.code}</span>
                        <span>{HAZARD_LABELS[a.hazard]} → {(a.personas || []).map((p) => PERSONA_LABEL[p]).join(", ")}</span>
                        <span className="text-gray-500">
                          {a.status === "no_recipients"
                            ? "nobody registered yet"
                            : [
                                a.channels?.includes("sms") && `${a.acceptedCount} SMS accepted by the gateway`,
                                a.channels?.includes("voice") && `${a.callCount} calls placed`,
                              ].filter(Boolean).join(" · ") + ` (${a.recipientCount} people)`}
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {isAdmin && (
            <div id="custom-alert">
              <Card title="Custom alert" subtitle={`Write your own message for ${selected}`}>
                <div className="space-y-3">
                  <CustomAlert key={preset?.key || selected} district={selected} onSend={send} sending={sending} preset={preset} />
                  <DeliveryChoice voice={voice} setVoice={setVoice} meta={meta} />
                </div>
              </Card>
            </div>
          )}

          {isAdmin && voice.call && (
            <Card title="Voice call recordings" subtitle={`Played to people in ${selected} by their language`}>
              <VoicePanel languages={languages} meta={meta} token={token} voice={voice} setVoice={setVoice} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Register a community member ── */

const EMPTY_FORM = {
  name: "",
  phone: "",
  district: "Kisoro",
  subCounty: "",
  parish: "",
  village: "",
  persona: "farmer",
  language: "rufumbira",
  phoneType: "basic",
  consent: false,
};

const SOURCE_LABEL = { ussd: "USSD", sms: "SMS", web: "Admin console", volunteer: "Agent", app: "App", import: "CSV import" };

/** Everyone registered for warnings, newest first, with search and filters. */
function MembersCard({ token, reloadKey }) {
  const [filters, setFilters] = useState({ q: "", district: "", persona: "", active: "" });
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, rows: [], total: 0, error: null });
  const PAGE = 50;

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE) });
    for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);
    const timer = setTimeout(() => {
      fetch(`${STRAPI_URL}/api/ews/subscribers?${params}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error(d?.error?.message || "Could not load members");
          if (active) setState({ loading: false, rows: d.data || [], total: d.meta?.total || 0, error: null });
        })
        .catch((err) => active && setState({ loading: false, rows: [], total: 0, error: err.message }));
    }, filters.q ? 300 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [token, filters, page, reloadKey]);

  const setFilter = (k) => (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: e.target.value }));
  };
  const field = "text-sm rounded-lg border border-gray-200 px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300";
  const pages = Math.max(1, Math.ceil(state.total / PAGE));

  return (
    <div id="members">
      <Card title="Community members" subtitle={`${state.total} registered${filters.q || filters.district || filters.persona || filters.active ? " matching the filters" : ""}. Newest first.`}>
        <div className="flex flex-wrap gap-2 mb-3">
          <input value={filters.q} onChange={setFilter("q")} placeholder="Search name, phone or village" className={`${field} w-56`} />
          <select value={filters.district} onChange={setFilter("district")} className={field}>
            <option value="">All districts</option>
            {DISTRICTS.map((d) => <option key={d.name}>{d.name}</option>)}
          </select>
          <select value={filters.persona} onChange={setFilter("persona")} className={field}>
            <option value="">All work</option>
            {PERSONAS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <select value={filters.active} onChange={setFilter("active")} className={field}>
            <option value="">Getting warnings or stopped</option>
            <option value="true">Getting warnings</option>
            <option value="false">Stopped</option>
          </select>
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.loading && <p className="text-sm text-gray-500">Loading…</p>}
        {!state.loading && !state.error && !state.rows.length && <p className="text-sm text-gray-500">Nobody matches.</p>}
        {state.rows.length > 0 && (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400">
                  <th className="px-2 py-1.5 font-semibold">Name and phone</th>
                  <th className="px-2 py-1.5 font-semibold">Where</th>
                  <th className="px-2 py-1.5 font-semibold">Work</th>
                  <th className="px-2 py-1.5 font-semibold">Language and phone</th>
                  <th className="px-2 py-1.5 font-semibold">Registered</th>
                  <th className="px-2 py-1.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {state.rows.map((m) => (
                  <tr key={m.id} className="border-t border-gray-100 align-top">
                    <td className="px-2 py-1.5">
                      <span className="font-medium text-gray-800">{m.name || "No name given"}</span>
                      <span className="block text-xs text-gray-500 font-mono">{m.phone}</span>
                    </td>
                    <td className="px-2 py-1.5 text-gray-700">
                      {m.district}
                      <span className="block text-xs text-gray-500">{[m.village, m.parish, m.subCounty].filter(Boolean).join(", ") || "—"}</span>
                    </td>
                    <td className="px-2 py-1.5 text-gray-700">{PERSONA_LABEL[m.persona] || m.persona}</td>
                    <td className="px-2 py-1.5 text-gray-700">
                      {LANGUAGE_LABEL[m.language] || m.language}
                      <span className="block text-xs text-gray-500">{m.phoneType === "smartphone" ? "Smartphone" : m.phoneType === "basic" ? "Basic phone" : "Phone not known"}</span>
                    </td>
                    <td className="px-2 py-1.5 text-gray-700">
                      {new Date(m.createdAt).toLocaleDateString("en-GB")}
                      <span className="block text-xs text-gray-500">{[SOURCE_LABEL[m.source] || m.source, m.registeredBy].filter(Boolean).join(" · ")}</span>
                    </td>
                    <td className="px-2 py-1.5">
                      {m.active ? (
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-full px-2 py-0.5">Getting warnings</span>
                      ) : (
                        <span className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">Stopped</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-end gap-3 mt-3 text-sm">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-emerald-800 font-semibold disabled:text-gray-300">← Newer</button>
            <span className="text-gray-500">Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="text-emerald-800 font-semibold disabled:text-gray-300">Older →</button>
          </div>
        )}
      </Card>
    </div>
  );
}

export function RegisterTab({ token, ussdCode }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [added, setAdded] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${STRAPI_URL}/api/ews/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, channels: ["sms"] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Could not register");
      setMessage({ ok: true, text: `Registered ${data.data.phone} for ${data.data.district}.` });
      setAdded((n) => n + 1);
      setForm({ ...EMPTY_FORM, district: form.district, language: form.language });
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full text-sm rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-emerald-300";
  const district = DISTRICTS.find((d) => d.name === form.district);

  return (
    <div className="space-y-6">
    <div className="grid lg:grid-cols-[1fr_420px] gap-6">
      <Card title="Register a community member" subtitle="For staff signing people up in person. Agents use the mobile app.">
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs text-gray-600 space-y-1">
            <span>Name (optional)</span>
            <input value={form.name} onChange={set("name")} className={input} />
          </label>
          <label className="text-xs text-gray-600 space-y-1">
            <span>Phone number</span>
            <input required value={form.phone} onChange={set("phone")} placeholder="07XX XXX XXX" inputMode="tel" className={input} />
          </label>
          <label className="text-xs text-gray-600 space-y-1">
            <span>District</span>
            <select value={form.district} onChange={set("district")} className={input}>
              {DISTRICTS.map((d) => (
                <option key={d.name}>{d.name}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-600 space-y-1">
            <span>Sub-county</span>
            <input value={form.subCounty} onChange={set("subCounty")} className={input} />
          </label>
          <label className="text-xs text-gray-600 space-y-1">
            <span>Parish</span>
            <input value={form.parish} onChange={set("parish")} className={input} />
          </label>
          <label className="text-xs text-gray-600 space-y-1">
            <span>Village</span>
            <input value={form.village} onChange={set("village")} className={input} />
          </label>
          <label className="text-xs text-gray-600 space-y-1">
            <span>Main livelihood / situation</span>
            <select value={form.persona} onChange={set("persona")} className={input}>
              {PERSONAS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-600 space-y-1">
            <span>Preferred language</span>
            <select value={form.language} onChange={set("language")} className={input}>
              {LANGUAGES.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                  {district?.languages.includes(l.key) ? " (common here)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-600 space-y-1">
            <span>Phone type</span>
            <select value={form.phoneType} onChange={set("phoneType")} className={input}>
              <option value="basic">Basic / feature phone</option>
              <option value="smartphone">Smartphone</option>
              <option value="unknown">Not sure</option>
            </select>
          </label>
          <div className="sm:col-span-2 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-gray-700 space-y-2">
            <p className="font-semibold">Read this to the person, in their language:</p>
            <p>
              &ldquo;KibiraAI will send you free SMS and phone-call warnings about heavy rain, floods, landslides, dry spells and weather-related
              disease risks for {form.district}. We will not share your number. You can reply STOP at any time to end the messages.&rdquo;
            </p>
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" checked={form.consent} onChange={set("consent")} />
              They agreed to receive alerts
            </label>
          </div>
          <div className="sm:col-span-2 flex items-center justify-between gap-3">
            {message ? (
              <p className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.text}</p>
            ) : (
              <span />
            )}
            <button
              disabled={saving || !form.consent || !token}
              className="bg-[#1b4332] hover:bg-[#2d6a4f] disabled:bg-gray-300 text-white text-sm font-semibold px-5 py-2.5 rounded-full"
            >
              {saving ? "Saving…" : "Register"}
            </button>
          </div>
        </form>
      </Card>

      <div className="space-y-6">
      <CsvImport token={token} />
      <Card title="Other ways to join" subtitle="No smartphone or internet needed">
        <ul className="space-y-3 text-sm text-gray-700">
          <li>
            <span className="font-semibold">USSD:</span>{" "}
            {ussdCode ? (
              <>dial <span className="font-mono">{ussdCode}</span> and choose 1 (language, livelihood, district, village).</>
            ) : (
              "a USSD code is set up through Africa's Talking; it shows here once EWS_USSD_CODE is configured."
            )}
          </li>
          <li>
            <span className="font-semibold">SMS:</span> send <span className="font-mono">JOIN KISORO</span> (any district name) to the KibiraAI
            number.
          </li>
          <li>
            <span className="font-semibold">Report what happened:</span> after an alert, reply with its number and 1–8 (7 crop disease, 8 animal disease),
            or dial the USSD code and choose 2. Volunteers with a rain gauge can send <span className="font-mono">RAIN 25</span>.
          </li>
          <li>
            <span className="font-semibold">Stop:</span> reply <span className="font-mono">STOP</span>.
          </li>
        </ul>
      </Card>
      </div>
    </div>
    <MembersCard token={token} reloadKey={added} />
    </div>
  );
}

function CsvImport({ token }) {
  const [district, setDistrict] = useState("Kisoro");
  const [persona, setPersona] = useState("other");
  const [language, setLanguage] = useState("");
  const [parsed, setParsed] = useState(null);
  const [consent, setConsent] = useState(false);
  const [consentMethod, setConsentMethod] = useState("");
  const [sendWelcome, setSendWelcome] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function onFile(file) {
    setResult(null);
    setError(null);
    try {
      const out = parseContactsCsv(await file.text());
      if (!out.rows.length) throw new Error("No rows with a phone number found");
      setParsed({ ...out, fileName: file.name });
    } catch (err) {
      setParsed(null);
      setError(err.message);
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${STRAPI_URL}/api/ews/subscribers/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          district,
          persona,
          language: language || DISTRICTS.find((d) => d.name === district)?.languages[0] || "en",
          rows: parsed.rows,
          consentConfirmed: consent,
          consentMethod,
          sendWelcome,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Import failed");
      setResult(data.data);
      setParsed(null);
      setConsent(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full text-sm rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-emerald-300";
  return (
    <Card title="Import a contact list" subtitle="CSV with name and phone. Optional columns: livelihood, language, village, sub-county, parish, district.">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-gray-600 space-y-1">
            <span>District (unless the file says)</span>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className={input}>
              {DISTRICTS.map((d) => <option key={d.name}>{d.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-600 space-y-1">
            <span>Default livelihood</span>
            <select value={persona} onChange={(e) => setPersona(e.target.value)} className={input}>
              {PERSONAS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-600 space-y-1 col-span-2">
            <span>Default language</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={input}>
              <option value="">Most common in the district</option>
              {LANGUAGES.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer text-sm font-semibold text-emerald-700 border border-emerald-200 rounded-full px-4 py-2 hover:bg-emerald-50">
            Choose CSV file
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent("name,phone,livelihood,language,village\nJane Ahimbisibwe,0772000000,farmer,Runyankore,Kihihi\n")}`}
            download="kibira-contacts-template.csv"
            className="text-xs text-gray-500 hover:underline"
          >
            Download template
          </a>
        </div>

        {parsed && (
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              {parsed.fileName}: <span className="font-semibold">{parsed.rows.length}</span> people
              {parsed.ignored ? `, ${parsed.ignored} rows without a phone ignored` : ""}. Columns found: {parsed.columns.join(", ")}.
            </p>
            {parsed.mangled > 0 && (
              <p className="text-xs text-red-600">
                {parsed.mangled} phone numbers look like 2.56772E+11: Excel has cut digits off. Format the phone column as Text, re-type or
                re-export, then choose the file again. These rows will be skipped.
              </p>
            )}
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>{["Name", "Phone", "Livelihood", "Language", "Village"].map((h) => <th key={h} className="text-left px-2 py-1">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-2 py-1">{r.name}</td>
                      <td className="px-2 py-1 font-mono">{r.phone}</td>
                      <td className="px-2 py-1">{r.persona}</td>
                      <td className="px-2 py-1">{r.language}</td>
                      <td className="px-2 py-1">{r.village}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-gray-700 space-y-2">
              <label className="text-xs text-gray-600 space-y-1 block">
                <span>Where the list came from and how people agreed</span>
                <input
                  value={consentMethod}
                  onChange={(e) => setConsentMethod(e.target.value)}
                  placeholder="e.g. Kihihi farmers' cooperative, members agreed at the AGM"
                  className={input}
                />
              </label>
              <label className="flex items-start gap-2 font-semibold">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                Everyone on this list agreed to receive weather alerts from KibiraAI
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={sendWelcome} onChange={(e) => setSendWelcome(e.target.checked)} />
                Send new people a welcome SMS that explains how to STOP (recommended)
              </label>
            </div>
            <button
              onClick={submit}
              disabled={busy || !consent || !consentMethod.trim() || !token}
              className="bg-[#1b4332] hover:bg-[#2d6a4f] disabled:bg-gray-300 text-white text-sm font-semibold px-5 py-2.5 rounded-full"
            >
              {busy ? "Importing…" : `Import ${parsed.rows.length} people`}
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && (
          <div className="text-sm space-y-1">
            <p className="text-emerald-700 font-semibold">
              {result.created} added, {result.updated} already registered (updated), {result.skipped.length} skipped
              {result.welcomed ? `, ${result.welcomed} welcome SMS sent` : ""}.
            </p>
            {result.skipped.length > 0 && (
              <details className="text-xs text-gray-600">
                <summary className="cursor-pointer">Skipped rows</summary>
                <ul className="mt-1 space-y-0.5 max-h-40 overflow-y-auto">
                  {result.skipped.map((s, i) => (
                    <li key={i}>Line {s.line} · {s.phone} · {s.reason}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── Agents & field reports ── */

const AGENT_STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  suspended: "bg-gray-200 text-gray-700",
  new: "bg-sky-100 text-sky-800",
  verified: "bg-emerald-100 text-emerald-800",
  responded: "bg-violet-100 text-violet-800",
  dismissed: "bg-gray-200 text-gray-700",
};

// "verified" is stored for Reviewed so older reports and AI insights keep their meaning.
const REPORT_STATUSES = [
  { key: "new", label: "Pending review" },
  { key: "verified", label: "Reviewed" },
  { key: "responded", label: "Responded" },
];
const STATUS_LABEL = { ...Object.fromEntries(REPORT_STATUSES.map((s) => [s.key, s.label])), dismissed: "Dismissed" };
const NOTE_PROMPT = {
  verified: "Note (optional): how was it confirmed?",
  responded: "Note (optional): what was done?",
};

function StatusPill({ status }) {
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${AGENT_STATUS_STYLES[status] || ""}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function Modal({ onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${wide ? "max-w-5xl" : "max-w-3xl"} max-h-full overflow-y-auto rounded-2xl bg-white shadow-xl`}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="sticky top-3 float-right mr-3 z-10 h-9 w-9 rounded-full bg-white/90 border border-gray-200 text-gray-600 hover:bg-gray-100 text-lg leading-none"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

/** Photos and videos of one report, opened on the page instead of a new tab. */
function MediaViewer({ media, start, onClose }) {
  const [i, setI] = useState(start);
  const count = media.length;
  const step = useCallback((d) => setI((n) => (n + d + count) % count), [count]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "Escape") {
        // Close only the viewer, not an agent window open underneath.
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [step, onClose]);
  const m = media[i];
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-3 sm:p-8" onClick={onClose}>
      <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 h-10 w-10 rounded-full bg-white/15 text-white text-2xl hover:bg-white/25">
        ×
      </button>
      {count > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); step(-1); }}
            aria-label="Previous"
            className="absolute left-2 sm:left-6 h-11 w-11 rounded-full bg-white/15 text-white text-2xl hover:bg-white/25"
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); step(1); }}
            aria-label="Next"
            className="absolute right-2 sm:right-6 h-11 w-11 rounded-full bg-white/15 text-white text-2xl hover:bg-white/25"
          >
            ›
          </button>
        </>
      )}
      <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-3 max-w-full max-h-full">
        {m.mime?.startsWith("video/") ? (
          <video key={m.url} src={mediaUrl(m.url)} controls autoPlay className="max-h-[80vh] max-w-full rounded-lg bg-black" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(m.url)} alt="Field report" className="max-h-[80vh] max-w-full rounded-lg object-contain" />
        )}
        {count > 1 && <p className="text-xs text-white/70">{i + 1} of {count}</p>}
      </div>
    </div>
  );
}

function ReportCard({ r, onStatus, onOpenMedia, showAgent = true }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-gray-900">{REPORT_LABEL[r.category] || r.category}</span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${r.impact === "severe" ? "bg-red-100 text-red-800" : r.impact === "moderate" ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-700"}`}>
          {r.impact}
        </span>
        <StatusPill status={r.status} />
      </div>
      <p className="text-xs text-gray-500">
        {r.district}{r.village ? ` · ${r.village}` : ""} · {r.occurredOn}{showAgent ? ` · by ${r.reporterName}` : ""}
        {r.peopleAffected != null ? ` · ${r.peopleAffected} people affected` : ""}
      </p>
      {(r.locationSource || r.places?.length > 0) && (
        <p className="text-xs text-gray-500">
          📍 {r.locationSource === "gps" ? "Phone location" : r.locationSource === "village" ? "Village found on the map" : "No location"}
          {r.places?.length > 0 && ` · places named: ${r.places.map((p) => `${p.name}${p.lat == null ? " (not found)" : ""}`).join(", ")}`}
        </p>
      )}
      <p className="text-sm text-gray-800 whitespace-pre-line">{r.description}</p>
      {r.media?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {r.media.map((m, i) => (
            <button key={i} onClick={() => onOpenMedia(r.media, i)} className="relative rounded-lg overflow-hidden hover:opacity-90" aria-label="Open photo">
              {m.mime?.startsWith("video/") ? (
                <>
                  <video src={mediaUrl(m.url)} muted preload="metadata" className="h-32 w-24 object-cover bg-black" />
                  <span className="absolute inset-0 flex items-center justify-center text-white text-2xl bg-black/30">▶</span>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(m.url)} alt="Field report" className="h-32 object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
      {r.aiSummary && (
        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
          <span className="font-semibold">AI note:</span> {r.aiSummary}
        </p>
      )}
      {r.latitude != null && (
        <a
          href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=14/${r.latitude}/${r.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-emerald-700 hover:underline"
        >
          View location
        </a>
      )}
      {r.reviewNote && <p className="text-xs text-gray-500">Note: {r.reviewNote}{r.reviewedBy ? ` (${r.reviewedBy})` : ""}</p>}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-xs">
          {REPORT_STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => r.status !== s.key && onStatus(r, s.key)}
              aria-pressed={r.status === s.key}
              className={`px-3 py-1.5 font-semibold border-r last:border-r-0 border-gray-200 ${r.status === s.key ? "bg-[#1b4332] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {r.status !== "dismissed" && (
          <button onClick={() => onStatus(r, "dismissed")} className="text-xs text-gray-500 hover:underline">
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

/** One agent: their details, every report they sent and everyone they registered. */
function AgentDetail({ id, token, onClose, onStatus, onOpenMedia, reloadKey }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("reports");

  useEffect(() => {
    let live = true;
    fetch(`${STRAPI_URL}/api/ews/agents/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((x) => x.json())
      .then((d) => {
        if (!live) return;
        if (d.error) throw new Error(d.error.message);
        setDetail(d.data);
      })
      .catch((err) => live && setError(err.message || "Could not load agent"));
    return () => {
      live = false;
    };
  }, [id, token, reloadKey]);

  const a = detail?.agent;
  const place = a ? [a.village, a.parish, a.subCounty, a.district].filter(Boolean).join(", ") : "";
  return (
    <Modal onClose={onClose} wide>
      <div className="p-5 sm:p-7">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!detail && !error && <p className="text-sm text-gray-500">Loading…</p>}
        {a && (
          <>
            <div className="flex flex-wrap items-center gap-2 pr-12">
              <h3 className="text-xl font-bold text-[#1b4332] font-[family-name:var(--font-display)]">{a.fullName}</h3>
              <StatusPill status={a.status} />
            </div>
            <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm mt-4">
              {[
                ["Phone", a.phone],
                ["Email", a.email],
                ["Area", place],
                ["Applied", a.createdAt && new Date(a.createdAt).toLocaleDateString("en-GB")],
                ["Reviewed", a.reviewedAt && `${new Date(a.reviewedAt).toLocaleDateString("en-GB")}${a.reviewedBy ? ` by ${a.reviewedBy}` : ""}`],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className="text-xs text-gray-500">{k}</dt>
                    <dd className="text-gray-800 break-words">{v}</dd>
                  </div>
                ))}
            </dl>
            {a.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-4">{a.notes}</p>}

            <div className="flex gap-2 mt-6 border-b border-gray-100">
              {[
                ["reports", `Reports (${detail.reports.length})`],
                ["people", `People registered (${detail.registrations.length})`],
              ].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px ${tab === k ? "border-[#1b4332] text-[#1b4332]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "reports" && (
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {detail.reports.map((r) => (
                  <ReportCard key={r.id} r={r} onStatus={onStatus} onOpenMedia={onOpenMedia} showAgent={false} />
                ))}
                {!detail.reports.length && <p className="text-sm text-gray-400">No reports yet.</p>}
              </div>
            )}

            {tab === "people" && (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-xs text-left">
                  <thead className="text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Phone</th>
                      <th className="py-2 pr-3">Place</th>
                      <th className="py-2 pr-3">Group</th>
                      <th className="py-2 pr-3">Language</th>
                      <th className="py-2 pr-3">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.registrations.map((p) => (
                      <Fragment key={p.id}>
                      <tr className={p.notes?.length ? "" : "border-b border-gray-50"}>
                        <td className="py-2 pr-3 text-gray-800">
                          {p.name || "—"}
                          {p.active === false && <span className="ml-1 text-gray-400">(stopped)</span>}
                        </td>
                        <td className="py-2 pr-3 font-mono">{p.phone}</td>
                        <td className="py-2 pr-3">{[p.village, p.district].filter(Boolean).join(", ")}</td>
                        <td className="py-2 pr-3">{PERSONA_LABEL[p.persona] || p.persona || "—"}</td>
                        <td className="py-2 pr-3">{LANGUAGE_LABEL[p.language] || p.language || "—"}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString("en-GB")}</td>
                      </tr>
                      {p.notes?.length > 0 && (
                        <tr className="border-b border-gray-50">
                          <td colSpan={6} className="pb-3 pr-3">
                            <div className="space-y-1.5 rounded-lg bg-gray-50 p-2.5">
                              {p.notes.map((n) => (
                                <p key={n.id} className="text-gray-700">
                                  <span className="font-semibold text-gray-500">
                                    {n.observedOn ? n.observedOn.split("-").reverse().join("-") : ""}
                                    {n.category ? ` · ${REPORT_LABEL[n.category] || n.category}` : ""}:
                                  </span>{" "}
                                  {n.note}
                                </p>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
                {!detail.registrations.length && <p className="text-sm text-gray-400 py-4">Nobody registered yet.</p>}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

export function AgentsTab({ token }) {
  const [agents, setAgents] = useState(null);
  const [reports, setReports] = useState(null);
  const [district, setDistrict] = useState("");
  const [error, setError] = useState(null);
  const [agentId, setAgentId] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setError(null);
    try {
      const q = district ? `&district=${encodeURIComponent(district)}` : "";
      const [a, r] = await Promise.all([
        fetch(`${STRAPI_URL}/api/ews/agents`, { headers: { Authorization: `Bearer ${token}` } }).then((x) => x.json()),
        fetch(`${STRAPI_URL}/api/ews/reports?days=90${q}`, { headers: { Authorization: `Bearer ${token}` } }).then((x) => x.json()),
      ]);
      if (a.error || r.error) throw new Error(a.error?.message || r.error?.message);
      setAgents(a.data);
      setReports(r.data);
    } catch (err) {
      setError(err.message || "Could not load agents");
    }
  }, [token, district]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  async function update(kind, id, body) {
    const res = await fetch(`${STRAPI_URL}/api/ews/${kind}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message || "Update failed");
      return;
    }
    load();
    setReloadKey((k) => k + 1);
  }

  function setReportStatus(r, status) {
    const note = NOTE_PROMPT[status] ? window.prompt(NOTE_PROMPT[status]) : null;
    update("reports", r.id, { status, reviewNote: note || undefined });
  }

  const openMedia = useCallback((media, start) => setViewer({ media, start }), []);
  const closeAgent = useCallback(() => setAgentId(null), []);
  const closeViewer = useCallback(() => setViewer(null), []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!agents || !reports) return <p className="text-sm text-gray-500">Loading…</p>;

  const shownAgents = district ? agents.filter((a) => a.district === district) : agents;
  const pending = agents.filter((a) => a.status === "pending").length;
  const tiles = [
    { label: "Agents approved", value: agents.filter((a) => a.status === "approved").length },
    { label: "Waiting for approval", value: pending },
    { label: "People registered by agents", value: agents.reduce((n, a) => n + a.registrations, 0) },
    { label: "Reports pending review", value: reports.filter((r) => r.status === "new").length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500">{t.label}</p>
            <p className="text-2xl font-bold text-[#1b4332] font-[family-name:var(--font-display)] mt-1">{t.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <select value={district} onChange={(e) => setDistrict(e.target.value)} className="text-sm rounded-lg border border-gray-200 p-2 bg-white">
          <option value="">All districts</option>
          {DISTRICTS.map((d) => <option key={d.name}>{d.name}</option>)}
        </select>
        <button onClick={load} className="text-sm text-emerald-700 hover:underline">Refresh</button>
      </div>

      <Card title="KibiraAI agents" subtitle="Agents sign up in the mobile app. Approve them before they can register people; anyone pending can still send reports. Click a name to see their reports and the people they registered.">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-gray-500 border-b border-gray-100">
              <tr>
                <th className="py-2 pr-3">Agent</th>
                <th className="py-2 pr-3">District</th>
                <th className="py-2 pr-3">Phone</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Registered</th>
                <th className="py-2 pr-3">Reports</th>
                <th className="py-2 pr-3">Last report</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {shownAgents.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 align-top">
                  <td className="py-2 pr-3">
                    <button onClick={() => setAgentId(a.id)} className="font-semibold text-[#1b4332] hover:underline text-left">
                      {a.fullName}
                    </button>
                    <p className="text-gray-400">{a.email}</p>
                    {a.notes && <p className="text-gray-500 mt-0.5 max-w-xs">{a.notes}</p>}
                  </td>
                  <td className="py-2 pr-3">
                    {a.district}
                    {a.village ? <span className="text-gray-400"> · {a.village}</span> : null}
                  </td>
                  <td className="py-2 pr-3 font-mono">{a.phone}</td>
                  <td className="py-2 pr-3"><StatusPill status={a.status} /></td>
                  <td className="py-2 pr-3">{a.registrations}</td>
                  <td className="py-2 pr-3">{a.reports}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{a.lastReportAt ? new Date(a.lastReportAt).toLocaleDateString("en-GB") : "—"}</td>
                  <td className="py-2 pr-3 whitespace-nowrap space-x-2">
                    {a.status !== "approved" && (
                      <button onClick={() => update("agents", a.id, { status: "approved" })} className="text-emerald-700 font-semibold hover:underline">
                        Approve
                      </button>
                    )}
                    {a.status !== "suspended" && (
                      <button onClick={() => update("agents", a.id, { status: "suspended" })} className="text-red-600 hover:underline">
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!shownAgents.length && <p className="text-sm text-gray-400 py-4">No agents yet.</p>}
        </div>
      </Card>

      <Card title="Field reports" subtitle="Incidents agents saw on the ground, including ones no alert flagged. Reviewed and responded reports carry more weight in AI insights.">
        {!reports.length && <p className="text-sm text-gray-400">No reports yet.</p>}
        <div className="grid md:grid-cols-2 gap-4">
          {reports.map((r) => (
            <ReportCard key={r.id} r={r} onStatus={setReportStatus} onOpenMedia={openMedia} />
          ))}
        </div>
      </Card>

      {agentId && (
        <AgentDetail id={agentId} token={token} onClose={closeAgent} onStatus={setReportStatus} onOpenMedia={openMedia} reloadKey={reloadKey} />
      )}
      {viewer && <MediaViewer media={viewer.media} start={viewer.start} onClose={closeViewer} />}
    </div>
  );
}

/* ── Reach & feedback ── */

function Tally({ title, data, labels }) {
  const rows = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  const max = rows[0]?.[1] || 1;
  return (
    <Card title={title}>
      {!rows.length && <p className="text-sm text-gray-400">No data yet</p>}
      <div className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">{labels?.[k] || k}</span>
              <span className="font-semibold text-gray-800">{v}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${(v / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ReachTab({ token }) {
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [res, fb] = await Promise.all([
        fetch(`${STRAPI_URL}/api/ews/stats`, { headers }),
        fetch(`${STRAPI_URL}/api/ews/feedback?limit=200`, { headers }),
      ]);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Could not load stats");
      setStats(data);
      const fbData = await fb.json().catch(() => ({}));
      setFeedback(fbData.data || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!stats) return <p className="text-sm text-gray-500">Loading…</p>;

  const sent = stats.alerts.filter((a) => a.status !== "no_recipients");
  const accepted = sent.reduce((n, a) => n + (a.acceptedCount || 0), 0);
  const delivered = sent.reduce((n, a) => n + (a.deliveredCount || 0), 0);
  const tiles = [
    { label: "People reachable", value: stats.subscribers.active },
    { label: "Alerts sent (90 days)", value: sent.length },
    { label: "SMS confirmed delivered", value: accepted ? `${delivered} of ${accepted}` : "—" },
    { label: "Ground-truth reports", value: stats.feedback.total },
  ];

  return (
    <div className="space-y-6">
      {!stats.smsConfigured && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          SMS is not configured on the backend yet (AT_USERNAME / AT_API_KEY). Alerts cannot be sent until it is.
        </p>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500">{t.label}</p>
            <p className="text-2xl font-bold text-[#1b4332] font-[family-name:var(--font-display)] mt-1">{t.value}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Tally title="By district" data={stats.subscribers.byDistrict} />
        <Tally title="By livelihood" data={stats.subscribers.byPersona} labels={PERSONA_LABEL} />
        <Tally title="By language" data={stats.subscribers.byLanguage} labels={LANGUAGE_LABEL} />
        <Tally title="Reports received" data={stats.feedback.byObservation} labels={OBSERVATION_LABEL} />
      </div>
      <Card title="Alerts and what people reported back" subtitle="Feedback is matched to the alert the person received in the 5 days before reporting">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-gray-500 border-b border-gray-100">
              <tr>
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Sent</th>
                <th className="py-2 pr-3">District</th>
                <th className="py-2 pr-3">Hazard</th>
                <th className="py-2 pr-3">To</th>
                <th className="py-2 pr-3">Delivered</th>
                <th className="py-2 pr-3">Reports</th>
              </tr>
            </thead>
            <tbody>
              {stats.alerts.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 align-top">
                  <td className="py-2 pr-3 font-mono">{a.code}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{a.sentAt ? new Date(a.sentAt).toLocaleString("en-GB") : "—"}</td>
                  <td className="py-2 pr-3">{a.district}</td>
                  <td className="py-2 pr-3">
                    <SeverityBadge severity={a.severity} /> {HAZARD_LABELS[a.hazard]}
                  </td>
                  <td className="py-2 pr-3">{(a.personas || []).map((p) => PERSONA_LABEL[p]).join(", ")}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {a.status === "no_recipients" ? "nobody registered" : a.channels?.includes("sms") ? `${a.deliveredCount}/${a.recipientCount} SMS` : ""}
                    {a.failedCount > 0 && <span className="text-red-600"> · {a.failedCount} failed</span>}
                    {a.channels?.includes("voice") && <span className="block">{a.callAnsweredCount}/{a.callCount} calls answered</span>}
                  </td>
                  <td className="py-2 pr-3">
                    {Object.entries(a.feedback).map(([k, v]) => `${OBSERVATION_LABEL[k] || k}: ${v}`).join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!stats.alerts.length && <p className="text-sm text-gray-400 py-4">No alerts sent yet.</p>}
        </div>
      </Card>
      <Card title="Reports from the community" subtitle="What people say actually happened, sent from the app's Alerts tab, by SMS or by USSD. Newest first.">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-gray-500 border-b border-gray-100">
              <tr>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">What happened</th>
                <th className="py-2 pr-3">Rain gauge</th>
                <th className="py-2 pr-3">Where</th>
                <th className="py-2 pr-3">From</th>
                <th className="py-2 pr-3">Via</th>
                <th className="py-2 pr-3">About alert</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map((f) => (
                <tr key={f.id} className="border-b border-gray-50 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{new Date(f.reportedAt || f.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="py-2 pr-3 font-semibold text-gray-800">
                    {OBSERVATION_LABEL[f.observation] || f.observation}
                    {f.rawText && <span className="block font-normal text-gray-500">&ldquo;{f.rawText}&rdquo;</span>}
                  </td>
                  <td className="py-2 pr-3">{f.rainfallMm != null ? `${f.rainfallMm} mm` : "—"}</td>
                  <td className="py-2 pr-3">{[f.village, f.district].filter(Boolean).join(", ") || "—"}</td>
                  <td className="py-2 pr-3">
                    {f.reporterName || "—"}
                    {f.phone && <span className="block font-mono text-gray-400">{f.phone}</span>}
                  </td>
                  <td className="py-2 pr-3 uppercase text-gray-500">{f.source}</td>
                  <td className="py-2 pr-3 font-mono">{f.alertCode ? `#${f.alertCode}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!feedback.length && <p className="text-sm text-gray-400 py-4">No reports from the community yet.</p>}
        </div>
      </Card>
    </div>
  );
}

/* ── Page ── */
