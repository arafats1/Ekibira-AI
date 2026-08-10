"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ─── Quick-select presets for demo (Kampala neighborhoods) ───
const PRESET_LOCATIONS = [
  { label: "Bwaise, Kampala", query: "Bwaise neighborhood, Kampala, Uganda" },
  { label: "Katanga, Kampala", query: "Katanga slum, Kampala Central, Uganda" },
  { label: "Namuwongo, Kampala", query: "Namuwongo settlement, Makindye, Kampala, Uganda" },
  { label: "Kalerwe, Kampala", query: "Kalerwe market area, Kawempe, Kampala, Uganda" },
  { label: "Kisenyi, Kampala", query: "Kisenyi, Kampala Central, Uganda" },
];

// ─── Risk gauge component ───
function RiskGauge({ value, label, type }) {
  const getColor = (v) => {
    if (v >= 80) return { ring: "stroke-red-500", bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100 text-red-700", level: "Critical" };
    if (v >= 60) return { ring: "stroke-orange-500", bg: "bg-orange-50", text: "text-orange-700", badge: "bg-orange-100 text-orange-700", level: "High" };
    if (v >= 40) return { ring: "stroke-yellow-500", bg: "bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700", level: "Moderate" };
    return { ring: "stroke-green-500", bg: "bg-green-50", text: "text-green-700", badge: "bg-green-100 text-green-700", level: "Low" };
  };
  const c = getColor(value);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={`${c.bg} rounded-2xl p-5 flex flex-col items-center`}>
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54" fill="none" strokeWidth="8"
            className={c.ring}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${c.text} font-[family-name:var(--font-display)]`}>{value}</span>
          <span className="text-[10px] text-gray-500">/100</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-800 mt-3 font-[family-name:var(--font-display)]">{label}</p>
      <span className={`text-xs font-semibold px-3 py-1 rounded-full mt-2 ${c.badge}`}>{c.level} Risk</span>
    </div>
  );
}

// ─── Weather icon ───
function WeatherIcon({ condition }) {
  const icons = {
    "Sunny": "☀️",
    "Partly Cloudy": "⛅",
    "Overcast": "☁️",
    "Light Rain": "🌦️",
    "Heavy Rain": "🌧️",
    "Thunderstorm": "⛈️",
  };
  return <span className="text-3xl">{icons[condition] || "🌤️"}</span>;
}

// ─── Main page ───
export default function UrbanWarningPage() {
  const [selectedArea, setSelectedArea] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [alertSent, setAlertSent] = useState(false);
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analyzedLocations, setAnalyzedLocations] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const mapRef = useRef(null);

  // Load persisted locations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("kibira-urban-locations");
      if (stored) {
        const locations = JSON.parse(stored);
        if (Array.isArray(locations) && locations.length > 0) {
          setAnalyzedLocations(locations);
          setSelectedArea(locations[0]);
        }
      }
    } catch {}
    setLoaded(true);
  }, []);

  // Persist analyzed locations to localStorage
  useEffect(() => {
    if (!loaded) return;
    try {
      if (analyzedLocations.length > 0) {
        localStorage.setItem("kibira-urban-locations", JSON.stringify(analyzedLocations));
      } else {
        localStorage.removeItem("kibira-urban-locations");
      }
    } catch {}
  }, [analyzedLocations, loaded]);

  // When area changes, update forecast and reset alerts
  useEffect(() => {
    if (!selectedArea) return;
    if (selectedArea.forecast && selectedArea.forecast.length > 0) {
      setForecast(selectedArea.forecast);
    }
    setAlertSent(false);
    setShowActionPlan(false);
    setSimulationResult(null);
    setActiveTab("overview");
  }, [selectedArea]);

  // Analyze a location using AI
  const analyzeLocation = async (locationQuery) => {
    if (!locationQuery.trim()) return;

    setAnalyzing(true);
    setAnalysisError("");
    setSelectedArea(null);

    try {
      const res = await fetch("/api/urban-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: locationQuery.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAnalysisError(data.error || "Analysis failed. Please try again.");
        return;
      }

      const area = {
        id: data.analysis.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        ...data.analysis,
      };

      // Add to analyzed locations if not already there
      setAnalyzedLocations((prev) => {
        const exists = prev.find((a) => a.id === area.id);
        if (exists) return prev;
        return [area, ...prev].slice(0, 10); // Keep last 10
      });

      setSelectedArea(area);
      setSearchQuery("");
    } catch {
      setAnalysisError("Network error. Please check your connection and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    analyzeLocation(searchQuery);
  };

  const hasFloodWarning = forecast.some((d) => d.floodTrigger);
  const maxRainfall = Math.max(...forecast.map((d) => Number(d.rainfall) || 0));
  const avgHumidity = forecast.length > 0 ? Math.round(forecast.reduce((s, d) => s + d.humidity, 0) / forecast.length) : 0;

  // ─── Download helpers ───
  const downloadCSV = (data, filename) => {
    const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadRiskReport = () => {
    if (!selectedArea) return;
    const headers = "Neighborhood,City,Country,Population,Flood Risk,Heat Risk,Elevation,Drainage,Flood History,Heat Drivers\n";
    const row = `"${selectedArea.name}","${selectedArea.city || ""}","${selectedArea.country || ""}","${selectedArea.population}",${selectedArea.floodRisk},${selectedArea.heatRisk},"${selectedArea.elevation}","${selectedArea.drainage}","${selectedArea.floodHistory}","${selectedArea.heatDrivers}"`;
    downloadCSV(headers + row, `kibira-urban-risk-report-${selectedArea.id}-${new Date().toISOString().slice(0,10)}.csv`);
  };

  const downloadActionPlan = () => {
    if (!selectedArea) return;
    const report = [
      `Action Plan — ${selectedArea.name}, ${selectedArea.division || selectedArea.city || ""}, ${selectedArea.country || ""}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Flood Risk: ${selectedArea.floodRisk}/100, Heat Risk: ${selectedArea.heatRisk}/100`,
      "",
      "INTERVENTIONS",
      ...selectedArea.interventions.map((int, i) => `${i+1}. ${int}`),
      "",
      "TREE PLANTING PRESCRIPTION",
      "Species,Count,Purpose",
      ...selectedArea.treeRecommendations.map((t) => `"${t.name}",${t.count},"${t.purpose}"`),
      "",
      "FORECAST (5-day)",
      "Date,Condition,High°C,Low°C,Rainfall mm,Humidity %,Flood Trigger",
      ...forecast.map((d) => `"${d.date}","${d.condition}",${d.tempHigh},${d.tempLow},${d.rainfall},${d.humidity},${d.floodTrigger}`),
    ].join("\n");
    downloadCSV(report, `kibira-action-plan-${selectedArea.id}-${new Date().toISOString().slice(0,10)}.csv`);
  };

  const simulateAlert = () => {
    if (!selectedArea) return;
    setSimulating(true);
    const popNum = parseInt(String(selectedArea.population).replace(/[^0-9]/g, "")) || 10000;
    setTimeout(() => {
      setSimulating(false);
      setAlertSent(true);
      setSimulationResult({
        recipients: Math.floor(popNum * 0.6),
        channels: ["SMS", "WhatsApp", "Community Leaders"],
        message: `⚠️ EARLY WARNING — ${selectedArea.name}: Elevated climate risk in the next 24-48 hours. Flood risk: ${selectedArea.floodRisk}/100 · Heat risk: ${selectedArea.heatRisk}/100. Move valuables to higher ground if flooding is likely. Protect children from extreme heat. Stay tuned for updates. — KibiraAI`,
        timestamp: (() => { const d = new Date(); return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; })(),
      });
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <header className="fixed top-0 left-0 right-0 z-50">
        <nav className="bg-[#0c2d48]/95 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl">🌿</span>
                <span className="font-[family-name:var(--font-display)] text-xl font-bold text-white tracking-tight">
                  KibiraAI
                </span>
              </Link>
              <span className="text-white/30">|</span>
              <span className="text-blue-400 text-sm font-semibold font-[family-name:var(--font-body)]">Early Warning</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
              <Link href="/solution" className="hover:text-white transition-colors">← Back to Solutions</Link>
              <Link href="/plant-a-tree" className="hover:text-white transition-colors">🌱 Plant a Tree</Link>
              <Link href="/advisor" className="hover:text-white transition-colors">Dr. Kibira AI</Link>
              <Link href="/" className="bg-blue-500 text-white px-5 py-2 rounded-full hover:bg-blue-600 transition-colors font-semibold text-sm">
                Home
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="pt-20 sm:pt-24 pb-20">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0c2d48] to-[#1a1a2e] py-12 sm:py-16 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-8 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse-soft" />
                  <span className="text-blue-400 text-xs font-semibold tracking-widest uppercase font-[family-name:var(--font-body)]">
                    Urban Climate · Children&apos;s Health
                  </span>
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 font-[family-name:var(--font-display)]">
                  Urban Heat &amp; Flood
                  <br />
                  <span className="text-blue-400">Early Warning</span>
                </h1>
                <p className="text-white/70 text-lg max-w-xl mb-8 font-[family-name:var(--font-body)]">
                  Enter any location for AI-generated flood, heat, and air-quality risk analysis —
                  plus interventions and children&rsquo;s climate–health guidance for communities,
                  schools, and clinics. Free for everyone — no signup required.
                </p>

                {/* ─── Location Search ─── */}
                <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-xl">
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">📍</span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter any location — e.g. Kibera, Nairobi or Accra, Ghana..."
                      className="w-full pl-10 pr-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-sm font-[family-name:var(--font-body)]"
                      disabled={analyzing}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={analyzing || !searchQuery.trim()}
                    className="px-6 py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all font-[family-name:var(--font-body)] flex items-center gap-2 whitespace-nowrap"
                  >
                    {analyzing ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>Analyze</>
                    )}
                  </button>
                </form>

                {analysisError && (
                  <div className="mt-3 bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 text-red-300 text-sm font-[family-name:var(--font-body)]">
                    {analysisError}
                  </div>
                )}

                {/* Quick-select presets */}
                <div className="mt-4">
                  <p className="text-white/40 text-xs font-semibold mb-2 font-[family-name:var(--font-body)]">QUICK ANALYZE</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_LOCATIONS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => analyzeLocation(preset.query)}
                        disabled={analyzing}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all font-[family-name:var(--font-body)] disabled:opacity-50"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-blue-400 font-[family-name:var(--font-display)]">{analyzedLocations.length || "∞"}</p>
                  <p className="text-white/50 text-[10px] sm:text-xs mt-1 font-[family-name:var(--font-body)]">{analyzedLocations.length ? "Locations Analyzed" : "Any Location"}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-red-400 font-[family-name:var(--font-display)]">Kibira AI</p>
                  <p className="text-white/50 text-[10px] sm:text-xs mt-1 font-[family-name:var(--font-body)]">AI Engine</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-green-400 font-[family-name:var(--font-display)]">72h</p>
                  <p className="text-white/50 text-[10px] sm:text-xs mt-1 font-[family-name:var(--font-body)]">Advance Warning</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* ─── AI Loading State ─── */}
          {analyzing && (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-2xl">🌍</span>
              </div>
              <p className="text-xl font-bold text-gray-800 font-[family-name:var(--font-display)]">Analyzing Location...</p>
              <p className="text-sm text-gray-500 mt-2 font-[family-name:var(--font-body)]">
                AI is generating flood risk, heat risk, air quality, interventions, and 5-day forecast
              </p>
              <div className="mt-6 flex items-center gap-3 text-xs text-gray-400 font-[family-name:var(--font-body)]">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" /> Evaluating terrain</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} /> Measuring air quality</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: "0.6s" }} /> Calculating risk</span>
              </div>
            </div>
          )}

          {/* ─── Empty State (no location selected yet) ─── */}
          {!analyzing && !selectedArea && (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <span className="text-6xl mb-6">🗺️</span>
              <h2 className="text-2xl font-bold text-gray-800 font-[family-name:var(--font-display)]">Enter a Location to Begin</h2>
              <p className="text-gray-500 mt-2 max-w-md text-center font-[family-name:var(--font-body)]">
                Search any neighborhood or city. Our AI generates flood and heat risk scores, interventions, and children&apos;s climate–health guidance.
              </p>
              <div className="mt-8 grid sm:grid-cols-3 gap-4 max-w-2xl">
                {[
                  { icon: "🌊", title: "Flood Risk", desc: "Drainage, elevation, and historical flood pattern analysis" },
                  { icon: "🌡️", title: "Heat & Health", desc: "Urban heat islands plus children's heat-illness foresight" },
                  { icon: "💨", title: "Air & Action", desc: "AQI cues and anticipatory playbooks for communities" },
                ].map((card) => (
                  <div key={card.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                    <span className="text-3xl">{card.icon}</span>
                    <p className="text-sm font-bold text-gray-800 mt-3 font-[family-name:var(--font-display)]">{card.title}</p>
                    <p className="text-xs text-gray-500 mt-1 font-[family-name:var(--font-body)]">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Results UI ─── */}
          {!analyzing && selectedArea && (<>

          {/* Analyzed locations selector */}
          {analyzedLocations.length > 0 && (
            <div className="mb-8">
              <p className="text-sm font-semibold text-gray-500 mb-3 font-[family-name:var(--font-body)]">ANALYZED LOCATIONS</p>
              <div className="flex flex-wrap gap-2">
                {analyzedLocations.map((area) => {
                  const isActive = selectedArea.id === area.id;
                  const maxRisk = Math.max(area.floodRisk, area.heatRisk);
                  const dotColor = maxRisk >= 80 ? "bg-red-500" : maxRisk >= 60 ? "bg-orange-500" : "bg-yellow-500";
                  return (
                    <button
                      key={area.id}
                      onClick={() => setSelectedArea(area)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all font-[family-name:var(--font-body)]
                        ${isActive
                          ? "bg-[#0c2d48] text-white shadow-lg shadow-[#0c2d48]/30"
                          : "bg-white text-gray-700 border border-gray-200 hover:border-[#0c2d48]/30 hover:shadow-sm"
                        }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-blue-400" : dotColor} ${maxRisk >= 80 ? "animate-pulse" : ""}`} />
                      {area.name}
                      <span className={`text-xs ${isActive ? "text-white/60" : "text-gray-400"}`}>{area.city || area.division || ""}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
            {[
              { key: "overview", label: "Risk Overview", icon: "📊" },
              { key: "airquality", label: "Air Quality", icon: "🏭" },
              { key: "forecast", label: "Forecast", icon: "🌦️" },
              { key: "action", label: "Action Plan", icon: "📋" },
              { key: "summary", label: "Summary", icon: "📄" },
              { key: "alert", label: "Send Alert", icon: "🚨" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all font-[family-name:var(--font-body)] whitespace-nowrap flex-shrink-0
                  ${activeTab === tab.key ? "bg-white text-[#0c2d48] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ═══ TAB: OVERVIEW ═══ */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              {/* Data source + download bar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                {selectedArea.dataSources && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold font-[family-name:var(--font-body)]">Data:</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold font-[family-name:var(--font-body)]">
                      🌤️ {selectedArea.dataSources.weather}
                    </span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold font-[family-name:var(--font-body)]">
                      🌊 {selectedArea.dataSources.flood}
                    </span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold font-[family-name:var(--font-body)]">
                      🤖 {selectedArea.dataSources.analysis}
                    </span>
                    {selectedArea.dataSources.airQuality && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold font-[family-name:var(--font-body)]">
                        🏭 {selectedArea.dataSources.airQuality}
                      </span>
                    )}
                  </div>
                )}
                <button
                  onClick={downloadRiskReport}
                  className="text-xs bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full font-semibold hover:bg-gray-50 transition-colors font-[family-name:var(--font-body)] flex items-center gap-1.5 shadow-sm"
                >
                  📥 Download Risk Report (CSV)
                </button>
              </div>
              {/* Risk Gauges */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <RiskGauge value={selectedArea.floodRisk} label="Flood Risk" type="flood" />
                <RiskGauge value={selectedArea.heatRisk} label="Heat Risk" type="heat" />
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3 font-[family-name:var(--font-body)]">Population</p>
                  <p className="text-3xl font-bold text-[#0c2d48] font-[family-name:var(--font-display)]">{selectedArea.population}</p>
                  <p className="text-sm text-gray-500 mt-2 font-[family-name:var(--font-body)]">{selectedArea.division || selectedArea.city || ""}</p>
                  <p className="text-xs text-gray-400 mt-1 font-[family-name:var(--font-body)]">Elevation: {selectedArea.elevation}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3 font-[family-name:var(--font-body)]">Drainage Quality</p>
                  <p className="text-sm font-semibold text-gray-800 font-[family-name:var(--font-body)]">{selectedArea.drainage}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1 font-[family-name:var(--font-body)]">Flood History</p>
                    <p className="text-xs text-gray-600 font-[family-name:var(--font-body)]">{selectedArea.floodHistory}</p>
                  </div>
                </div>
              </div>

              {/* Location & Heat Drivers */}
              <div className="grid lg:grid-cols-2 gap-4">
                {/* Map placeholder */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-800 font-[family-name:var(--font-display)]">📍 Location — {selectedArea.name}, {selectedArea.city || selectedArea.division || ""}</p>
                  </div>
                  <div ref={mapRef} className="relative h-64 bg-gradient-to-br from-[#1a5276] to-[#154360]">
                    {/* Stylized map visualization */}
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                      backgroundSize: "20px 20px"
                    }} />
                    
                    {/* Neighborhood dots */}
                    {analyzedLocations.length > 1 ? (
                      (() => {
                        const lats = analyzedLocations.map((n) => n.lat || 0);
                        const lngs = analyzedLocations.map((n) => n.lng || 0);
                        const minLat = Math.min(...lats);
                        const maxLat = Math.max(...lats);
                        const minLng = Math.min(...lngs);
                        const maxLng = Math.max(...lngs);
                        const latRange = maxLat - minLat || 0.06;
                        const lngRange = maxLng - minLng || 0.06;
                        return analyzedLocations.map((n) => {
                          const x = 15 + ((n.lng - minLng) / lngRange) * 70;
                          const y = 85 - ((n.lat - minLat) / latRange) * 70;
                          const isSelected = n.id === selectedArea.id;
                          const risk = Math.max(n.floodRisk, n.heatRisk);
                          const color = risk >= 80 ? "#ef4444" : risk >= 60 ? "#f97316" : "#eab308";
                          return (
                            <div
                              key={n.id}
                              className="absolute transition-all duration-500"
                              style={{ left: `${Math.min(85, Math.max(10, x))}%`, top: `${Math.min(85, Math.max(10, y))}%` }}
                            >
                              {isSelected && (
                                <div className="absolute -inset-4 rounded-full animate-ping" style={{ backgroundColor: `${color}30` }} />
                              )}
                              <div
                                className={`relative rounded-full border-2 border-white cursor-pointer transition-all ${isSelected ? "w-5 h-5 shadow-lg" : "w-3 h-3 opacity-60 hover:opacity-100"}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setSelectedArea(n)}
                              />
                              {isSelected && (
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/95 rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap">
                                  <p className="text-xs font-bold text-gray-800">{n.name}</p>
                                  <p className="text-[10px] text-gray-500">{(n.lat || 0).toFixed(4)}°N, {(n.lng || 0).toFixed(4)}°E</p>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()
                    ) : (
                      /* Single location — show centered */
                      <div className="absolute transition-all duration-500" style={{ left: "50%", top: "45%" }}>
                        <div className="absolute -inset-4 rounded-full animate-ping" style={{ backgroundColor: `${Math.max(selectedArea.floodRisk, selectedArea.heatRisk) >= 80 ? "#ef4444" : "#f97316"}30` }} />
                        <div
                          className="relative w-5 h-5 rounded-full border-2 border-white shadow-lg"
                          style={{ backgroundColor: Math.max(selectedArea.floodRisk, selectedArea.heatRisk) >= 80 ? "#ef4444" : "#f97316" }}
                        />
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/95 rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap">
                          <p className="text-xs font-bold text-gray-800">{selectedArea.name}</p>
                          <p className="text-[10px] text-gray-500">{(selectedArea.lat || 0).toFixed(4)}°N, {(selectedArea.lng || 0).toFixed(4)}°E</p>
                        </div>
                      </div>
                    )}

                    {/* Legend */}
                    <div className="absolute bottom-3 left-3 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                      <div className="flex items-center gap-3 text-[10px] text-white/70">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> High</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Moderate</span>
                      </div>
                    </div>

                    <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                      <p className="text-[10px] text-white/60">{selectedArea.city ? `${selectedArea.city}, ${selectedArea.country || ""}` : selectedArea.name}</p>
                    </div>
                  </div>
                </div>

                {/* Heat analysis */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-sm font-bold text-gray-800 mb-4 font-[family-name:var(--font-display)]">🌡️ Heat Island Analysis</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2 font-[family-name:var(--font-body)]">Primary Heat Drivers</p>
                      <p className="text-sm text-gray-700 font-[family-name:var(--font-body)]">{selectedArea.heatDrivers}</p>
                    </div>
                    
                    {/* Heat comparison bar */}
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3 font-[family-name:var(--font-body)]">Temperature Differential (vs. Rural)</p>
                      {(() => {
                        const baseTemp = forecast.length > 0 ? Math.max(...forecast.map(d => d.tempHigh)) : 28;
                        const uhiDelta = selectedArea.urbanHeatIslandDelta || Math.round(selectedArea.heatRisk * 0.08);
                        const urbanTemp = baseTemp + uhiDelta;
                        return (
                          <>
                            <div className="space-y-2">
                              {[
                                { label: "Rural Baseline", temp: baseTemp, color: "bg-green-500" },
                                { label: selectedArea.name, temp: urbanTemp, color: selectedArea.heatRisk >= 80 ? "bg-red-500" : "bg-orange-500" },
                              ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <span className="text-xs text-gray-500 w-28 font-[family-name:var(--font-body)]">{item.label}</span>
                                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                                    <div
                                      className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                                      style={{ width: `${(item.temp / 45) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-bold text-gray-800 w-12 text-right font-[family-name:var(--font-display)]">{item.temp}°C</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-red-600 mt-2 font-semibold font-[family-name:var(--font-body)]">
                              +{uhiDelta}°C urban heat island effect {selectedArea.treeCanopyCoverage != null ? `· ${Math.round(selectedArea.treeCanopyCoverage * 100)}% tree canopy` : ""}
                            </p>
                          </>
                        );
                      })()}
                    </div>

                    {/* Recommended trees */}
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2 font-[family-name:var(--font-body)]">🌳 AI-Recommended Cooling Trees</p>
                      <div className="space-y-2">
                        {selectedArea.treeRecommendations.map((tree, i) => (
                          <div key={i} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                            <div>
                              <p className="text-sm font-semibold text-green-800 font-[family-name:var(--font-body)]">{tree.name}</p>
                              <p className="text-xs text-green-600 font-[family-name:var(--font-body)]">{tree.purpose}</p>
                            </div>
                            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded font-[family-name:var(--font-body)]">×{tree.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: AIR QUALITY ═══ */}
          {activeTab === "airquality" && (
            <div className="space-y-6 animate-fade-in">
              {selectedArea.airQuality ? (
                <>
                  {/* AQI Hero Card */}
                  <div className={`rounded-2xl p-6 sm:p-8 border ${
                    selectedArea.airQuality.aqi <= 20 ? "bg-green-50 border-green-200" :
                    selectedArea.airQuality.aqi <= 40 ? "bg-yellow-50 border-yellow-200" :
                    selectedArea.airQuality.aqi <= 60 ? "bg-orange-50 border-orange-200" :
                    selectedArea.airQuality.aqi <= 80 ? "bg-red-50 border-red-200" :
                    "bg-purple-50 border-purple-200"
                  }`}>
                    <div className="grid sm:grid-cols-[auto,1fr] gap-8 items-center">
                      {/* AQI Gauge */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-36 h-36">
                          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                            <circle
                              cx="60" cy="60" r="54" fill="none" strokeWidth="10"
                              stroke={
                                selectedArea.airQuality.aqi <= 20 ? "#22c55e" :
                                selectedArea.airQuality.aqi <= 40 ? "#eab308" :
                                selectedArea.airQuality.aqi <= 60 ? "#f97316" :
                                selectedArea.airQuality.aqi <= 80 ? "#ef4444" : "#a855f7"
                              }
                              strokeDasharray={2 * Math.PI * 54}
                              strokeDashoffset={2 * Math.PI * 54 - (Math.min(selectedArea.airQuality.aqi, 100) / 100) * 2 * Math.PI * 54}
                              strokeLinecap="round"
                              style={{ transition: "stroke-dashoffset 1s ease-out" }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-gray-800 font-[family-name:var(--font-display)]">{selectedArea.airQuality.aqi}</span>
                            <span className="text-[10px] text-gray-500">EU AQI</span>
                          </div>
                        </div>
                        <span className={`text-sm font-bold mt-2 px-4 py-1 rounded-full ${
                          selectedArea.airQuality.aqi <= 20 ? "bg-green-100 text-green-700" :
                          selectedArea.airQuality.aqi <= 40 ? "bg-yellow-100 text-yellow-700" :
                          selectedArea.airQuality.aqi <= 60 ? "bg-orange-100 text-orange-700" :
                          selectedArea.airQuality.aqi <= 80 ? "bg-red-100 text-red-700" :
                          "bg-purple-100 text-purple-700"
                        } font-[family-name:var(--font-body)]`}>{selectedArea.airQuality.level}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 font-[family-name:var(--font-display)] mb-2">
                          Air Quality — {selectedArea.name}
                        </h3>
                        <p className="text-sm text-gray-600 font-[family-name:var(--font-body)] mb-4">{selectedArea.airQuality.desc}</p>
                        {selectedArea.airQuality.trend && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-[family-name:var(--font-body)]">24h Trend:</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              selectedArea.airQuality.trend === "improving" ? "bg-green-100 text-green-700" :
                              selectedArea.airQuality.trend === "worsening" ? "bg-red-100 text-red-700" :
                              "bg-gray-100 text-gray-600"
                            } font-[family-name:var(--font-body)]`}>
                              {selectedArea.airQuality.trend === "improving" ? "↓ Improving" :
                               selectedArea.airQuality.trend === "worsening" ? "↑ Worsening" : "→ Stable"}
                            </span>
                          </div>
                        )}
                        {selectedArea.pollutionDrivers && (
                          <div>
                            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1 font-[family-name:var(--font-body)]">Pollution Drivers</p>
                            <p className="text-sm text-gray-700 font-[family-name:var(--font-body)]">{selectedArea.pollutionDrivers}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pollutant Breakdown */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4 font-[family-name:var(--font-body)]">
                      Pollutant Breakdown (Real-Time)
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedArea.airQuality.pollutants.map((p, i) => {
                        const ratio = Math.min(p.value / p.safe, 2.5);
                        const isOver = p.value > p.safe;
                        return (
                          <div key={i} className={`rounded-xl p-4 border ${isOver ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-gray-800 font-[family-name:var(--font-body)]">{p.name}</span>
                              <span className={`text-lg font-bold font-[family-name:var(--font-display)] ${isOver ? "text-red-600" : "text-gray-700"}`}>
                                {p.value} <span className="text-xs font-normal text-gray-400">{p.unit}</span>
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  ratio <= 0.5 ? "bg-green-500" : ratio <= 1 ? "bg-yellow-500" : ratio <= 1.5 ? "bg-orange-500" : "bg-red-500"
                                }`}
                                style={{ width: `${Math.min(100, (ratio / 2.5) * 100)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] text-gray-500 font-[family-name:var(--font-body)]">{p.desc}</p>
                              <span className="text-[10px] text-gray-400 font-[family-name:var(--font-body)] whitespace-nowrap ml-2">Safe: {p.safe}{p.unit}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 24h AQI Chart and UV/Dust */}
                  <div className="grid lg:grid-cols-[2fr,1fr] gap-4">
                    {/* Hourly AQI trend */}
                    {selectedArea.airQuality.hourlyChart.length > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4 font-[family-name:var(--font-body)]">
                          24-Hour PM2.5 Forecast
                        </p>
                        <div className="flex items-end gap-[2px] h-32">
                          {selectedArea.airQuality.hourlyChart.map((h, i) => {
                            const maxVal = Math.max(...selectedArea.airQuality.hourlyChart.map(x => x.pm25), 30);
                            const height = Math.max(4, (h.pm25 / maxVal) * 100);
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  {h.hour}: {h.pm25}µg/m³
                                </div>
                                <div
                                  className={`w-full rounded-t transition-all duration-500 ${
                                    h.pm25 > 25 ? "bg-red-400" : h.pm25 > 15 ? "bg-orange-400" : h.pm25 > 10 ? "bg-yellow-400" : "bg-green-400"
                                  }`}
                                  style={{ height: `${height}%` }}
                                />
                                {i % 4 === 0 && (
                                  <span className="text-[8px] text-gray-400 font-[family-name:var(--font-body)]">{h.hour}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400 font-[family-name:var(--font-body)]">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-400" /> Good ≤10</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-400" /> Fair ≤15</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-orange-400" /> Moderate ≤25</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400" /> Poor &gt;25</span>
                        </div>
                      </div>
                    )}

                    {/* UV & Dust sidebar */}
                    <div className="space-y-4">
                      {/* UV Index */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3 font-[family-name:var(--font-body)]">☀️ UV Index</p>
                        {(() => {
                          const uv = forecast.length > 0 ? Math.max(...forecast.map(d => d.uvIndex || 0)) : selectedArea.airQuality.uvIndex || 0;
                          const uvLevel = uv <= 2 ? "Low" : uv <= 5 ? "Moderate" : uv <= 7 ? "High" : uv <= 10 ? "Very High" : "Extreme";
                          const uvColor = uv <= 2 ? "text-green-600" : uv <= 5 ? "text-yellow-600" : uv <= 7 ? "text-orange-600" : "text-red-600";
                          return (
                            <>
                              <p className={`text-3xl font-bold ${uvColor} font-[family-name:var(--font-display)]`}>{uv}</p>
                              <p className={`text-sm font-semibold ${uvColor} font-[family-name:var(--font-body)]`}>{uvLevel}</p>
                              <p className="text-xs text-gray-500 mt-2 font-[family-name:var(--font-body)]">
                                {uv > 7 ? "Avoid midday sun. Shade infrastructure needed." :
                                 uv > 5 ? "Sunscreen and shade recommended." :
                                 "Safe outdoor activity levels."}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                      {/* Dust */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3 font-[family-name:var(--font-body)]">💨 Dust Level</p>
                        <p className="text-3xl font-bold text-amber-600 font-[family-name:var(--font-display)]">{selectedArea.airQuality.dust} <span className="text-sm font-normal text-gray-400">µg/m³</span></p>
                        <p className="text-xs text-gray-500 mt-2 font-[family-name:var(--font-body)]">
                          {selectedArea.airQuality.dust > 100 ? "High dust levels — unpaved roads and construction likely contributing" :
                           selectedArea.airQuality.dust > 50 ? "Moderate dust — typical for urban areas" :
                           "Low dust levels"}
                        </p>
                      </div>
                      {/* Health advice */}
                      <div className={`rounded-2xl border p-5 ${
                        selectedArea.airQuality.aqi > 60 ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"
                      }`}>
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2 font-[family-name:var(--font-body)]">🏥 Health Advisory</p>
                        <p className="text-sm text-gray-700 font-[family-name:var(--font-body)]">
                          {selectedArea.airQuality.aqi > 80 ? "Everyone should reduce outdoor exertion. Vulnerable groups (children, elderly, asthmatics) should stay indoors." :
                           selectedArea.airQuality.aqi > 60 ? "Sensitive groups should limit prolonged outdoor exertion. Consider wearing masks near traffic." :
                           selectedArea.airQuality.aqi > 40 ? "Unusually sensitive individuals should consider reducing prolonged outdoor exertion." :
                           "Air quality is acceptable. Enjoy outdoor activities."}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                  <span className="text-4xl mb-4 block">🏭</span>
                  <p className="text-lg font-bold text-gray-800 font-[family-name:var(--font-display)]">Air Quality Data Unavailable</p>
                  <p className="text-sm text-gray-500 mt-2 font-[family-name:var(--font-body)]">
                    Real-time air quality data could not be retrieved for {selectedArea.name}. Try re-analyzing the location.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: FORECAST ═══ */}
          {activeTab === "forecast" && (
            <div className="space-y-6 animate-fade-in">
              {hasFloodWarning && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <p className="text-red-800 font-bold text-lg font-[family-name:var(--font-display)]">Flood Warning Active — {selectedArea.name}</p>
                    <p className="text-red-600 text-sm mt-1 font-[family-name:var(--font-body)]">
                      Heavy rainfall predicted in the next 72 hours. Combined with {selectedArea.name}&apos;s drainage conditions ({selectedArea.drainage ? selectedArea.drainage.split("—")[0].trim() : "Unknown"}), 
                      flood risk is elevated to {selectedArea.floodRisk}/100. Residents in low-lying areas should prepare.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {forecast.map((day, i) => (
                  <div key={i} className={`bg-white rounded-2xl p-5 border text-center transition-all
                    ${day.floodTrigger ? "border-red-200 shadow-md shadow-red-100" : "border-gray-100 shadow-sm"}`}>
                    <p className="text-xs font-semibold text-gray-400 mb-3 font-[family-name:var(--font-body)]">{day.date}</p>
                    <WeatherIcon condition={day.condition} />
                    <p className="text-sm font-semibold text-gray-700 mt-2 font-[family-name:var(--font-body)]">{day.condition}</p>
                    <div className="mt-3 space-y-1">
                      <p className="text-lg font-bold text-gray-800 font-[family-name:var(--font-display)]">{day.tempHigh}° / {day.tempLow}°</p>
                      {Number(day.rainfall) > 0 && (
                        <p className={`text-xs font-semibold ${day.floodTrigger ? "text-red-600" : "text-blue-600"} font-[family-name:var(--font-body)]`}>
                          💧 {day.rainfall}mm
                        </p>
                      )}
                      <p className="text-xs text-gray-400 font-[family-name:var(--font-body)]">💨 {day.humidity}% humidity</p>
                      {day.uvIndex > 0 && (
                        <p className={`text-xs font-[family-name:var(--font-body)] ${day.uvIndex > 7 ? "text-red-500 font-semibold" : "text-gray-400"}`}>☀️ UV {day.uvIndex}</p>
                      )}
                    </div>
                    {day.floodTrigger && (
                      <span className="inline-block mt-3 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                        ⚠️ FLOOD TRIGGER
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary stats */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold font-[family-name:var(--font-body)]">Max Expected Rainfall</p>
                  <p className={`text-3xl font-bold mt-2 font-[family-name:var(--font-display)] ${maxRainfall > 30 ? "text-red-600" : "text-blue-600"}`}>{maxRainfall}mm</p>
                  <p className="text-xs text-gray-500 mt-1 font-[family-name:var(--font-body)]">
                    {maxRainfall > 40 ? "Severe — likely to overwhelm drainage" : maxRainfall > 20 ? "Heavy — monitor drainage points" : "Moderate — manageable"}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold font-[family-name:var(--font-body)]">Avg Humidity</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2 font-[family-name:var(--font-display)]">{avgHumidity}%</p>
                  <p className="text-xs text-gray-500 mt-1 font-[family-name:var(--font-body)]">
                    {avgHumidity > 75 ? "Very high — amplifies heat stress" : "Elevated — monitor vulnerable populations"}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold font-[family-name:var(--font-body)]">Soil Saturation Est.</p>
                  <p className="text-3xl font-bold text-amber-600 mt-2 font-[family-name:var(--font-display)]">
                    {selectedArea.floodRisk > 80 ? "High" : selectedArea.floodRisk > 60 ? "Moderate" : "Low"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-[family-name:var(--font-body)]">
                    Based on recent rainfall patterns and {selectedArea.name}&apos;s drainage capacity
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: ACTION PLAN ═══ */}
          {activeTab === "action" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 font-[family-name:var(--font-display)]">
                        AI-Generated Climate Action Plan — {selectedArea.name}
                      </h2>
                      <p className="text-sm text-gray-500 font-[family-name:var(--font-body)]">
                        {selectedArea.division ? `${selectedArea.division}, ` : ""}{selectedArea.city || ""}{selectedArea.country ? `, ${selectedArea.country}` : ""} · Generated by KibiraAI
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={downloadActionPlan}
                    className="text-xs bg-[#0c2d48] text-white px-4 py-2 rounded-full font-semibold hover:bg-[#0a2035] transition-colors font-[family-name:var(--font-body)] flex items-center gap-1.5"
                  >
                    📥 Download Action Plan
                  </button>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Interventions */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#2d6a4f] font-semibold mb-4 font-[family-name:var(--font-body)]">
                      Recommended Interventions
                    </p>
                    <div className="space-y-3">
                      {selectedArea.interventions.map((intervention, i) => (
                        <div key={i} className="flex items-start gap-3 bg-[#f7faf6] rounded-xl p-4 border border-[#dce9dc]">
                          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#2d6a4f] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm text-gray-700 leading-relaxed font-[family-name:var(--font-body)]">{intervention}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Impact projections — data-driven from real analysis */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-4 font-[family-name:var(--font-body)]">
                      Projected Impact (5 Years)
                    </p>
                    {(() => {
                      const pi = selectedArea.projectedImpact;
                      if (!pi) return null;
                      const items = [
                        {
                          metric: "Temperature Reduction",
                          value: `−${pi.tempReduction}°C`,
                          desc: `Cooling from ${pi.totalTrees} trees + cool-roof retrofits (current UHI: +${pi.uhiDelta}°C)`,
                          color: "text-blue-600",
                          bg: "bg-blue-50",
                          border: "border-blue-100",
                        },
                        {
                          metric: "Flood Damage Reduction",
                          value: `${pi.floodReduction}%`,
                          desc: `From drainage improvements and permeable surfaces (current flood risk: ${selectedArea.floodRisk}/100)`,
                          color: "text-green-600",
                          bg: "bg-green-50",
                          border: "border-green-100",
                        },
                        {
                          metric: "Carbon Sequestered",
                          value: `${pi.carbonTonnes} tonnes/yr`,
                          desc: `${pi.totalTrees} trees at maturity (22kg CO₂/tree/yr for tropical species)`,
                          color: "text-emerald-600",
                          bg: "bg-emerald-50",
                          border: "border-emerald-100",
                        },
                        {
                          metric: "Canopy Increase",
                          value: pi.canopyIncrease,
                          desc: "Projected tree canopy coverage improvement over 5 years",
                          color: "text-teal-600",
                          bg: "bg-teal-50",
                          border: "border-teal-100",
                        },
                      ];
                      if (pi.pm25Reduction > 0) {
                        items.push({
                          metric: "PM2.5 Reduction",
                          value: `−${pi.pm25Reduction}%`,
                          desc: `Particle filtration from expanded urban canopy${selectedArea.airQuality ? ` (current: ${selectedArea.airQuality.pollutants?.find(p => p.name === "PM2.5")?.value || "?"}µg/m³)` : ""}`,
                          color: "text-amber-600",
                          bg: "bg-amber-50",
                          border: "border-amber-100",
                        });
                      }
                      items.push({
                        metric: "People Protected",
                        value: pi.peopleProtected,
                        desc: "Residents benefiting from early warnings, cooling, and cleaner air",
                        color: "text-purple-600",
                        bg: "bg-purple-50",
                        border: "border-purple-100",
                      });
                      return (
                        <div className="space-y-3">
                          {items.map((item, i) => (
                            <div key={i} className={`${item.bg} border ${item.border} rounded-xl p-4`}>
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-700 font-[family-name:var(--font-body)]">{item.metric}</p>
                                <p className={`text-xl font-bold ${item.color} font-[family-name:var(--font-display)]`}>{item.value}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 font-[family-name:var(--font-body)]">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Tree planting summary */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-xs uppercase tracking-widest text-[#2d6a4f] font-semibold mb-4 font-[family-name:var(--font-body)]">
                    🌳 Tree Planting Prescription
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {selectedArea.treeRecommendations.map((tree, i) => (
                      <div key={i} className="bg-[#f7faf6] border border-[#dce9dc] rounded-xl p-4">
                        <p className="text-base font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{tree.name}</p>
                        <p className="text-2xl font-bold text-[#2d6a4f] mt-1 font-[family-name:var(--font-display)]">×{tree.count}</p>
                        <p className="text-xs text-[#5d6f5d] mt-1 font-[family-name:var(--font-body)]">{tree.purpose}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: SUMMARY ═══ */}
          {activeTab === "summary" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3 mb-8 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 font-[family-name:var(--font-display)]">
                        Climate Intelligence Summary — {selectedArea.name}
                      </h2>
                      <p className="text-sm text-gray-500 font-[family-name:var(--font-body)]">
                        {selectedArea.division ? `${selectedArea.division}, ` : ""}{selectedArea.city || ""}{selectedArea.country ? `, ${selectedArea.country}` : ""} · {(() => { const d = new Date(); return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`; })()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={downloadActionPlan}
                    className="text-xs bg-[#0c2d48] text-white px-4 py-2 rounded-full font-semibold hover:bg-[#0a2035] transition-colors font-[family-name:var(--font-body)] flex items-center gap-1.5"
                  >
                    📥 Download Full Report
                  </button>
                </div>

                {/* 1. Location Profile */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-[#0c2d48] uppercase tracking-widest mb-4 font-[family-name:var(--font-body)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0c2d48] text-white text-[10px] flex items-center justify-center font-bold">1</span>
                    Location Profile
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: "Coordinates", value: `${(selectedArea.lat || 0).toFixed(4)}°N, ${(selectedArea.lng || 0).toFixed(4)}°E` },
                      { label: "Population", value: selectedArea.population },
                      { label: "Elevation", value: selectedArea.elevation },
                      { label: "Drainage", value: selectedArea.drainage?.split("—")?.[0]?.trim() || selectedArea.drainage || "Unknown" },
                    ].map((item, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold font-[family-name:var(--font-body)]">{item.label}</p>
                        <p className="text-sm font-semibold text-gray-800 mt-1 font-[family-name:var(--font-body)]">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Risk Assessment */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-[#0c2d48] uppercase tracking-widest mb-4 font-[family-name:var(--font-body)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0c2d48] text-white text-[10px] flex items-center justify-center font-bold">2</span>
                    Risk Assessment
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Flood risk card */}
                    <div className={`rounded-xl p-5 border ${selectedArea.floodRisk >= 60 ? "bg-red-50 border-red-200" : selectedArea.floodRisk >= 40 ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-gray-800 font-[family-name:var(--font-body)]">🌊 Flood Risk</p>
                        <span className={`text-2xl font-bold font-[family-name:var(--font-display)] ${selectedArea.floodRisk >= 60 ? "text-red-600" : selectedArea.floodRisk >= 40 ? "text-orange-600" : "text-green-600"}`}>
                          {selectedArea.floodRisk}/100
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-[family-name:var(--font-body)] mb-2">{selectedArea.drainage}</p>
                      <p className="text-xs text-gray-500 font-[family-name:var(--font-body)]"><strong>History:</strong> {selectedArea.floodHistory}</p>
                    </div>
                    {/* Heat risk card */}
                    <div className={`rounded-xl p-5 border ${selectedArea.heatRisk >= 60 ? "bg-red-50 border-red-200" : selectedArea.heatRisk >= 40 ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-gray-800 font-[family-name:var(--font-body)]">🌡️ Heat Risk</p>
                        <span className={`text-2xl font-bold font-[family-name:var(--font-display)] ${selectedArea.heatRisk >= 60 ? "text-red-600" : selectedArea.heatRisk >= 40 ? "text-orange-600" : "text-green-600"}`}>
                          {selectedArea.heatRisk}/100
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-[family-name:var(--font-body)] mb-2">{selectedArea.heatDrivers}</p>
                      {selectedArea.urbanHeatIslandDelta && (
                        <p className="text-xs text-gray-500 font-[family-name:var(--font-body)]">
                          <strong>UHI Delta:</strong> +{selectedArea.urbanHeatIslandDelta}°C · <strong>Canopy:</strong> {Math.round((selectedArea.treeCanopyCoverage || 0) * 100)}% · <strong>Impervious:</strong> {Math.round((selectedArea.imperviousSurface || 0) * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Air Quality */}
                {selectedArea.airQuality && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-[#0c2d48] uppercase tracking-widest mb-4 font-[family-name:var(--font-body)] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#0c2d48] text-white text-[10px] flex items-center justify-center font-bold">3</span>
                      Air Quality
                    </h3>
                    <div className={`rounded-xl p-5 border ${
                      selectedArea.airQuality.aqi > 60 ? "bg-red-50 border-red-200" :
                      selectedArea.airQuality.aqi > 40 ? "bg-orange-50 border-orange-200" :
                      "bg-green-50 border-green-200"
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-gray-800 font-[family-name:var(--font-body)]">🏭 European AQI: {selectedArea.airQuality.level}</p>
                          <p className="text-xs text-gray-500 font-[family-name:var(--font-body)]">{selectedArea.airQuality.desc}</p>
                        </div>
                        <span className={`text-2xl font-bold font-[family-name:var(--font-display)] ${
                          selectedArea.airQuality.aqi > 60 ? "text-red-600" : selectedArea.airQuality.aqi > 40 ? "text-orange-600" : "text-green-600"
                        }`}>{selectedArea.airQuality.aqi}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-3">
                        {selectedArea.airQuality.pollutants.filter(p => p.value > 0).map((p, i) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded-full font-semibold font-[family-name:var(--font-body)] ${
                            p.value > p.safe ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {p.name}: {p.value} {p.unit}
                          </span>
                        ))}
                      </div>
                      {selectedArea.pollutionDrivers && (
                        <p className="text-xs text-gray-600 mt-3 font-[family-name:var(--font-body)]"><strong>Pollution Sources:</strong> {selectedArea.pollutionDrivers}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Weather Outlook */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-[#0c2d48] uppercase tracking-widest mb-4 font-[family-name:var(--font-body)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0c2d48] text-white text-[10px] flex items-center justify-center font-bold">{selectedArea.airQuality ? "4" : "3"}</span>
                    5-Day Weather Outlook
                  </h3>
                  {forecast.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            {["Date", "Condition", "High", "Low", "Rain", "Humidity", "UV", "Alert"].map((h) => (
                              <th key={h} className="text-left text-[10px] uppercase tracking-widest text-gray-400 font-semibold py-2 px-2 font-[family-name:var(--font-body)]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {forecast.map((day, i) => (
                            <tr key={i} className={`border-b border-gray-50 ${day.floodTrigger ? "bg-red-50" : ""}`}>
                              <td className="py-2 px-2 font-semibold text-gray-700 font-[family-name:var(--font-body)]">{day.date}</td>
                              <td className="py-2 px-2 text-gray-600 font-[family-name:var(--font-body)]">{day.condition}</td>
                              <td className="py-2 px-2 font-bold text-gray-800 font-[family-name:var(--font-display)]">{day.tempHigh}°</td>
                              <td className="py-2 px-2 text-gray-500 font-[family-name:var(--font-body)]">{day.tempLow}°</td>
                              <td className={`py-2 px-2 font-semibold font-[family-name:var(--font-body)] ${day.rainfall > 30 ? "text-red-600" : day.rainfall > 0 ? "text-blue-600" : "text-gray-400"}`}>{day.rainfall}mm</td>
                              <td className="py-2 px-2 text-gray-500 font-[family-name:var(--font-body)]">{day.humidity}%</td>
                              <td className={`py-2 px-2 font-[family-name:var(--font-body)] ${(day.uvIndex || 0) > 7 ? "text-red-600 font-bold" : "text-gray-500"}`}>{day.uvIndex || "—"}</td>
                              <td className="py-2 px-2">{day.floodTrigger ? <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">⚠️ FLOOD</span> : <span className="text-gray-300">—</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 font-[family-name:var(--font-body)]">No forecast data available.</p>
                  )}
                  {hasFloodWarning && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                      <p className="text-xs text-red-700 font-semibold font-[family-name:var(--font-body)]">
                        ⚠️ Flood triggers detected — heavy rainfall may overwhelm {selectedArea.name}&apos;s drainage capacity. Max expected: {maxRainfall}mm.
                      </p>
                    </div>
                  )}
                </div>

                {/* 5. Recommended Interventions */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-[#0c2d48] uppercase tracking-widest mb-4 font-[family-name:var(--font-body)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0c2d48] text-white text-[10px] flex items-center justify-center font-bold">{selectedArea.airQuality ? "5" : "4"}</span>
                    Recommended Interventions
                  </h3>
                  <div className="space-y-2">
                    {selectedArea.interventions.map((int, i) => (
                      <div key={i} className="flex items-start gap-3 bg-[#f7faf6] rounded-lg px-4 py-3 border border-[#dce9dc]">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#2d6a4f] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                        <p className="text-sm text-gray-700 font-[family-name:var(--font-body)]">{int}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Tree Planting Prescription */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-[#0c2d48] uppercase tracking-widest mb-4 font-[family-name:var(--font-body)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0c2d48] text-white text-[10px] flex items-center justify-center font-bold">{selectedArea.airQuality ? "6" : "5"}</span>
                    🌳 Tree Planting Prescription
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {selectedArea.treeRecommendations.map((tree, i) => (
                      <div key={i} className="bg-[#f7faf6] border border-[#dce9dc] rounded-xl p-4">
                        <p className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{tree.name}</p>
                        <p className="text-xl font-bold text-[#2d6a4f] mt-1 font-[family-name:var(--font-display)]">×{tree.count}</p>
                        <p className="text-xs text-[#5d6f5d] mt-1 font-[family-name:var(--font-body)]">{tree.purpose}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. Projected Impact */}
                {selectedArea.projectedImpact && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-[#0c2d48] uppercase tracking-widest mb-4 font-[family-name:var(--font-body)] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#0c2d48] text-white text-[10px] flex items-center justify-center font-bold">{selectedArea.airQuality ? "7" : "6"}</span>
                      Projected Impact (5 Years)
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { label: "Temperature Reduction", value: `−${selectedArea.projectedImpact.tempReduction}°C`, color: "text-blue-600" },
                        { label: "Flood Damage Reduction", value: `${selectedArea.projectedImpact.floodReduction}%`, color: "text-green-600" },
                        { label: "Carbon Sequestered", value: `${selectedArea.projectedImpact.carbonTonnes} t/yr`, color: "text-emerald-600" },
                        { label: "Canopy Coverage", value: selectedArea.projectedImpact.canopyIncrease, color: "text-teal-600" },
                        ...(selectedArea.projectedImpact.pm25Reduction > 0 ? [{ label: "PM2.5 Reduction", value: `−${selectedArea.projectedImpact.pm25Reduction}%`, color: "text-amber-600" }] : []),
                        { label: "People Protected", value: selectedArea.projectedImpact.peopleProtected, color: "text-purple-600" },
                      ].map((item, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold font-[family-name:var(--font-body)]">{item.label}</p>
                          <p className={`text-xl font-bold mt-1 font-[family-name:var(--font-display)] ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Sources Footer */}
                <div className="pt-6 border-t border-gray-100">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2 font-[family-name:var(--font-body)]">Data Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedArea.dataSources && Object.entries(selectedArea.dataSources).map(([key, val]) => (
                      <span key={key} className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-semibold font-[family-name:var(--font-body)]">
                        {key}: {val}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-3 font-[family-name:var(--font-body)]">
                    Generated by Kibira AI · {(() => { const d = new Date(); return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; })()} · This report is for informational purposes. Local authorities should verify recommendations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: SEND ALERT ═══ */}
          {activeTab === "alert" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🚨</span>
                  <h2 className="text-xl font-bold text-gray-800 font-[family-name:var(--font-display)]">
                    Early Warning Alert System
                  </h2>
                </div>
                <p className="text-sm text-gray-500 mb-8 font-[family-name:var(--font-body)]">
                  Simulate sending a flood/heat early warning to {selectedArea.name} residents, community leaders,
                  schools, and clinics via SMS and WhatsApp. In production, this triggers automatically when risk exceeds threshold.
                </p>

                {/* Current risk summary */}
                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                  <div className={`rounded-xl p-4 border ${selectedArea.floodRisk >= 80 ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}>
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold font-[family-name:var(--font-body)]">Flood Risk</p>
                    <p className={`text-3xl font-bold mt-1 font-[family-name:var(--font-display)] ${selectedArea.floodRisk >= 80 ? "text-red-600" : "text-orange-600"}`}>
                      {selectedArea.floodRisk}/100
                    </p>
                  </div>
                  <div className={`rounded-xl p-4 border ${selectedArea.heatRisk >= 80 ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}>
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold font-[family-name:var(--font-body)]">Heat Risk</p>
                    <p className={`text-3xl font-bold mt-1 font-[family-name:var(--font-display)] ${selectedArea.heatRisk >= 80 ? "text-red-600" : "text-orange-600"}`}>
                      {selectedArea.heatRisk}/100
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold font-[family-name:var(--font-body)]">Est. Recipients</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1 font-[family-name:var(--font-display)]">
                      {Math.floor(parseInt(String(selectedArea.population).replace(/[^0-9]/g, "")) * 0.6).toLocaleString()}
                    </p>
                  </div>
                </div>

                {!alertSent ? (
                  <div className="text-center py-8">
                    <button
                      onClick={simulateAlert}
                      disabled={simulating}
                      className={`inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-bold transition-all
                        ${simulating
                          ? "bg-gray-200 text-gray-500 cursor-wait"
                          : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 hover:scale-105"
                        }`}
                    >
                      {simulating ? (
                        <>
                          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                          </svg>
                          Dispatching Alerts...
                        </>
                      ) : (
                        <>🚨 Simulate Emergency Alert</>
                      )}
                    </button>
                    <p className="text-xs text-gray-400 mt-4 font-[family-name:var(--font-body)]">
                      This is a demonstration. In production, alerts auto-trigger when risk thresholds are exceeded.
                    </p>
                  </div>
                ) : (
                  simulationResult && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-2xl">✅</span>
                          <p className="text-green-800 font-bold text-lg font-[family-name:var(--font-display)]">Alert Successfully Dispatched</p>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-green-600 font-semibold font-[family-name:var(--font-body)]">Recipients</p>
                            <p className="text-xl font-bold text-green-800 font-[family-name:var(--font-display)]">{simulationResult.recipients.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-green-600 font-semibold font-[family-name:var(--font-body)]">Channels</p>
                            <p className="text-sm font-bold text-green-800 font-[family-name:var(--font-body)]">{simulationResult.channels.join(", ")}</p>
                          </div>
                          <div>
                            <p className="text-xs text-green-600 font-semibold font-[family-name:var(--font-body)]">Timestamp</p>
                            <p className="text-sm font-bold text-green-800 font-[family-name:var(--font-body)]">{simulationResult.timestamp}</p>
                          </div>
                        </div>
                        <div className="bg-white border border-green-100 rounded-xl p-4">
                          <p className="text-xs text-gray-400 font-semibold mb-2 font-[family-name:var(--font-body)]">MESSAGE CONTENT</p>
                          <p className="text-sm text-gray-700 leading-relaxed font-[family-name:var(--font-body)]">{simulationResult.message}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setAlertSent(false); setSimulationResult(null); }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-semibold font-[family-name:var(--font-body)]"
                      >
                        ← Reset Simulation
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          </>)}
          <div className="mt-16 bg-gradient-to-br from-[#0c2d48] to-[#1a1a2e] rounded-[2.5rem] p-8 sm:p-14 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4 font-[family-name:var(--font-display)]">
                AI Climate Intelligence for Any Location
              </h2>
              <p className="text-white/60 text-lg max-w-xl mx-auto mb-8 font-[family-name:var(--font-body)]">
                This system analyzes any neighborhood, city, or region — Kampala, Lagos, Nairobi, Dar es Salaam, Accra, and beyond. Every community deserves climate intelligence.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/advisor"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-full text-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/25 w-full sm:w-auto"
                >
                  Try Dr. Kibira AI →
                </Link>
                <Link
                  href="/solution"
                  className="border-2 border-white/20 text-white hover:bg-white/10 font-bold px-8 py-4 rounded-full text-lg transition-all w-full sm:w-auto"
                >
                  View All Solutions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
