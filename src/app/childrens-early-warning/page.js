"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const LEVEL_STYLES = {
  critical: "bg-red-100 text-red-800 border-red-200",
  warning: "bg-orange-100 text-orange-800 border-orange-200",
  watch: "bg-amber-100 text-amber-800 border-amber-200",
  normal: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const LEVEL_DOT = {
  critical: "bg-red-500",
  warning: "bg-orange-500",
  watch: "bg-amber-500",
  normal: "bg-emerald-500",
};

function LevelBadge({ level }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${LEVEL_STYLES[level] || LEVEL_STYLES.normal}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${LEVEL_DOT[level] || LEVEL_DOT.normal}`} />
      {(level || "normal").toUpperCase()}
    </span>
  );
}

function RiskMeter({ label, value, color = "rose" }) {
  const colors = {
    rose: "bg-rose-500",
    orange: "bg-orange-500",
    violet: "bg-violet-500",
    blue: "bg-blue-500",
    sky: "bg-sky-500",
  };
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 font-[family-name:var(--font-body)]">{label}</span>
        <span className="font-bold text-gray-800 font-[family-name:var(--font-display)]">{value ?? "—"}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} transition-all duration-500`}
          style={{ width: `${Math.min(100, value || 0)}%` }}
        />
      </div>
    </div>
  );
}

