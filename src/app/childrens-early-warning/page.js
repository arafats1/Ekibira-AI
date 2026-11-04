"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { DISTRICTS } from "../../lib/ews/regions";

const LEVEL = {
  warning: { label: "High", box: "border-red-300 bg-red-50", bar: "bg-red-500", text: "text-red-800" },
  watch: { label: "Raised", box: "border-orange-300 bg-orange-50", bar: "bg-orange-500", text: "text-orange-800" },
  advisory: { label: "Some risk", box: "border-amber-300 bg-amber-50", bar: "bg-amber-400", text: "text-amber-800" },
  low: { label: "Low", box: "border-emerald-200 bg-white", bar: "bg-emerald-500", text: "text-emerald-800" },
};
const ICON = { malaria: "🦟", diarrhoea: "💧", respiratory: "🫁", heat: "🌡️" };

const LOCKED = [
  "Risk for each school and health facility on a map",
  "30-day trend and how this season compares with past years",
  "Confirmed outbreak tracking from district health teams",
  "History of alerts sent to parents, delivery and replies",
  "Exports and an API for health partners",
];

function RiskCard({ r }) {
  const lv = LEVEL[r.level] || LEVEL.low;
  return (
    <div className={`rounded-2xl border p-5 ${lv.box}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-[#1a2e1a] flex items-center gap-2">
          <span className="text-2xl">{ICON[r.key]}</span>
          {r.label}
        </p>
        <span className={`text-xs font-bold ${lv.text}`}>{lv.label}</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-black/5 overflow-hidden">
        <div className={`h-full ${lv.bar} transition-all duration-700`} style={{ width: `${Math.max(3, r.score)}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-[#6b7c6b]">{r.score}/100</p>
      {r.reasons?.length > 0 && <p className="mt-2 text-sm text-[#3d4f3d]">Why: {r.reasons.slice(0, 2).join("; ")}.</p>}
      {r.level !== "low" && (
        <ul className="mt-3 space-y-1">
          {r.advice.map((a) => (
            <li key={a} className="text-sm text-[#1a2e1a]">✓ {a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ChildrensEarlyWarningPage() {
  const [district, setDistrict] = useState("Kasese");
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    let active = true;
    setState("loading");
    fetch(`/api/ews/child-health?district=${encodeURIComponent(district)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!active) return;
        setData(d);
        setState("ready");
      })
      .catch(() => active && setState("error"));
    return () => {
      active = false;
    };
  }, [district]);

  const chart = (data?.days || []).map((d, i) => ({
    day: i === 0 ? "Today" : new Date(`${d.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short" }),
    rain: d.rain,
    feelsLike: d.feelsLike,
  }));

  return (
    <>
      <Navbar />
      <main className="bg-[#f6faf7] min-h-screen">
        <section className="pt-28 pb-10 bg-gradient-to-br from-[#3b0d1a] via-[#4c1324] to-[#2a0d16] text-white">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-rose-300">Children&apos;s early warning</p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-bold max-w-3xl">Act before children fall sick</h1>
            <p className="mt-4 text-white/80 max-w-2xl font-[family-name:var(--font-body)]">
              Malaria, diarrhoea, pneumonia and heat illness follow the weather. For each district, KibiraAI scores the coming week from the last 30 days of rain, the forecast and air quality, and the team alerts parents who signed up, including when health officials confirm an outbreak.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <label htmlFor="district" className="text-sm text-white/80">District</label>
              <select
                id="district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="rounded-xl px-4 py-2.5 text-[#1a2e1a] bg-white text-sm font-semibold"
              >
                {DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
          {state === "error" && <p className="text-[#6b7c6b]">The children&apos;s outlook could not be loaded. Please try again later.</p>}
          {state === "loading" && !data && (
            <div className="grid md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-44 rounded-2xl bg-white border border-[#e5e7eb] animate-pulse" />)}
            </div>
          )}
          {data && (
            <div className={state === "loading" ? "opacity-50 transition-opacity" : "transition-opacity"}>
              <h2 className="text-2xl font-bold text-[#1a2e1a]">This week in {data.district}</h2>
              {data.past30 && (
                <p className="text-sm text-[#4a5c4a] mt-1">
                  Last 30 days: {Math.round(data.past30.rain)}mm of rain{data.past30.usual != null ? ` (usually ${Math.round(data.past30.usual)}mm)` : ""}.
                </p>
              )}
              <div className="mt-5 grid md:grid-cols-2 gap-4">
                {data.risks.map((r) => <RiskCard key={r.key} r={r} />)}
              </div>

              <div className="mt-8 bg-white rounded-2xl border border-[#e5e7eb] p-5">
                <p className="font-bold text-[#1a2e1a]">Next 7 days: rain and how hot it feels</p>
                <div className="h-64 mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid stroke="#eef2ee" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6b7c6b" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="rain" tick={{ fontSize: 11, fill: "#6b7c6b" }} axisLine={false} tickLine={false} unit="mm" />
                      <YAxis yAxisId="temp" orientation="right" hide domain={["dataMin - 3", "dataMax + 3"]} />
                      <Tooltip formatter={(v, n) => (n === "rain" ? [`${v} mm`, "Rain"] : [`${v}°C`, "Feels like"])} />
                      <Bar yAxisId="rain" dataKey="rain" fill="#1d91c0" radius={[4, 4, 0, 0]} animationDuration={900} />
                      <Line yAxisId="temp" dataKey="feelsLike" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} animationDuration={1200} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-[#8a9a8a] mt-2">Blue bars: rain per day. Red line: how hot it feels (heat index). Sources: {data.sources.join(" · ")}.</p>
              </div>
            </div>
          )}

          <div className="mt-10 grid lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
              <h3 className="text-lg font-bold text-[#1a2e1a]">How parents get alerts</h3>
              <ol className="mt-3 space-y-2 text-sm text-[#3d4f3d]">
                <li>1. Sign up in the app or on the web in a covered district and tick <em>“I look after children under 5”</em>.</li>
                <li>2. When risk is high, or a health officer confirms an outbreak, the KibiraAI team sends an SMS in your language with what to do.</li>
                <li>3. Reply to say what you see, so the next warning is better.</li>
              </ol>
              <Link href="/signup" className="inline-block mt-4 text-rose-700 font-semibold hover:underline">Sign up for alerts →</Link>
            </div>
            <div className="rounded-2xl border border-dashed border-rose-300 bg-rose-50/50 p-6">
              <h3 className="text-lg font-bold text-[#1a2e1a]">🔒 The full children&apos;s dashboard</h3>
              <p className="text-sm text-[#4a5c4a] mt-1">For district health teams, schools, health facilities and partners:</p>
              <ul className="mt-3 space-y-1.5 text-sm text-[#3d4f3d]">
                {LOCKED.map((f) => (
                  <li key={f}>🔒 {f}</li>
                ))}
              </ul>
              <Link href="/contact?topic=children" className="inline-block mt-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2.5 rounded-full text-sm">
                Request access
              </Link>
            </div>
          </div>
          <p className="mt-6 text-xs text-[#8a9a8a]">
            These scores show how much the weather favours each illness. They are not case counts or a diagnosis. A sick child should always be taken to a health worker.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
