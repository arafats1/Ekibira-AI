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
  other: "Other",
};

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
                    {top && <span className="text-xs text-gray-500 hidden sm:inline">{HAZARD_LABELS[top.hazard]}</span>}
                    {d.error ? <span className="text-xs text-red-500">no data</span> : <SeverityBadge severity={top?.severity} />}
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

function CustomAlert({ district, onSend, sending }) {
  const [hazard, setHazard] = useState("hailstorm");
  const [severity, setSeverity] = useState("watch");
  const [personas, setPersonas] = useState(PERSONAS.map((p) => p.key));
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        For official met-service bulletins, hazards the model does not cover (hail, wind), or local reports. Sent in English.
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

function OutlookTab({ token, isAdmin }) {
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [selected, setSelected] = useState("Kisoro");
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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

  async function send(alerts) {
    if (!alerts.length) return;
    const summary = alerts.map((a) => `• ${HAZARD_LABELS[a.hazard]} (${a.severity}) → ${a.personas.map((p) => PERSONA_LABEL[p]).join(", ")}`).join("\n");
    if (!window.confirm(`Send ${alerts.length} SMS alert(s) to registered people in ${selected}?\n\n${summary}`)) return;
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
      <Card title="Districts" subtitle="Highest hazard signal in the next 7 days">
        <DistrictOverview overview={overview} loading={loadingOverview} selected={selected} onSelect={setSelected} />
      </Card>

      <div className="space-y-6 min-w-0">
        <Card
          title={`${selected} rainfall outlook`}
          subtitle={detail ? `${detail.forecast.rainfall.label} · updated ${new Date(detail.forecast.generatedAt).toLocaleString("en-GB")}` : null}
        >
          {loadingDetail && <p className="text-sm text-gray-500">Loading forecast…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {detail && !loadingDetail && (
            <>
              <ForecastChart rainfall={detail.forecast.rainfall} />
              <p className="text-xs text-gray-500 mt-3">
                Forecast points are district headquarters on an ensemble grid of about 25km, so neighbouring districts can share values.
              </p>
            </>
          )}
        </Card>

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
                        {a.status === "no_recipients" ? "nobody registered yet" : `${a.acceptedCount}/${a.recipientCount} accepted by the SMS gateway`}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {isAdmin && (
          <Card title="Custom alert" subtitle={`Write your own message for ${selected}`}>
            <CustomAlert district={selected} onSend={send} sending={sending} />
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
    <div className="grid lg:grid-cols-[1fr_340px] gap-6">
      <Card title="Register a community member" subtitle="For staff signing people up in person. Volunteers use the mobile app.">
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
              &ldquo;KibiraAI will send you free SMS warnings about heavy rain, floods, landslides and dry spells for {form.district}. We
              will not share your number. You can reply STOP at any time to end the messages.&rdquo;
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
            <span className="font-semibold">Report what happened:</span> after an alert, reply with its number and 1–6, or dial the USSD code and
            choose 2. Volunteers with a rain gauge can send <span className="font-mono">RAIN 25</span>.
          </li>
          <li>
            <span className="font-semibold">Stop:</span> reply <span className="font-mono">STOP</span>.
          </li>
        </ul>
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
                    {a.status === "no_recipients" ? "nobody registered" : `${a.deliveredCount}/${a.recipientCount}`}
                    {a.failedCount > 0 && <span className="text-red-600"> · {a.failedCount} failed</span>}
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
              Probabilistic rainfall forecasts turned into short, practical SMS for farmers, vendors, livestock keepers, fishers and families in
              flood and landslide areas. Each one is reviewed by a person before it goes out, and people can reply with what actually happened.
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
            {tab === "outlook" && <OutlookTab token={token} isAdmin={isAdmin} />}
            {tab === "register" && <RegisterTab token={token} ussdCode={meta?.ussdCode} />}
            {tab === "reach" && <ReachTab token={token} />}
          </>
        )}
      </main>
    </div>
  );
}