export default function ChildrensEarlyWarningPage() {
  const [facilities, setFacilities] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [risk, setRisk] = useState(null);
  const [thresholds, setThresholds] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [facRes, thrRes] = await Promise.all([
          fetch("/api/early-warning/facilities"),
          fetch("/api/early-warning/thresholds"),
        ]);
        const facData = await facRes.json();
        const thrData = await thrRes.json();
        if (cancelled) return;
        setFacilities(facData.facilities || []);
        setThresholds(thrData);
        if (facData.facilities?.length) {
          setSelectedId(facData.facilities[0].id);
        }
      } catch {
        if (!cancelled) setError("Could not load facility registry.");
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadRisk = useCallback(async (id) => {
    if (!id) return;
    setLoadingRisk(true);
    setError(null);
    try {
      const res = await fetch(`/api/early-warning/facilities/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setRisk(data.risk);
    } catch {
      setError("Could not load live risk for this facility.");
      setRisk(null);
    } finally {
      setLoadingRisk(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadRisk(selectedId);
  }, [selectedId, loadRisk]);

  const filtered = useMemo(() => {
    if (filter === "all") return facilities;
    return facilities.filter((f) => f.type === filter);
  }, [facilities, filter]);

  const selected = facilities.find((f) => f.id === selectedId);
  const chartData = (risk?.outlook || []).map((d) => ({
    day: d.date?.slice(5) || d.date,
    heat: d.heatIllnessRisk,
    vector: d.vectorRisk,
  }));

  return (
    <div className="min-h-screen bg-[#faf6f5]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#4a1c2a]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🌿</span>
              <span className="font-[family-name:var(--font-display)] text-xl font-bold text-white tracking-tight">
                KibiraAI
              </span>
            </Link>
            <span className="text-white/30">|</span>
            <span className="text-rose-300 text-sm font-semibold font-[family-name:var(--font-body)]">
              Children&apos;s Early Warning
            </span>
          </div>
          <div className="hidden md:flex items-center gap-5 text-sm font-medium text-white/70">
            <Link href="/early-warning-status" className="hover:text-white transition-colors">
              Public Status
            </Link>
            <Link href="/urban-warning" className="hover:text-white transition-colors">
              Urban Warning
            </Link>
            <Link
              href="/api/early-warning"
              className="bg-rose-500 text-white px-4 py-2 rounded-full hover:bg-rose-600 transition-colors font-semibold text-sm"
            >
              Open API
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-24 pb-8 px-4 sm:px-6 bg-gradient-to-br from-[#4a1c2a] via-[#6b2d3c] to-[#2d1a24]">
        <div className="max-w-7xl mx-auto">
          <p className="text-rose-300 text-xs font-semibold tracking-widest uppercase mb-2 font-[family-name:var(--font-body)]">
            Area 2 · Early warning, early action
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-[family-name:var(--font-display)] mb-3 max-w-3xl leading-tight">
            Climate alerts for schools, clinics &amp; community leaders
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-2xl font-[family-name:var(--font-body)] leading-relaxed">
            Hyper-local heat, humidity, UV, air quality, flood, heat-illness and vector risk — with
            child-sensitive thresholds and anticipatory playbooks for the people closest to children.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs sm:text-sm font-[family-name:var(--font-body)]">
            <span className="bg-white/10 text-white/90 px-3 py-1.5 rounded-full">
              {facilities.length} facilities registered
            </span>
            <span className="bg-white/10 text-white/90 px-3 py-1.5 rounded-full">
              {facilities.filter((f) => f.hasStation).length} weather/AQ stations
            </span>
            <span className="bg-white/10 text-white/90 px-3 py-1.5 rounded-full">
              MIT open-source v1.0
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Facility list */}
        <aside className="bg-white rounded-2xl border border-[#ead9dc] shadow-sm overflow-hidden h-fit lg:sticky lg:top-24">
          <div className="p-4 border-b border-[#f0e4e6]">
            <h2 className="font-bold text-[#4a1c2a] font-[family-name:var(--font-display)]">
              Facility registry
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-[family-name:var(--font-body)]">
              Schools &amp; health facilities
            </p>
            <div className="flex gap-2 mt-3">
              {["all", "school", "clinic"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors font-[family-name:var(--font-body)] ${
                    filter === t
                      ? "bg-[#4a1c2a] text-white"
                      : "bg-[#faf6f5] text-gray-600 hover:bg-[#f0e4e6]"
                  }`}
                >
                  {t === "all" ? "All" : t === "school" ? "Schools" : "Clinics"}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {loadingList && (
              <p className="p-4 text-sm text-gray-500 font-[family-name:var(--font-body)]">Loading facilities…</p>
            )}
            {filtered.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                className={`w-full text-left px-4 py-3 border-b border-[#f5ecee] transition-colors ${
                  selectedId === f.id ? "bg-rose-50" : "hover:bg-[#faf6f5]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#2a1520] font-[family-name:var(--font-body)] leading-snug">
                      {f.name}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-[family-name:var(--font-body)]">
                      {f.type === "school" ? "🏫" : "🏥"} {f.ward} ·{" "}
                      {f.type === "school"
                        ? `${f.enrollment} children`
                        : `catchment ~${(f.catchment / 1000).toFixed(0)}k`}
                    </p>
                  </div>
                  {f.hasStation && (
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                      SENSOR
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Detail panel */}
        <main className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 font-[family-name:var(--font-body)]">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#ead9dc] shadow-sm p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#4a1c2a] font-[family-name:var(--font-display)]">
                  {selected?.name || "Select a facility"}
                </h2>
                {selected && (
                  <p className="text-sm text-gray-500 mt-1 font-[family-name:var(--font-body)]">
                    {selected.ward}, {selected.district} · {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
                  </p>
                )}
              </div>
              {risk && <LevelBadge level={risk.alertLevel} />}
            </div>

            <div className="flex flex-wrap gap-2 mb-5 border-b border-[#f0e4e6] pb-3">
              {[
                ["overview", "Overview"],
                ["predictions", "Predictions"],
                ["station", "Station"],
                ["playbooks", "Playbooks"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors font-[family-name:var(--font-body)] ${
                    tab === key ? "bg-[#4a1c2a] text-white" : "text-gray-600 hover:bg-[#faf6f5]"
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => loadRisk(selectedId)}
                className="ml-auto px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 font-[family-name:var(--font-body)]"
              >
                Refresh live data
              </button>
            </div>

            {loadingRisk && (
              <div className="flex items-center gap-3 text-rose-700 py-10 justify-center">
                <div className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-[family-name:var(--font-body)]">
                  Fetching weather, AQI, flood &amp; health risk…
                </span>
              </div>
            )}

            {!loadingRisk && risk && tab === "overview" && (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Heat index", value: `${risk.readings.heatIndex}°C`, sub: `Air ${risk.readings.temperature}°C` },
                    { label: "Humidity", value: `${risk.readings.humidity}%`, sub: "Relative" },
                    { label: "UV index", value: risk.readings.uvIndex, sub: "Peak exposure" },
                    { label: "EU AQI", value: risk.readings.aqi, sub: `PM2.5 ${risk.readings.pm25}` },
                  ].map((c) => (
                    <div key={c.label} className="rounded-xl bg-[#faf6f5] border border-[#f0e4e6] p-3">
                      <p className="text-[11px] text-gray-500 font-[family-name:var(--font-body)]">{c.label}</p>
                      <p className="text-2xl font-bold text-[#4a1c2a] font-[family-name:var(--font-display)]">{c.value}</p>
                      <p className="text-[11px] text-gray-400 font-[family-name:var(--font-body)]">{c.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <RiskMeter label="Heat-illness risk" value={risk.readings.heatIllnessRisk} color="rose" />
                  <RiskMeter label="Vector suitability" value={risk.readings.vectorRisk} color="violet" />
                  <RiskMeter label="Flood risk" value={risk.readings.floodRisk} color="blue" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#4a1c2a] mb-2 font-[family-name:var(--font-display)]">
                    Active alerts
                  </h3>
                  {risk.alerts.length === 0 ? (
                    <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 font-[family-name:var(--font-body)]">
                      All child-sensitive thresholds are within normal range.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {risk.alerts.map((a) => (
                        <div
                          key={a.hazard}
                          className={`rounded-xl border px-4 py-3 ${LEVEL_STYLES[a.level]}`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-bold font-[family-name:var(--font-body)]">
                              {a.hazard} · {a.value} {a.unit}
                            </p>
                            <LevelBadge level={a.level} />
                          </div>
                          {a.actions?.[0] && (
                            <p className="text-xs opacity-90 font-[family-name:var(--font-body)]">{a.actions[0]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-gray-400 font-[family-name:var(--font-body)]">
                  Sources: {risk.dataSources?.weather}, {risk.dataSources?.airQuality},{" "}
                  {risk.dataSources?.models}. Updated {new Date(risk.generatedAt).toLocaleString()}.
                </p>
              </div>
            )}

            {!loadingRisk && risk && tab === "predictions" && (
              <div className="space-y-5">
                <p className="text-sm text-gray-600 font-[family-name:var(--font-body)]">
                  7-day predictive outlook for heat-illness risk and vector/malaria climate suitability
                  at this facility.
                </p>
                {risk.dataSources?.outlook === "synthetic-7-day" && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 font-[family-name:var(--font-body)]">
                    Showing model outlook (live daily forecast unavailable). Values use current readings +
                    facility microclimate. Refresh to retry Open-Meteo.
                  </p>
                )}
                {chartData.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0e4e6" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="heat" name="Heat illness" stroke="#e11d48" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="vector" name="Vector risk" stroke="#7c3aed" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Outlook unavailable — try refresh.</p>
                )}
                {(risk.outlook || []).length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left font-[family-name:var(--font-body)]">
                    <thead>
                      <tr className="text-gray-500 border-b border-[#f0e4e6]">
                        <th className="py-2 pr-3">Date</th>
                        <th className="py-2 pr-3">Temp</th>
                        <th className="py-2 pr-3">Rain</th>
                        <th className="py-2 pr-3">UV</th>
                        <th className="py-2 pr-3">Heat illness</th>
                        <th className="py-2">Vector</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(risk.outlook || []).map((d) => (
                        <tr key={d.date} className="border-b border-[#faf6f5]">
                          <td className="py-2 pr-3 font-medium">{d.date}</td>
                          <td className="py-2 pr-3">{d.tempHigh}°C</td>
                          <td className="py-2 pr-3">{d.rainfall}mm</td>
                          <td className="py-2 pr-3">{d.uvIndex}</td>
                          <td className="py-2 pr-3 font-bold text-rose-700">{d.heatIllnessRisk}</td>
                          <td className="py-2 font-bold text-violet-700">{d.vectorRisk}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            )}

            {!loadingRisk && risk && tab === "station" && (
              <div className="space-y-4">
                {!risk.station ? (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-6 text-sm text-amber-800 font-[family-name:var(--font-body)]">
                    No weather/AQ station installed at this facility yet. Coverage expands as DePIN
                    sensors are deployed at schools and clinics.
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-bold text-[#4a1c2a] font-[family-name:var(--font-display)]">
                        {risk.station.name}
                      </h3>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          risk.station.status === "online"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {risk.station.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-[family-name:var(--font-body)]">
                      Sensors: {risk.station.sensors.join(", ")} · Installed {risk.station.installedAt} ·
                      Source {risk.station.telemetry.source}
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        ["Temperature", `${risk.station.telemetry.temperature}°C`],
                        ["Humidity", `${risk.station.telemetry.humidity}%`],
                        ["PM2.5", risk.station.telemetry.pm25 != null ? `${risk.station.telemetry.pm25} µg/m³` : "—"],
                        ["PM10", risk.station.telemetry.pm10 != null ? `${risk.station.telemetry.pm10} µg/m³` : "—"],
                        ["UV", risk.station.telemetry.uvIndex ?? "—"],
                        ["AQI", risk.station.telemetry.aqi],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-xl border border-[#f0e4e6] bg-[#faf6f5] p-3">
                          <p className="text-[11px] text-gray-500">{k}</p>
                          <p className="text-xl font-bold text-[#4a1c2a] font-[family-name:var(--font-display)]">{v}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Last reading {new Date(risk.station.telemetry.recordedAt).toLocaleString()} (5‑min
                      interval model)
                    </p>
                  </>
                )}
              </div>
            )}

            {!loadingRisk && tab === "playbooks" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 font-[family-name:var(--font-body)] mb-2">
                  Anticipatory action playbooks tied to child-sensitive thresholds
                  {thresholds ? ` (v${thresholds.version})` : ""}.
                </p>
                {(thresholds?.playbooks || []).map((pb) => (
                  <details
                    key={pb.id}
                    className="rounded-xl border border-[#ead9dc] bg-[#faf6f5] px-4 py-3"
                    open={risk?.alerts?.some((a) => a.playbookId === pb.id)}
                  >
                    <summary className="cursor-pointer font-semibold text-sm text-[#4a1c2a] font-[family-name:var(--font-body)]">
                      {pb.title}
                    </summary>
                    <div className="mt-3 grid sm:grid-cols-3 gap-3 text-xs font-[family-name:var(--font-body)]">
                      {["watch", "warning", "critical"].map((lvl) => (
                        <div key={lvl}>
                          <p className="font-bold uppercase text-[10px] tracking-wide mb-1 text-gray-500">
                            {lvl}
                          </p>
                          <ul className="space-y-1 text-gray-700">
                            {(pb.actions?.[lvl] || []).map((act, i) => (
                              <li key={i}>• {act}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
                {thresholds?.thresholds && (
                  <div className="mt-4 rounded-xl border border-[#ead9dc] p-4">
                    <h4 className="text-sm font-bold text-[#4a1c2a] mb-2 font-[family-name:var(--font-display)]">
                      Threshold snapshot ({selected?.type || "school"})
                    </h4>
                    <pre className="text-[11px] overflow-x-auto text-gray-600 font-mono">
                      {JSON.stringify(
                        Object.fromEntries(
                          Object.entries(thresholds.thresholds)
                            .filter(([k]) => !["version", "updatedAt"].includes(k))
                            .map(([k, v]) => [k, v[selected?.type === "clinic" ? "clinic" : "school"] || v])
                        ),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
