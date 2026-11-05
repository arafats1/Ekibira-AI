"use client";
import { useEffect, useState } from "react";

const LEVEL = {
  warning: "bg-red-600 text-white",
  watch: "bg-orange-500 text-white",
  advisory: "bg-amber-400 text-[#3b2a00]",
};
const LABEL = { warning: "Warning", watch: "Be ready", advisory: "Advisory" };

/**
 * Homepage band: KibiraAI carries the official early warnings of Uganda's
 * Department of Meteorological Services, live from its open feed.
 */
export default function OfficialBand() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/ews/official-alerts")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData({ alerts: [], error: true }));
  }, []);

  const alerts = data?.alerts || [];

  return (
    <section className="bg-[#eef6f0] border-y border-[#d5e8dc]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[1fr_1.2fr] gap-6 items-center">
        <div className="flex items-start gap-4">
          <span className="w-14 h-14 shrink-0 rounded-2xl bg-white border border-[#d5e8dc] flex items-center justify-center text-3xl">🏛️</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">Official warnings</p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1a2e1a]">From Uganda&apos;s Department of Meteorological Services</h2>
            <p className="mt-1 text-sm text-[#4a5c4a] font-[family-name:var(--font-body)]">
              KibiraAI shows the official early warnings of the Department of Meteorological Services (Ministry of Water and Environment) as they are issued, alongside our own, and we are working towards adding its official forecasts too.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#d5e8dc] p-4 sm:p-5">
          {!data ? (
            <div className="h-12 rounded-xl bg-[#f3f6f4] animate-pulse" />
          ) : alerts.length ? (
            <ul className="space-y-2">
              {alerts.slice(0, 3).map((a) => (
                <li key={a.identifier || a.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${LEVEL[a.level] || LEVEL.advisory}`}>{LABEL[a.level] || "Advisory"}</span>
                  <span className="font-semibold text-[#1a2e1a]">{a.event}</span>
                  <span className="text-[#4a5c4a]">{a.headline}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-sm text-[#1a2e1a]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              {data.error ? "Official warnings could not be checked right now." : "No active official warnings right now."}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
            <a href="/last-mile" className="text-[#2d6a4f] hover:underline">See today&apos;s warnings →</a>
            <a href="https://wids.mwe.go.ug/early-warning-alerts" target="_blank" rel="noopener noreferrer" className="text-[#2d6a4f] hover:underline">DMS warnings page →</a>
          </div>
        </div>
      </div>
    </section>
  );
}
