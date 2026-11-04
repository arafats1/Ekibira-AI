"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RainMap from "../components/home/RainMap";
import { REGIONS } from "../../lib/ews/regions";
import { PLAY_STORE_URL } from "../../lib/ews/account";

const SEVERITY = {
  warning: { label: "Warning", card: "border-red-300 bg-red-50", chip: "bg-red-600 text-white", rank: 3 },
  watch: { label: "Be ready", card: "border-orange-300 bg-orange-50", chip: "bg-orange-500 text-white", rank: 2 },
  advisory: { label: "Notice", card: "border-amber-300 bg-amber-50", chip: "bg-amber-400 text-[#3b2a00]", rank: 1 },
};
const ICON = {
  heavy_rain: "🌧️", flood: "🌊", landslide: "⛰️", dry_spell: "☀️", hailstorm: "🧊", strong_wind: "💨",
  crop_disease: "🥔", livestock_disease: "🐄", human_disease: "🦟",
};
const LABEL = {
  heavy_rain: "Heavy rain", flood: "Flooding", landslide: "Landslide", dry_spell: "Dry spell", hailstorm: "Hailstorm",
  strong_wind: "Strong wind", crop_disease: "Crop disease", livestock_disease: "Animal disease", human_disease: "Malaria & diarrhoea",
};

function DistrictCard({ d }) {
  const top = d.hazards?.[0];
  const sev = top ? SEVERITY[top.severity] : null;
  return (
    <div className={`rounded-2xl border p-4 ${sev ? sev.card : "border-[#e5e7eb] bg-white"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{d.district}</p>
          {d.today && (
            <p className="text-xs text-[#4a5c4a]">
              {d.today.icon} {d.today.label} · {Math.round(d.today.tMax)}°/{Math.round(d.today.tMin)}° · {d.today.rain}mm
            </p>
          )}
        </div>
        {sev ? (
          <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${sev.chip}`}>{sev.label}</span>
        ) : (
          <span className="text-[10px] font-bold uppercase rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-800">Clear</span>
        )}
      </div>
      {d.hazards?.length ? (
        <>
        <ul className="mt-3 space-y-1">
          {d.hazards.slice(0, 3).map((h, i) => (
            <li key={i} className="text-sm text-[#1a2e1a]">
              {ICON[h.hazard] || "⚠️"} {h.label || LABEL[h.hazard] || h.hazard}
              {h.area ? <span className="text-[#6b7c6b]"> · {h.area}</span> : null}
              <span className="text-[#6b7c6b]"> ({SEVERITY[h.severity]?.label.toLowerCase()})</span>
            </li>
          ))}
        </ul>
        <details className="mt-2 group">
          <summary className="text-xs font-semibold text-[#2d6a4f] cursor-pointer select-none">Why?</summary>
          <ul className="mt-1 space-y-1.5">
            {d.hazards.slice(0, 3).map((h, i) => (
              <li key={i} className="text-xs text-[#4a5c4a] leading-snug">{h.reason}</li>
            ))}
          </ul>
        </details>
        </>
      ) : (
        <p className="mt-3 text-sm text-emerald-800">No raised risk for the next 7 days.</p>
      )}
    </div>
  );
}

