"use client";
import { useEffect, useState } from "react";
import { DISTRICTS } from "@/lib/ews/regions";
import { smsSegments, FOOTER_SAMPLE } from "@/lib/ews/messages";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

const LEVEL = {
  warning: { label: "High", cls: "bg-red-50 border-red-200 text-red-800", severity: "warning" },
  watch: { label: "Raised", cls: "bg-orange-50 border-orange-200 text-orange-800", severity: "watch" },
  advisory: { label: "Some risk", cls: "bg-amber-50 border-amber-200 text-amber-800", severity: "advisory" },
  low: { label: "Low", cls: "bg-emerald-50 border-emerald-200 text-emerald-800", severity: "advisory" },
};
const ICON = { malaria: "🦟", diarrhoea: "💧", respiratory: "🫁", heat: "🌡️" };
const LEAD = { warning: "WARNING", watch: "BE READY", advisory: "NOTICE" };

// Diseases the team can warn about; risk keys line up with the outlook.
const DISEASES = [
  { key: "malaria", label: "Malaria", risk: "malaria" },
  { key: "diarrhoea", label: "Diarrhoea / cholera", risk: "diarrhoea" },
  { key: "respiratory", label: "Pneumonia & coughs", risk: "respiratory" },
  { key: "heat", label: "Heat illness", risk: "heat" },
  { key: "measles", label: "Measles" },
  { key: "other", label: "Other outbreak" },
];

const OUTBREAK = {
  malaria: "Health officials confirm more malaria cases in {d}. Children under 5 sleep under a treated net; test any fever the same day.",
  diarrhoea: "Health officials confirm cholera/diarrhoea cases in {d}. Boil drinking water, wash hands with soap, give ORS and go to the health centre.",
  respiratory: "More children with pneumonia in {d}. Fast or hard breathing: go to the health centre at once. Keep babies away from smoke.",
  heat: "Very hot days in {d}. Children drink water often and stay out of the midday sun. Tired, headache or vomiting: cool them and seek care.",
  measles: "Measles cases confirmed in {d}. Check your child's vaccination card and visit the health centre for measles vaccine. Fever with rash: seek care.",
  other: "Health officials report an outbreak in {d}: ",
};

function riskDraft(disease, risk, district, severity) {
  if (!risk) return `${LEAD[severity]}: ${OUTBREAK[disease].replace("{d}", district)}`;
  const tip = risk.advice.slice(0, 2).join(" ");
  return `${LEAD[severity]}: ${risk.label} risk for children is up in ${district} this week. ${tip}`;
}

/**
 * Children's health: the week's weather-driven risks for a district, and an
 * alert to parents (people who ticked "I look after children under 5") or to
 * everyone registered there, for a risk or a confirmed outbreak.
 */
export default function ChildHealthTab({ token }) {
  const [district, setDistrict] = useState(DISTRICTS[0].name);
  const [outlook, setOutlook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disease, setDisease] = useState("malaria");
  const [kind, setKind] = useState("risk");
  const [severity, setSeverity] = useState("watch");
  const [audience, setAudience] = useState("parents");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setOutlook(null);
    fetch(`/api/ews/child-health?district=${encodeURIComponent(district)}`)
      .then((r) => r.json())
      .then((d) => active && setOutlook(d.error ? null : d))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [district]);

  const riskFor = (key) => outlook?.risks?.find((r) => r.key === DISEASES.find((d) => d.key === key)?.risk);

  // Re-draft when the choices change; the admin can edit afterwards.
  useEffect(() => {
    const risk = kind === "risk" ? riskFor(disease) : null;
    setMessage(riskDraft(disease, risk, district, severity));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disease, kind, severity, district, outlook]);

  const pick = (risk) => {
    setDisease(risk.key);
    setKind("risk");
    setSeverity(LEVEL[risk.level].severity);
  };

  async function send() {
    if (!message.trim()) return;
    const who = audience === "parents" ? "parents of young children" : "everyone registered";
    if (!window.confirm(`Send this children's health alert by SMS to ${who} in ${district}?\n\n${message}`)) return;
    setSending(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`${STRAPI_URL}/api/ews/alerts/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          alerts: [
            {
              hazard: "child_health",
              severity,
              district,
              audience,
              personas: [],
              message: message.trim(),
              channels: ["sms"],
              forecastSource: kind === "risk" ? "KibiraAI children's health outlook" : "Confirmed by health officials",
              forecastSnapshot: kind === "risk" ? { disease, risk: riskFor(disease) || null } : { disease, outbreak: true },
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Send failed");
      const r = data.data?.[0];
      if (r?.error) throw new Error(r.error);
      setResult(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  const sms = smsSegments(`${message}${FOOTER_SAMPLE}`);

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-6">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1b4332]">Children&apos;s health this week</h2>
            <p className="text-xs text-gray-500">From the last 30 days of rain, the forecast and air quality. Tap a risk to draft an alert.</p>
          </div>
          <select value={district} onChange={(e) => setDistrict(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            {DISTRICTS.map((d) => (
              <option key={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
        {loading && <p className="text-sm text-gray-400 py-6">Loading…</p>}
        {outlook && (
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {outlook.risks.map((r) => {
              const lv = LEVEL[r.level];
              return (
                <button key={r.key} onClick={() => pick(r)} className={`text-left rounded-xl border p-4 hover:shadow-md transition-shadow ${lv.cls} ${disease === r.key && kind === "risk" ? "ring-2 ring-[#2d6a4f]" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{ICON[r.key]} {r.label}</span>
                    <span className="text-xs font-bold">{lv.label} · {r.score}</span>
                  </div>
                  <p className="text-xs mt-2 opacity-90">{r.reasons.join("; ") || "No strong weather signal."}</p>
                </button>
              );
            })}
          </div>
        )}
        {outlook && <p className="text-[11px] text-gray-400 mt-3">Scores show how much the weather favours each illness, not case counts. Use “Confirmed outbreak” only when health officials confirm cases.</p>}
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-lg font-bold text-[#1b4332]">Send an alert to {district}</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            {[["risk", "Weather risk"], ["outbreak", "Confirmed outbreak"]].map(([k, l]) => (
              <button key={k} onClick={() => setKind(k)} className={`rounded-lg border px-3 py-2 font-semibold ${kind === k ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "border-gray-200"}`}>{l}</button>
            ))}
          </div>
          <label className="block">
            <span className="text-xs text-gray-500">Illness</span>
            <select value={disease} onChange={(e) => setDisease(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2">
              {DISEASES.filter((d) => kind === "outbreak" || d.risk).map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs text-gray-500">Level</span>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2">
                <option value="advisory">Notice</option>
                <option value="watch">Be ready</option>
                <option value="warning">Warning</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Send to</span>
              <select value={audience} onChange={(e) => setAudience(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2">
                <option value="parents">Parents of children under 5</option>
                <option value="everyone">Everyone registered</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-gray-500">Message (English; edit before sending)</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
            <span className={`text-[11px] ${sms.segments > 2 ? "text-red-600" : "text-gray-500"}`}>{sms.length} chars with reply footer · {sms.segments} SMS</span>
          </label>
          <button onClick={send} disabled={sending || !message.trim()} className="w-full rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 disabled:opacity-50">
            {sending ? "Sending…" : "Send SMS alert"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {result && (
            <p className="text-sm text-emerald-700">
              {result.status === "no_recipients" ? "Nobody matched: no registered phones for this audience yet." : `Alert #${result.code} ${result.status}: ${result.recipientCount ?? 0} recipients.`}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
