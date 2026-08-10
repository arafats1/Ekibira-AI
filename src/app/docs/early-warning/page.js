"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/early-warning",
    desc: "API index — endpoint catalog and product description",
  },
  {
    method: "GET",
    path: "/api/early-warning/status",
    desc: "Public metrics: facilities, stations, alert counts, modules",
  },
  {
    method: "GET",
    path: "/api/early-warning/facilities",
    desc: "Facility registry (schools & clinics). Query: type, ward, district, risk=1",
  },
  {
    method: "GET",
    path: "/api/early-warning/facilities/{id}",
    desc: "Live risk, alerts, 7-day outlook, and station telemetry for one facility",
    example: "/api/early-warning/facilities/sch-kawempe-primary",
  },
  {
    method: "GET",
    path: "/api/early-warning/thresholds",
    desc: "Child-sensitive watch / warning / critical thresholds + playbooks",
  },
  {
    method: "GET",
    path: "/api/early-warning/predictions",
    desc: "Heat-illness and vector suitability. Query: facilityId | lat,lng | batch",
    example: "/api/early-warning/predictions?facilityId=sch-bwaise-muslim",
  },
  {
    method: "GET",
    path: "/api/early-warning/stations",
    desc: "Weather/AQ stations at schools and clinics. Query: id, status, live=0",
  },
];

const MODULES = [
  { id: "facility-registry", role: "GPS-mapped schools and clinics with enrollment/catchment" },
  { id: "child-thresholds", role: "Watch / warning / critical rules for schools vs clinics" },
  { id: "heat-illness-predictor", role: "Classical heat-illness risk score (0–100) + 7-day outlook" },
  { id: "vector-suitability", role: "Malaria/vector climate suitability (not clinical diagnosis)" },
  { id: "station-telemetry", role: "School/clinic weather & AQ station readings" },
  { id: "public-apis", role: "Internet-accessible JSON APIs for dashboards and partners" },
];

const HAZARD_LABELS = {
  heat: "Heat index (°C)",
  humidity: "Humidity (%)",
  uv: "UV index",
  aqi: "European AQI",
  pm25: "PM2.5 (µg/m³)",
  flood: "Flood risk score",
  heatIllness: "Heat-illness risk score",
  vector: "Vector suitability score",
};

