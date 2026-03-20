"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ─── Kampala neighborhood data with real coordinates & risk profiles ───
const NEIGHBORHOODS = [
  {
    id: "bwaise",
    name: "Bwaise",
    division: "Kawempe",
    lat: 0.3476,
    lng: 32.5672,
    population: "~62,000",
    floodRisk: 94,
    heatRisk: 78,
    elevation: "1,140m (low-lying wetland)",
    drainage: "Poor — built on reclaimed Lubigi wetland",
    floodHistory: "Severe floods in 2020, 2022, 2024 — displaces 5,000+ per event",
    heatDrivers: "Dense metal roofing, near-zero tree cover, stagnant water pools",
    interventions: [
      "Plant 300 Terminalia mantaly along Bwaise-Kawempe Road for stormwater interception and shade",
      "Construct 4 bioswale drainage channels using native papyrus to filter and slow runoff",
      "Deploy 12 solar-powered flood sensors at key drainage choke points",
      "Distribute 500 cool-roof paint kits to reduce indoor temperatures by 3–5°C",
    ],
    treeRecommendations: [
      { name: "Terminalia mantaly", count: 300, purpose: "Shade + stormwater interception" },
      { name: "Cyperus papyrus", count: "4 bioswale beds", purpose: "Natural drainage filtration" },
      { name: "Ficus natalensis", count: 50, purpose: "Deep roots stabilize flood-prone soil" },
    ],
  },
  {
    id: "katanga",
    name: "Katanga",
    division: "Kampala Central",
    lat: 0.3327,
    lng: 32.5695,
    population: "~25,000",
    floodRisk: 62,
    heatRisk: 91,
    elevation: "1,190m (valley settlement)",
    drainage: "Moderate — proximity to Mulago hill channels water through",
    floodHistory: "Flash flooding during heavy rains, localized but intense",
    heatDrivers: "Extreme density (40,000+ people/km²), tin roofs, zero green space, industrial heat sources",
    interventions: [
      "Install 8 vertical green walls on community buildings using Epipremnum and local climbers",
      "Plant 150 Grevillea robusta street trees to create shade corridors through main walkways",
      "Deploy cool-roof reflective coating program for 200 highest-risk structures",
      "Create 3 micro-parks (50m² each) with native shade trees and seating for heat refuge",
    ],
    treeRecommendations: [
      { name: "Grevillea robusta", count: 150, purpose: "Fast shade for narrow streets" },
      { name: "Callistemon citrinus", count: 80, purpose: "Small footprint, urban-adapted" },
      { name: "Mango (Mangifera indica)", count: 30, purpose: "Shade + food security" },
    ],
  },
  {
    id: "namuwongo",
    name: "Namuwongo",
    division: "Makindye",
    lat: 0.3058,
    lng: 32.6098,
    population: "~35,000",
    floodRisk: 87,
    heatRisk: 72,
    elevation: "1,130m (lakeside lowland)",
    drainage: "Very poor — adjacent to Nakivubo channel and Lake Victoria",
    floodHistory: "Annual flooding from Nakivubo channel overflow and lake level rise",
    heatDrivers: "Waterlogged ground creates humidity traps, dense housing, minimal vegetation",
    interventions: [
      "Restore 500m of Nakivubo channel riparian buffer with native wetland vegetation",
      "Plant 200 Markhamia lutea trees along elevated sections for flood barrier and shade",
      "Install 8 community flood warning sirens connected to KibiraAI prediction engine",
      "Build 2 elevated community safe spaces above historical flood lines",
    ],
    treeRecommendations: [
      { name: "Markhamia lutea", count: 200, purpose: "Flood barrier + soil stabilization" },
      { name: "Phoenix reclinata", count: 60, purpose: "Wetland-adapted, erosion control" },
      { name: "Maesopsis eminii", count: 40, purpose: "Fast carbon capture + shade" },
    ],
  },
  {
    id: "kalerwe",
    name: "Kalerwe",
    division: "Kawempe",
    lat: 0.3509,
    lng: 32.5744,
    population: "~48,000",
    floodRisk: 76,
    heatRisk: 68,
    elevation: "1,155m (hillside-to-valley)",
    drainage: "Moderate — runoff from Makerere hill causes flash floods in valley",
    floodHistory: "Regular market flooding, 2023 floods destroyed 200+ market stalls",
    heatDrivers: "Market congestion, vehicle emissions, concrete surfaces, deforested hillside",
    interventions: [
      "Terrace hillside above Kalerwe market with 400 Calliandra calothyrsus for soil stabilization",
      "Construct permeable paving in market area to absorb 60% of surface runoff",
      "Plant 100 Spathodea campanulata along main roads for shade corridors",
      "Install 6 rain gauge sensors for hyperlocal flood prediction",
    ],
    treeRecommendations: [
      { name: "Calliandra calothyrsus", count: 400, purpose: "Hillside stabilization + nitrogen fixing" },
      { name: "Spathodea campanulata", count: 100, purpose: "Road shade + biodiversity" },
      { name: "Avocado (Persea americana)", count: 50, purpose: "Food security + urban canopy" },
    ],
  },
  {
    id: "kisenyi",
    name: "Kisenyi",
    division: "Kampala Central",
    lat: 0.3140,
    lng: 32.5685,
    population: "~55,000",
    floodRisk: 71,
    heatRisk: 85,
    elevation: "1,175m (valley floor)",
    drainage: "Poor — lowest point in central Kampala, all runoff converges here",
    floodHistory: "Chronic flooding from Nsooba-Lubigi system, worsened by blocked drainage",
    heatDrivers: "Highest density in Kampala, industrial workshops, zero tree canopy, waste heat",
    interventions: [
      "Clear and naturalize 1.2km of blocked Nsooba drainage channel with gabion reinforcement",
      "Plant 200 Terminalia catappa along commercial streets for broad-canopy shade",
      "Deploy 10 air quality + temperature sensors for real-time heat monitoring",
      "Create 4 shaded water distribution points as heat relief stations during extreme events",
    ],
    treeRecommendations: [
      { name: "Terminalia catappa", count: 200, purpose: "Broad canopy, heat reduction" },
      { name: "Moringa oleifera", count: 100, purpose: "Fast-growing, nutrition, shade" },
      { name: "Ficus benjamina", count: 30, purpose: "Dense shade, air purification" },
    ],
  },
];

