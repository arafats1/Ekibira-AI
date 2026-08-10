"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EarlyWarningNav from "../components/EarlyWarningNav";

const LEVEL_STYLES = {
  critical: "bg-red-100 text-red-800",
  warning: "bg-orange-100 text-orange-800",
  watch: "bg-amber-100 text-amber-800",
  normal: "bg-emerald-100 text-emerald-800",
};

export default function EarlyWarningStatusPage() {
  const [data, setData] = useState(null);
  const [stations, setStations] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, stnRes] = await Promise.all([
        fetch("/api/early-warning/status"),
        fetch("/api/early-warning/stations?live=0"),
      ]);
      const status = await statusRes.json();
      const stn = await stnRes.json();
      if (!statusRes.ok) throw new Error(status.error || "Status failed");
      setData(status);
      setStations(stn);
    } catch {
      setError("Could not load public status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <EarlyWarningNav
        title="Public Status"
        theme="sky"
        links={[
          { href: "/docs/early-warning", label: "Developer Docs" },
          { href: "/childrens-early-warning", label: "Children's UI" },
          { href: "/urban-warning", label: "Urban Warning" },
          { href: "/docs/early-warning", label: "API Docs", cta: true },
        ]}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0c2d48] font-[family-name:var(--font-display)] mb-2">
            Live early warning tracker
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl font-[family-name:var(--font-body)]">
            Internet-accessible real-time metrics for UNICEF reporting — facilities, sensors, alert
            levels, and open API endpoints. Auto-refreshes every 60 seconds.
          </p>
          {data && (
            <p className="text-xs text-gray-400 mt-2 font-[family-name:var(--font-body)]">
              Open source {data.openSource?.release} · {data.openSource?.license} · Updated{" "}
              {new Date(data.generatedAt).toLocaleString()}
            </p>
          )}
        </div>

        {loading && !data && (
          <div className="flex items-center gap-3 text-sky-700 py-16 justify-center">
            <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading public metrics…</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Facilities", value: data.facilities.total, sub: `${data.facilities.schools} schools · ${data.facilities.clinics} clinics` },
                { label: "Children covered", value: data.facilities.childrenCovered.toLocaleString(), sub: "School enrollment proxy" },
                { label: "Stations online", value: `${data.stations.online}/${data.stations.total}`, sub: `${data.stations.uptimePct}% uptime` },
                { label: "Active alerts", value: (data.alerts.critical || 0) + (data.alerts.warning || 0) + (data.alerts.watch || 0), sub: `${data.alerts.critical || 0} critical · ${data.alerts.warning || 0} warning` },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-2xl border border-sky-100 p-5 shadow-sm">
                  <p className="text-xs text-gray-500 font-[family-name:var(--font-body)]">{c.label}</p>
                  <p className="text-3xl font-bold text-[#0c2d48] font-[family-name:var(--font-display)] mt-1">
                    {c.value}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 font-[family-name:var(--font-body)]">{c.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <section className="bg-white rounded-2xl border border-sky-100 p-5 shadow-sm">
                <h2 className="font-bold text-[#0c2d48] mb-3 font-[family-name:var(--font-display)]">
                  Alert levels
                </h2>
                <div className="space-y-2">
                  {Object.entries(data.alerts).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${LEVEL_STYLES[level]}`}>
                        {level.toUpperCase()}
                      </span>
                      <div className="flex-1 mx-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500"
                          style={{
                            width: `${Math.min(100, (count / Math.max(1, data.facilities.total)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-700 w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-sky-100 p-5 shadow-sm">
                <h2 className="font-bold text-[#0c2d48] mb-3 font-[family-name:var(--font-display)]">
                  Top facility alerts
                </h2>
                <div className="space-y-2">
                  {(data.topAlerts || []).length === 0 && (
                    <p className="text-sm text-emerald-700">No elevated alerts in model snapshot.</p>
                  )}
                  {(data.topAlerts || []).map((a) => (
                    <Link
                      key={a.facilityId}
                      href="/childrens-early-warning"
                      className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2 hover:bg-sky-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800 font-[family-name:var(--font-body)]">
                          {a.name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {a.ward} · heat {a.heatIllnessRisk} · vector {a.vectorRisk}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${LEVEL_STYLES[a.alertLevel]}`}>
                        {a.alertLevel}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <section className="bg-white rounded-2xl border border-sky-100 p-5 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-[#0c2d48] font-[family-name:var(--font-display)]">
                  Weather / AQ stations
                </h2>
                <button
                  onClick={load}
                  className="text-xs font-semibold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-full hover:bg-sky-100"
                >
                  Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left font-[family-name:var(--font-body)]">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="py-2 pr-3">Station</th>
                      <th className="py-2 pr-3">Facility</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Temp</th>
                      <th className="py-2 pr-3">Humidity</th>
                      <th className="py-2 pr-3">PM2.5</th>
                      <th className="py-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stations?.stations || []).map((s) => (
                      <tr key={s.id} className="border-b border-gray-50">
                        <td className="py-2 pr-3 font-medium">{s.id}</td>
                        <td className="py-2 pr-3">{s.facilityName}</td>
                        <td className="py-2 pr-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              s.status === "online"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2 pr-3">{s.telemetry?.temperature}°C</td>
                        <td className="py-2 pr-3">{s.telemetry?.humidity}%</td>
                        <td className="py-2 pr-3">{s.telemetry?.pm25 ?? "—"}</td>
                        <td className="py-2 text-gray-400">
                          {s.telemetry?.recordedAt
                            ? new Date(s.telemetry.recordedAt).toLocaleTimeString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-sky-100 p-5 shadow-sm">
              <h2 className="font-bold text-[#0c2d48] mb-3 font-[family-name:var(--font-display)]">
                Developer documentation
              </h2>
              <p className="text-sm text-gray-600 mb-4 font-[family-name:var(--font-body)]">
                Full API reference, threshold tables, and open-source modules for anyone building on
                Children&apos;s Early Warning public data.
              </p>
              <Link
                href="/docs/early-warning"
                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2.5 rounded-full"
              >
                Open developer docs →
              </Link>
              <p className="text-xs text-gray-500 mt-4 font-[family-name:var(--font-body)]">
                Modules: {(data.openSource?.modules || []).join(" · ")}
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