export default function LastMilePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/ews/outlook")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const districts = data?.districts || [];
  const raised = districts.filter((d) => d.hazards?.length);
  const counts = Object.keys(SEVERITY).map((k) => [k, districts.filter((d) => d.hazards?.[0]?.severity === k).length]);

  return (
    <>
      <Navbar />
      <main className="bg-[#f6faf7] min-h-screen">
        <section className="pt-28 pb-12 bg-gradient-to-br from-[#0a1f13] via-[#0f2a1c] to-[#123524] text-white">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#4ade80]">Last-mile early warning</p>
              <h1 className="mt-2 text-4xl sm:text-5xl font-bold">Today&apos;s warnings, district by district</h1>
              <p className="mt-4 text-white/75 font-[family-name:var(--font-body)]">
                Worked out automatically every day from the ECMWF rain forecast (51 runs), river forecasts and the last 30 days against what is usual. The KibiraAI team reviews them before any SMS is sent.
              </p>
              {data && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {counts.map(([k, n]) => (
                    <span key={k} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${SEVERITY[k].chip}`}>{n} {SEVERITY[k].label.toLowerCase()}</span>
                  ))}
                  <span className="rounded-full px-3 py-1.5 text-sm font-semibold bg-emerald-500 text-white">{districts.length - raised.length} clear</span>
                </div>
              )}
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-block mt-8 bg-[#4ade80] hover:bg-[#22c55e] text-[#0a1f13] font-bold px-6 py-3 rounded-full">
                Get warnings for your area in the app
              </a>
            </div>
            <div className="rounded-3xl bg-white/5 border border-white/10 p-3">
              <RainMap className="h-[320px] sm:h-[400px] w-full" />
            </div>
          </div>
        </section>

        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {error && <p className="text-[#6b7c6b]">Today&apos;s warnings could not be loaded. Please try again later.</p>}
          {!data && !error && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-28 rounded-2xl bg-white border border-[#e5e7eb] animate-pulse" />)}
            </div>
          )}
          <div className="mb-10 rounded-2xl border border-[#d5e8dc] bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#1a2e1a] text-center">How to read these warnings</h2>
            <p className="mt-2 text-sm text-[#4a5c4a] text-center max-w-3xl mx-auto">
              Every card is worked out from real weather data for that district today: the rain forecast for the next 7–10 days and the rain that has already fallen, compared with what is usual for these dates. They are predictions of risk, not reports of cases or damage.
            </p>
            <div className="mt-5 grid md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-[#f6faf7] p-4">
                <p className="font-bold text-[#1a2e1a]">🦟 Why so much malaria &amp; diarrhoea?</p>
                <p className="mt-1 text-[#4a5c4a]">
                  It shows when the last 30 days brought at least 30% more rain than usual (and 100mm or more) in warm weather. Standing water lets mosquitoes breed and washes dirt into water sources, so cases usually rise 2–4 weeks later. After a wetter-than-usual month, many districts meet this at the same time.
                </p>
              </div>
              <div className="rounded-xl bg-[#f6faf7] p-4">
                <p className="font-bold text-[#1a2e1a]">🐄 Animal disease</p>
                <p className="mt-1 text-[#4a5c4a]">
                  Shows after a wet, warm fortnight (40% or more above usual), when ticks, worms and foot rot spread more easily among cattle and goats.
                </p>
              </div>
              <div className="rounded-xl bg-[#f6faf7] p-4">
                <p className="font-bold text-[#1a2e1a]">🟡 Notice · 🟠 Be ready · 🔴 Warning</p>
                <p className="mt-1 text-[#4a5c4a]">
                  A notice means take simple precautions (nets, safe water, check animals). Be ready and warning mean act now. Tap <strong>Why?</strong> on a card for its numbers.
                </p>
              </div>
            </div>
          </div>
          {data &&
            Object.entries(REGIONS).map(([key, label]) => {
              const list = districts
                .filter((d) => d.region === key)
                .sort((a, b) => (SEVERITY[b.hazards?.[0]?.severity]?.rank || 0) - (SEVERITY[a.hazards?.[0]?.severity]?.rank || 0));
              if (!list.length) return null;
              return (
                <div key={key} className="mb-10">
                  <h2 className="text-xl font-bold text-[#1a2e1a] mb-4 text-center">{label}</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {list.map((d) => <DistrictCard key={d.district} d={d} />)}
                  </div>
                </div>
              );
            })}
          {data && (
            <p className="text-xs text-[#8a9a8a]">
              Updated {new Date(data.generatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}. Automatic signals are starting points; official alerts come from the KibiraAI team.
            </p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