// ─── Seeded random for consistent daily forecasts ───
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Simulated weather forecast data (deterministic per day + neighborhood) ───
function generateForecast(neighborhoodId) {
  const days = [];
  const conditions = ["Sunny", "Partly Cloudy", "Overcast", "Light Rain", "Heavy Rain", "Thunderstorm"];
  const today = new Date();
  // Seed based on today's date + neighborhood so it's stable per day but varies by area
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const idHash = (neighborhoodId || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRandom(dateSeed + idHash);

  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const condIndex = Math.floor(rand() * conditions.length);
    days.push({
      date: date.toLocaleDateString("en-UG", { weekday: "short", month: "short", day: "numeric" }),
      condition: conditions[condIndex],
      tempHigh: 28 + Math.floor(rand() * 6),
      tempLow: 17 + Math.floor(rand() * 4),
      rainfall: condIndex >= 3 ? (10 + rand() * 50).toFixed(0) : 0,
      humidity: 55 + Math.floor(rand() * 35),
      floodTrigger: condIndex >= 4,
    });
  }
  return days;
}

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
  const [selectedArea, setSelectedArea] = useState(NEIGHBORHOODS[0]);
  const [forecast, setForecast] = useState([]);
  const [alertSent, setAlertSent] = useState(false);
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    setForecast(generateForecast(selectedArea.id));
    setAlertSent(false);
    setShowActionPlan(false);
    setSimulationResult(null);
  }, [selectedArea]);

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
    const headers = "Neighborhood,Division,Population,Flood Risk,Heat Risk,Elevation,Drainage,Flood History,Heat Drivers\n";
    const rows = NEIGHBORHOODS.map((n) =>
      `"${n.name}","${n.division}","${n.population}",${n.floodRisk},${n.heatRisk},"${n.elevation}","${n.drainage}","${n.floodHistory}","${n.heatDrivers}"`
    ).join("\n");
    downloadCSV(headers + rows, `kibira-urban-risk-report-${new Date().toISOString().slice(0,10)}.csv`);
  };

  const downloadActionPlan = () => {
    const report = [
      `Action Plan — ${selectedArea.name}, ${selectedArea.division} Division, Kampala`,
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
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      setAlertSent(true);
      setSimulationResult({
        recipients: Math.floor(selectedArea.population.replace(/[^0-9]/g, "") * 0.6),
        channels: ["SMS", "WhatsApp", "Community Leaders"],
        message: `⚠️ FLOOD ALERT — ${selectedArea.name}: Heavy rainfall expected in the next 24-48 hours. Risk Level: ${selectedArea.floodRisk}/100. Move valuables to higher ground. Avoid low-lying areas near drainage channels. Stay tuned for updates. — KibiraAI Early Warning`,
        timestamp: new Date().toLocaleString("en-UG"),
      });
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0c2d48]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🌿</span>
              <span className="font-[family-name:var(--font-display)] text-xl font-bold text-white tracking-tight">
                KibiraAI
              </span>
            </Link>
            <span className="text-white/30">|</span>
            <span className="text-blue-400 text-sm font-semibold font-[family-name:var(--font-body)]">Urban Early Warning</span>
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

      <main className="pt-20 sm:pt-24 pb-20">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0c2d48] to-[#1a1a2e] py-12 sm:py-16 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-8 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse-soft" />
                  <span className="text-blue-400 text-xs font-semibold tracking-widest uppercase font-[family-name:var(--font-body)]">
                    Live Monitoring System
                  </span>
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 font-[family-name:var(--font-display)]">
                  Urban Heat &amp; Flood
                  <br />
                  <span className="text-blue-400">Early Warning</span>
                </h1>
                <p className="text-white/70 text-lg max-w-xl font-[family-name:var(--font-body)]">
                  AI-powered hyperlocal climate monitoring for Kampala&apos;s most vulnerable neighborhoods. Select an area below to view real-time risk analysis, forecasts, and actionable intervention plans.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-blue-400 font-[family-name:var(--font-display)]">5</p>
                  <p className="text-white/50 text-[10px] sm:text-xs mt-1 font-[family-name:var(--font-body)]">Neighborhoods Monitored</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-red-400 font-[family-name:var(--font-display)]">225K+</p>
                  <p className="text-white/50 text-[10px] sm:text-xs mt-1 font-[family-name:var(--font-body)]">People Protected</p>
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
          {/* Area selector */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-500 mb-3 font-[family-name:var(--font-body)]">SELECT NEIGHBORHOOD</p>
            <div className="flex flex-wrap gap-2">
              {NEIGHBORHOODS.map((area) => {
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
                    <span className={`text-xs ${isActive ? "text-white/60" : "text-gray-400"}`}>{area.division}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
            {[
              { key: "overview", label: "Risk Overview", icon: "📊" },
              { key: "forecast", label: "Weather Forecast", icon: "🌦️" },
              { key: "action", label: "Action Plan", icon: "📋" },
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
              {/* Download bar */}
              <div className="flex justify-end">
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
                  <p className="text-sm text-gray-500 mt-2 font-[family-name:var(--font-body)]">{selectedArea.division} Division</p>
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
                    <p className="text-sm font-bold text-gray-800 font-[family-name:var(--font-display)]">📍 Location — {selectedArea.name}</p>
                  </div>
                  <div ref={mapRef} className="relative h-64 bg-gradient-to-br from-[#1a5276] to-[#154360]">
                    {/* Stylized map visualization */}
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                      backgroundSize: "20px 20px"
                    }} />
                    
                    {/* Neighborhood dots */}
                    {NEIGHBORHOODS.map((n) => {
                      const x = 20 + ((n.lng - 32.56) / 0.06) * 60;
                      const y = 80 - ((n.lat - 0.30) / 0.06) * 60;
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
                              <p className="text-[10px] text-gray-500">{n.lat.toFixed(4)}°N, {n.lng.toFixed(4)}°E</p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Legend */}
                    <div className="absolute bottom-3 left-3 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                      <div className="flex items-center gap-3 text-[10px] text-white/70">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> High</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Moderate</span>
                      </div>
                    </div>

                    <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                      <p className="text-[10px] text-white/60">Kampala, Uganda</p>
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
                      <div className="space-y-2">
                        {[
                          { label: "Rural Baseline", temp: 26, color: "bg-green-500" },
                          { label: selectedArea.name, temp: 26 + Math.round(selectedArea.heatRisk * 0.08), color: selectedArea.heatRisk >= 80 ? "bg-red-500" : "bg-orange-500" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-28 font-[family-name:var(--font-body)]">{item.label}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                              <div
                                className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                                style={{ width: `${(item.temp / 40) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-800 w-12 text-right font-[family-name:var(--font-display)]">{item.temp}°C</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-red-600 mt-2 font-semibold font-[family-name:var(--font-body)]">
                        +{Math.round(selectedArea.heatRisk * 0.08)}°C urban heat island effect
                      </p>
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

          {/* ═══ TAB: FORECAST ═══ */}
          {activeTab === "forecast" && (
            <div className="space-y-6 animate-fade-in">
              {hasFloodWarning && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <p className="text-red-800 font-bold text-lg font-[family-name:var(--font-display)]">Flood Warning Active — {selectedArea.name}</p>
                    <p className="text-red-600 text-sm mt-1 font-[family-name:var(--font-body)]">
                      Heavy rainfall predicted in the next 72 hours. Combined with {selectedArea.name}&apos;s drainage rating ({selectedArea.drainage.split("—")[0].trim()}), 
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
                        {selectedArea.division} Division, Kampala · Generated by KibiraAI
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

                  {/* Impact projections */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-4 font-[family-name:var(--font-body)]">
                      Projected Impact (5 Years)
                    </p>
                    <div className="space-y-3">
                      {[
                        {
                          metric: "Temperature Reduction",
                          value: `−${Math.round(selectedArea.heatRisk * 0.05)}°C`,
                          desc: "Average neighborhood cooling from tree canopy and cool roofs",
                          color: "text-blue-600",
                          bg: "bg-blue-50",
                          border: "border-blue-100",
                        },
                        {
                          metric: "Flood Damage Reduction",
                          value: `${Math.min(70, Math.round(selectedArea.floodRisk * 0.6))}%`,
                          desc: "Reduction in flood-related property damage and displacement",
                          color: "text-green-600",
                          bg: "bg-green-50",
                          border: "border-green-100",
                        },
                        {
                          metric: "Carbon Sequestered",
                          value: `${(selectedArea.treeRecommendations.reduce((s, t) => s + (typeof t.count === 'number' ? t.count : 50), 0) * 0.022).toFixed(1)} tonnes/yr`,
                          desc: "Annual CO₂ captured by planted trees at maturity",
                          color: "text-emerald-600",
                          bg: "bg-emerald-50",
                          border: "border-emerald-100",
                        },
                        {
                          metric: "People Protected",
                          value: selectedArea.population,
                          desc: "Residents benefiting from early warnings and cooling interventions",
                          color: "text-purple-600",
                          bg: "bg-purple-50",
                          border: "border-purple-100",
                        },
                      ].map((item, i) => (
                        <div key={i} className={`${item.bg} border ${item.border} rounded-xl p-4`}>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-700 font-[family-name:var(--font-body)]">{item.metric}</p>
                            <p className={`text-xl font-bold ${item.color} font-[family-name:var(--font-display)]`}>{item.value}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 font-[family-name:var(--font-body)]">{item.desc}</p>
                        </div>
                      ))}
                    </div>
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
                  Simulate sending a flood/heat early warning to {selectedArea.name} residents via SMS and WhatsApp.
                  In production, this triggers automatically when AI-predicted risk exceeds threshold.
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
                      {Math.floor(parseInt(selectedArea.population.replace(/[^0-9]/g, "")) * 0.6).toLocaleString()}
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
          <div className="mt-16 bg-gradient-to-br from-[#0c2d48] to-[#1a1a2e] rounded-[2.5rem] p-8 sm:p-14 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4 font-[family-name:var(--font-display)]">
                Protecting Kampala&apos;s Most Vulnerable
              </h2>
              <p className="text-white/60 text-lg max-w-xl mx-auto mb-8 font-[family-name:var(--font-body)]">
                This system is designed to scale across African cities — Lagos, Nairobi, Dar es Salaam, Accra. Every city deserves climate intelligence.
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
