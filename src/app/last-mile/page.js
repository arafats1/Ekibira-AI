"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
} from "recharts";
import EarlyWarningNav from "../components/EarlyWarningNav";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { DISTRICTS, PERSONAS, LANGUAGES, REGIONS } from "@/lib/ews/regions";
import { HAZARD_LABELS } from "@/lib/ews/hazards";
import { smsSegments, FOOTER_SAMPLE } from "@/lib/ews/messages";
import { parseContactsCsv } from "@/lib/ews/csv";

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

function useToken() {
  const [token, setToken] = useState(null);
  useEffect(() => {
    try {
      setToken(localStorage.getItem("kibira_token"));
    } catch {}
  }, []);
  return token;
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
                        <span className="text-[11px] text-gray-500 hidden xl:inline">{HAZARD_LABELS[top.hazard]}</span>
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
      subtitle="Reads the last 30 days against the normal for these dates, the ensemble outlook, river flow, agent field reports and community feedback. Suggestions only."
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
              {state.data.inputs.normal ? " seasonal normal" : " no normal available"} · {new Date(state.data.generatedAt).toLocaleString("en-GB")}
            </p>
          </div>
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
              <div className="space-y-2">
                {ins.predictions.map((p, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${LIKELIHOOD_STYLES[p.likelihood]}`}>{p.likelihood} likelihood</span>
                      <span className="font-semibold text-gray-800">{p.outcome}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {p.timeframe}{p.affected ? ` · ${p.affected}` : ""}
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
      state[`${i}:${d.persona}`] = { persona: d.persona, message: d.message, include: d.persona !== "other", translations: {} };
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

function OutlookTab({ token, isAdmin, meta }) {
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
    <div className="grid lg:grid-cols-[300px_1fr] gap-6">
      <Card title="Districts" subtitle="Temperature now, with the highest hazard or disease-risk signal for the next 7 days">
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
            </>
          )}
        </Card>

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
                No hazard signal for {selected} in the next 7 days.
              </p>
            )}
            <div className="space-y-6">
              {detail.hazards.map((h, i) => (
                <div key={`${h.hazard}-${i}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <SeverityBadge severity={h.severity} />
                    <span className="font-semibold text-gray-800">{HAZARD_LABELS[h.hazard]}</span>
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

function RegisterTab({ token, ussdCode }) {
  const [form, setForm] = useState(EMPTY_FORM);
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
  dismissed: "bg-gray-200 text-gray-700",
};

function StatusPill({ status }) {
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${AGENT_STATUS_STYLES[status] || ""}`}>{status}</span>;
}

function AgentsTab({ token }) {
  const [agents, setAgents] = useState(null);
  const [reports, setReports] = useState(null);
  const [district, setDistrict] = useState("");
  const [error, setError] = useState(null);

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
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!agents || !reports) return <p className="text-sm text-gray-500">Loading…</p>;

  const shownAgents = district ? agents.filter((a) => a.district === district) : agents;
  const pending = agents.filter((a) => a.status === "pending").length;
  const tiles = [
    { label: "Agents approved", value: agents.filter((a) => a.status === "approved").length },
    { label: "Waiting for approval", value: pending },
    { label: "People registered by agents", value: agents.reduce((n, a) => n + a.registrations, 0) },
    { label: "Field reports (90 days)", value: reports.length },
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

      <Card title="KibiraAI agents" subtitle="Agents sign up in the mobile app. Approve them before they can register people; anyone pending can still send reports.">
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
                    <p className="font-semibold text-gray-800">{a.fullName}</p>
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

      <Card title="Field reports" subtitle="Incidents agents saw on the ground, including ones no alert flagged. Verified reports carry more weight in AI insights.">
        {!reports.length && <p className="text-sm text-gray-400">No reports yet.</p>}
        <div className="grid md:grid-cols-2 gap-4">
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-100 p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-gray-900">{REPORT_LABEL[r.category] || r.category}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${r.impact === "severe" ? "bg-red-100 text-red-800" : r.impact === "moderate" ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-700"}`}>
                  {r.impact}
                </span>
                <StatusPill status={r.status} />
              </div>
              <p className="text-xs text-gray-500">
                {r.district}{r.village ? ` · ${r.village}` : ""} · {r.occurredOn} · by {r.reporterName}
                {r.peopleAffected != null ? ` · ${r.peopleAffected} people affected` : ""}
              </p>
              <p className="text-sm text-gray-800 whitespace-pre-line">{r.description}</p>
              {r.media?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {r.media.map((m, i) =>
                    m.mime?.startsWith("video/") ? (
                      <video key={i} src={mediaUrl(m.url)} controls className="h-32 rounded-lg bg-black" />
                    ) : (
                      <a key={i} href={mediaUrl(m.url)} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mediaUrl(m.url)} alt="Field report" className="h-32 rounded-lg object-cover" />
                      </a>
                    )
                  )}
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
              {r.reviewNote && <p className="text-xs text-gray-500">Review: {r.reviewNote}</p>}
              <div className="flex gap-3 text-xs pt-1">
                {r.status !== "verified" && (
                  <button
                    onClick={() => update("reports", r.id, { status: "verified", reviewNote: window.prompt("Note (optional): how was it confirmed?") || undefined })}
                    className="text-emerald-700 font-semibold hover:underline"
                  >
                    Verify
                  </button>
                )}
                {r.status !== "dismissed" && (
                  <button onClick={() => update("reports", r.id, { status: "dismissed" })} className="text-gray-500 hover:underline">
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
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

function ReachTab({ token }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${STRAPI_URL}/api/ews/stats`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Could not load stats");
      setStats(data);
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
    </div>
  );
}

/* ── Page ── */

export default function LastMilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const token = useToken();
  const [tab, setTab] = useState("outlook");
  const [meta, setMeta] = useState(null);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/last-mile");
  }, [loading, user, router]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch(`${STRAPI_URL}/api/ews/meta`)
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {});
  }, [isAdmin]);

  function signOut() {
    logout();
    router.replace("/login?redirect=/last-mile");
  }

  const tabs = [
    { id: "outlook", label: "Forecast & alerts" },
    { id: "register", label: "Register people" },
    { id: "agents", label: "Agents & field reports" },
    { id: "reach", label: "Reach & feedback" },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf5]">
      <EarlyWarningNav
        title="Last-Mile Early Warning"
        theme="forest"
        links={[
          { href: "/urban-warning", label: "Urban Warning" },
          { href: "/childrens-early-warning", label: "Children's Early Warning" },
        ]}
      />

      <header className="bg-[#1b4332] pt-24 pb-10">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-[family-name:var(--font-display)]">
              Last-mile early warning · South-western Uganda
            </h1>
            <p className="text-white/70 text-sm sm:text-base max-w-3xl mt-2 leading-relaxed">
              Weather forecasts and history turned into short, practical SMS and voice calls for farmers, vendors, livestock keepers, fishers and
              families in flood and landslide areas. Each one is reviewed by a person before it goes out; agents and community members report back
              what actually happened.
            </p>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-white/70 text-xs truncate max-w-[220px]">{user.email}</span>
              <button
                onClick={signOut}
                className="text-sm font-semibold text-white border border-white/30 hover:bg-white/10 px-4 py-2 rounded-full"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading || !user ? null : !isAdmin ? (
          <Card title="Admin access only">
            <p className="text-sm text-gray-600 mb-4">
              The last-mile console is restricted to KibiraAI administrators. You are signed in as {user.email}.
            </p>
            <div className="flex gap-3">
              <Link href="/dashboard" className="bg-[#1b4332] text-white text-sm font-semibold px-5 py-2.5 rounded-full">
                Go to your dashboard
              </Link>
              <button onClick={signOut} className="text-sm font-semibold text-gray-700 border border-gray-200 px-5 py-2.5 rounded-full">
                Sign out
              </button>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    tab === t.id ? "bg-[#1b4332] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {tab === "outlook" && <OutlookTab token={token} isAdmin={isAdmin} meta={meta} />}
            {tab === "register" && <RegisterTab token={token} ussdCode={meta?.ussdCode} />}
            {tab === "agents" && <AgentsTab token={token} />}
            {tab === "reach" && <ReachTab token={token} />}
          </>
        )}
      </main>
    </div>
  );
}