export default function EarlyWarningDocsPage() {
  const [thresholds, setThresholds] = useState(null);
  const [status, setStatus] = useState(null);
  const [facilityType, setFacilityType] = useState("school");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [thrRes, stRes] = await Promise.all([
          fetch("/api/early-warning/thresholds"),
          fetch("/api/early-warning/status"),
        ]);
        const thr = await thrRes.json();
        const st = await stRes.json();
        if (cancelled) return;
        if (!thrRes.ok) throw new Error(thr.error || "thresholds failed");
        setThresholds(thr);
        setStatus(st);
      } catch {
        if (!cancelled) setError("Could not load live API docs. Endpoints below still apply.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const thresholdRows = thresholds?.thresholds
    ? Object.entries(thresholds.thresholds).filter(
        ([k]) => !["version", "updatedAt"].includes(k)
      )
    : [];

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0c2d48]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🌿</span>
              <span className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
                KibiraAI
              </span>
            </Link>
            <span className="text-white/30">|</span>
            <span className="text-sky-300 text-sm font-semibold">Developer Docs</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/70">
            <Link href="/childrens-early-warning" className="hover:text-white">
              Product UI
            </Link>
            <Link href="/early-warning-status" className="hover:text-white">
              Status
            </Link>
            <a
              href="/api/early-warning"
              className="bg-sky-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-sky-600"
            >
              API Index
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <p className="text-xs font-semibold tracking-widest uppercase text-sky-700 mb-2 font-[family-name:var(--font-body)]">
          Public developer documentation
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0c2d48] font-[family-name:var(--font-display)] mb-3">
          Children&apos;s Early Warning — developer documentation
        </h1>
        <p className="text-sm text-gray-600 max-w-3xl font-[family-name:var(--font-body)] leading-relaxed mb-6">
          Open technical reference for anyone integrating with Children&apos;s Early Warning public
          APIs and data — thresholds, modules, and endpoints. Schools, clinics, and community users
          should use the product UI for day-to-day early action.
        </p>

        <div className="flex flex-wrap gap-2 mb-10 text-xs font-[family-name:var(--font-body)]">
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-semibold">
            License: MIT
          </span>
          <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full font-semibold">
            Release: {status?.openSource?.release || "v1.0.0"}
          </span>
          <a
            href="https://github.com/arafats1/Ekibira-AI"
            className="bg-white border border-sky-100 text-sky-800 px-3 py-1 rounded-full font-semibold hover:bg-sky-50"
            target="_blank"
            rel="noreferrer"
          >
            Frontend repo
          </a>
          <a
            href="https://github.com/arafats1/MarketDoc-BE"
            className="bg-white border border-sky-100 text-sky-800 px-3 py-1 rounded-full font-semibold hover:bg-sky-50"
            target="_blank"
            rel="noreferrer"
          >
            Backend repo
          </a>
        </div>

        {error && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Quick links */}
        <section className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { href: "/childrens-early-warning", title: "Product UI", desc: "Facility risks & playbooks" },
            { href: "/early-warning-status", title: "Public status", desc: "Live facility & station metrics" },
            {
              href: "https://github.com/arafats1/Ekibira-AI/blob/main/docs/EARLY_WARNING_V1.md",
              title: "System markdown",
              desc: "OSS module overview on GitHub",
              external: true,
            },
          ].map((c) =>
            c.external ? (
              <a
                key={c.href}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="bg-white rounded-2xl border border-sky-100 p-4 shadow-sm hover:border-sky-300 transition-colors"
              >
                <p className="font-bold text-[#0c2d48] font-[family-name:var(--font-display)]">{c.title}</p>
                <p className="text-xs text-gray-500 mt-1 font-[family-name:var(--font-body)]">{c.desc}</p>
              </a>
            ) : (
            <Link
              key={c.href}
              href={c.href}
              className="bg-white rounded-2xl border border-sky-100 p-4 shadow-sm hover:border-sky-300 transition-colors"
            >
              <p className="font-bold text-[#0c2d48] font-[family-name:var(--font-display)]">{c.title}</p>
              <p className="text-xs text-gray-500 mt-1 font-[family-name:var(--font-body)]">{c.desc}</p>
            </Link>
            )
          )}
        </section>

        {/* Modules */}
        <section className="bg-white rounded-2xl border border-sky-100 p-5 sm:p-6 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-[#0c2d48] mb-4 font-[family-name:var(--font-display)]">
            Open-source modules
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {MODULES.map((m) => (
              <div key={m.id} className="rounded-xl bg-[#f4f7fb] border border-sky-50 px-4 py-3">
                <p className="font-mono text-xs font-bold text-sky-800">{m.id}</p>
                <p className="text-sm text-gray-600 mt-1 font-[family-name:var(--font-body)]">{m.role}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 font-[family-name:var(--font-body)]">
            Core libraries live under <code className="bg-gray-100 px-1 rounded">src/lib/early-warning/</code>.
            See also <code className="bg-gray-100 px-1 rounded">LICENSE</code> (MIT) and{" "}
            <code className="bg-gray-100 px-1 rounded">docs/EARLY_WARNING_V1.md</code>.
          </p>
        </section>

        {/* API */}
        <section className="bg-white rounded-2xl border border-sky-100 p-5 sm:p-6 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-[#0c2d48] mb-2 font-[family-name:var(--font-display)]">
            Public API endpoints
          </h2>
          <p className="text-sm text-gray-600 mb-4 font-[family-name:var(--font-body)]">
            All listed routes return JSON. Public read endpoints require no auth. Base host: your
            deployment origin (e.g. <code className="bg-gray-100 px-1 rounded">https://www.kibiraai.com</code>).
          </p>
          <div className="space-y-3">
            {ENDPOINTS.map((ep) => (
              <div key={ep.path} className="rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    {ep.method}
                  </span>
                  <a
                    href={ep.example || ep.path.replace("{id}", "sch-kawempe-primary")}
                    className="font-mono text-xs sm:text-sm text-sky-700 hover:underline break-all"
                  >
                    {ep.path}
                  </a>
                </div>
                <p className="text-sm text-gray-600 font-[family-name:var(--font-body)]">{ep.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-[#0c2d48] text-sky-100 p-4 font-mono text-[11px] sm:text-xs overflow-x-auto">
            <p className="text-sky-300 mb-2"># Example</p>
            <p>curl https://www.kibiraai.com/api/early-warning/status</p>
            <p className="mt-1">
              curl https://www.kibiraai.com/api/early-warning/facilities/sch-kawempe-primary
            </p>
            <p className="mt-1">
              curl &quot;https://www.kibiraai.com/api/early-warning/predictions?facilityId=sch-bwaise-muslim&quot;
            </p>
          </div>
        </section>

        {/* Thresholds */}
        <section className="bg-white rounded-2xl border border-sky-100 p-5 sm:p-6 shadow-sm mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-[#0c2d48] font-[family-name:var(--font-display)]">
                Child-sensitive thresholds
              </h2>
              <p className="text-sm text-gray-600 mt-1 font-[family-name:var(--font-body)]">
                Levels: normal → watch → warning → critical. Version{" "}
                {thresholds?.version || "1.0.0"}
                {thresholds?.updatedAt ? ` · updated ${thresholds.updatedAt}` : ""}.
              </p>
            </div>
            <div className="flex gap-2">
              {["school", "clinic"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFacilityType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                    facilityType === t
                      ? "bg-[#0c2d48] text-white"
                      : "bg-sky-50 text-sky-800 hover:bg-sky-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left font-[family-name:var(--font-body)]">
              <thead>
                <tr className="text-gray-500 border-b text-xs uppercase tracking-wide">
                  <th className="py-2 pr-3">Hazard</th>
                  <th className="py-2 pr-3">Watch</th>
                  <th className="py-2 pr-3">Warning</th>
                  <th className="py-2">Critical</th>
                </tr>
              </thead>
              <tbody>
                {thresholdRows.map(([key, val]) => {
                  const bands = val?.[facilityType] || val?.school || val;
                  if (!bands?.watch && bands?.watch !== 0) return null;
                  return (
                    <tr key={key} className="border-b border-gray-50">
                      <td className="py-2.5 pr-3 font-medium text-gray-800">
                        {HAZARD_LABELS[key] || key}
                      </td>
                      <td className="py-2.5 pr-3 text-amber-700 font-semibold">{bands.watch}</td>
                      <td className="py-2.5 pr-3 text-orange-700 font-semibold">{bands.warning}</td>
                      <td className="py-2.5 text-red-700 font-semibold">{bands.critical}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3 font-[family-name:var(--font-body)]">
            Machine-readable copy:{" "}
            <a href="/api/early-warning/thresholds" className="text-sky-700 hover:underline">
              GET /api/early-warning/thresholds
            </a>
          </p>
        </section>

        {/* Integration notes */}
        <section className="bg-white rounded-2xl border border-sky-100 p-5 sm:p-6 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-[#0c2d48] mb-3 font-[family-name:var(--font-display)]">
            Integration notes
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 font-[family-name:var(--font-body)] list-disc pl-5">
            <li>
              Classical models drive heat-illness and vector suitability scores; GenAI (if used) is
              advisory only and does not trigger alerts by itself.
            </li>
            <li>
              Scores are climate / hazard foresight for facilities — not clinical diagnoses or
              individual child health records.
            </li>
            <li>
              Roadmap interoperability: FHIR / DHIS2 mapping planned; current surface is these
              public JSON APIs.
            </li>
            <li>
              PII (adult contacts for SMS/WhatsApp) is proprietary and not exposed on public
              endpoints.
            </li>
          </ul>
        </section>

        <p className="text-center text-xs text-gray-400 font-[family-name:var(--font-body)]">
          Product experience for schools &amp; clinics:{" "}
          <Link href="/childrens-early-warning" className="text-sky-700 hover:underline">
            /childrens-early-warning
          </Link>
        </p>
      </main>
    </div>
  );
}
