"use client";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

const EUDR_COMMODITIES = [
  { name: "Coffee", icon: "☕" },
  { name: "Cocoa", icon: "🍫" },
  { name: "Palm Oil", icon: "🌴" },
  { name: "Timber", icon: "🪵" },
  { name: "Soy", icon: "🫘" },
  { name: "Rubber", icon: "🏭" },
  { name: "Cattle", icon: "🐄" },
];

export default function EUComplianceDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [coordLat, setCoordLat] = useState("");
  const [coordLng, setCoordLng] = useState("");
  const [searchMode, setSearchMode] = useState("name");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedView, setSelectedView] = useState("overview");
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Load persisted results
  useEffect(() => {
    try {
      const stored = localStorage.getItem("kibira_eu_results");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setResults(parsed);
          setSelectedResult(parsed[0]);
        }
      }
    } catch {}
  }, []);

  // Persist results
  useEffect(() => {
    try {
      if (results.length > 0) {
        localStorage.setItem("kibira_eu_results", JSON.stringify(results.slice(0, 10)));
      }
    } catch {}
  }, [results]);

  // Initialize Leaflet map
  const createMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current).setView([1.5, 30.0], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    mapInstanceRef.current = map;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || mapInstanceRef.current) return;

    const init = () => {
      if (!window.L) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => createMap();
        document.head.appendChild(script);
      } else {
        createMap();
      }
    };
    init();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [createMap]);

  const addMarker = useCallback((result) => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const { lat, lng } = result.location;
    const risk = result.analysis?.complianceAssessment?.riskScore || 0;
    const color = risk >= 70 ? "#dc2626" : risk >= 40 ? "#f59e0b" : "#16a34a";

    const icon = L.divIcon({
      className: "",
      html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold">${risk}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current);
    marker.bindPopup(`<strong>${result.location.name}</strong><br>Risk: ${risk}/100`);
    markersRef.current.push(marker);
  }, []);

  const flyTo = (lat, lng) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 10, { duration: 1.5 });
    }
  };

  // Analyze area
  const analyzeArea = async () => {
    setError("");
    setAnalyzing(true);

    try {
      const payload = searchMode === "coords"
        ? { lat: parseFloat(coordLat), lng: parseFloat(coordLng) }
        : { area: searchQuery.trim() };

      if (searchMode === "coords" && (isNaN(payload.lat) || isNaN(payload.lng))) {
        setError("Please enter valid coordinates.");
        setAnalyzing(false);
        return;
      }
      if (searchMode === "name" && !searchQuery.trim()) {
        setError("Please enter an area name.");
        setAnalyzing(false);
        return;
      }

      const res = await fetch("/api/eu-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Analysis failed.");
        setAnalyzing(false);
        return;
      }

      setResults((prev) => {
        const exists = prev.find(
          (r) => r.location.lat === data.location.lat && r.location.lng === data.location.lng
        );
        if (exists) return prev;
        return [data, ...prev].slice(0, 10);
      });

      setSelectedResult(data);
      setSelectedView("overview");
      addMarker(data);
      flyTo(data.location.lat, data.location.lng);
      setSearchQuery("");
      setCoordLat("");
      setCoordLng("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const removeResult = (idx) => {
    setResults((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      if (selectedResult === prev[idx]) {
        setSelectedResult(updated[0] || null);
      }
      // Rebuild markers
      if (mapInstanceRef.current && window.L) {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        updated.forEach((r) => addMarker(r));
      }
      return updated;
    });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f7faf6] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const a = selectedResult?.analysis;
  const ca = a?.complianceAssessment;
  const vh = a?.vegetationHealth;

  const getRiskColor = (score) => {
    if (score >= 70) return "text-red-600";
    if (score >= 40) return "text-orange-500";
    return "text-green-600";
  };

  const getRiskBg = (score) => {
    if (score >= 70) return "bg-red-50 border-red-200";
    if (score >= 40) return "bg-orange-50 border-orange-200";
    return "bg-green-50 border-green-200";
  };

  const getStatusBadge = (status) => {
    if (!status) return { color: "bg-gray-100 text-gray-600", icon: "—" };
    const s = status.toLowerCase();
    if (s.includes("non-compliant")) return { color: "bg-red-100 text-red-700", icon: "❌" };
    if (s.includes("at risk") || s.includes("needs")) return { color: "bg-orange-100 text-orange-700", icon: "⚠️" };
    return { color: "bg-green-100 text-green-700", icon: "✅" };
  };

  const getSeverityColor = (sev) => {
    if (!sev) return "text-gray-600 bg-gray-50";
    const s = sev.toLowerCase();
    if (s === "critical") return "text-red-700 bg-red-50";
    if (s === "high") return "text-orange-700 bg-orange-50";
    if (s === "medium") return "text-yellow-700 bg-yellow-50";
    return "text-green-700 bg-green-50";
  };

  return (
    <div className="min-h-screen bg-[#f7faf6]">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🇪🇺</span>
            <span className="font-[family-name:var(--font-display)] text-xl font-bold text-[#1b4332]">KibiraAI</span>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-[family-name:var(--font-body)] font-semibold">EU Compliance</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[#6b7c6b] hover:text-[#2d6a4f] font-[family-name:var(--font-body)] hidden sm:block">Home</Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {user.fullName?.charAt(0)?.toUpperCase() || "E"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">{user.fullName}</p>
                <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{user.company || "EU Compliance"}</p>
              </div>
              <button onClick={() => { logout(); router.push("/"); }} className="text-xs text-[#6b7c6b] hover:text-red-600 font-[family-name:var(--font-body)] px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
            🇪🇺 EU Deforestation Regulation (EUDR) Compliance
          </h1>
          <p className="text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)] text-sm">
            Search any sourcing area to verify deforestation-free compliance with real environmental data and AI analysis.
          </p>
        </div>

        {/* EUDR Info Banner */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-indigo-600 font-[family-name:var(--font-body)] font-semibold mb-1">EUDR REGULATION 2023/1115</p>
          <p className="text-sm text-indigo-800 font-[family-name:var(--font-body)]">
            Products entering the EU market must prove they were not produced on land deforested after <strong>December 31, 2020</strong>. Applies to: coffee, cocoa, soy, palm oil, timber, rubber, and cattle.
          </p>
        </div>

        {/* Search Area */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Analyze Sourcing Area</h2>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setSearchMode("name")} className={`text-xs px-3 py-1 rounded-md font-[family-name:var(--font-body)] transition-colors ${searchMode === "name" ? "bg-white shadow-sm font-semibold text-[#1a2e1a]" : "text-[#6b7c6b]"}`}>
                By Name
              </button>
              <button onClick={() => setSearchMode("coords")} className={`text-xs px-3 py-1 rounded-md font-[family-name:var(--font-body)] transition-colors ${searchMode === "coords" ? "bg-white shadow-sm font-semibold text-[#1a2e1a]" : "text-[#6b7c6b]"}`}>
                By Coordinates
              </button>
            </div>
          </div>

          {searchMode === "name" ? (
            <form onSubmit={(e) => { e.preventDefault(); analyzeArea(); }} className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter area name (e.g. Mabira Forest, Bugoma, Bwindi...)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
              />
              <button type="submit" disabled={analyzing || !searchQuery.trim()} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-body)]">
                {analyzing ? "Analyzing..." : "Analyze Area"}
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); analyzeArea(); }} className="flex gap-3 items-end">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#6b7c6b] mb-1 font-[family-name:var(--font-body)]">Latitude</label>
                  <input
                    type="text"
                    value={coordLat}
                    onChange={(e) => setCoordLat(e.target.value)}
                    placeholder="e.g. 0.4000"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b7c6b] mb-1 font-[family-name:var(--font-body)]">Longitude</label>
                  <input
                    type="text"
                    value={coordLng}
                    onChange={(e) => setCoordLng(e.target.value)}
                    placeholder="e.g. 33.0000"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
                  />
                </div>
              </div>
              <button type="submit" disabled={analyzing || (!coordLat || !coordLng)} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-body)]">
                {analyzing ? "Analyzing..." : "Analyze"}
              </button>
            </form>
          )}

          {error && <p className="text-sm text-red-600 mt-3 font-[family-name:var(--font-body)]">{error}</p>}
        </div>

        {/* Map + Analyzed Areas Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden" style={{ minHeight: 400 }}>
            <div ref={mapRef} style={{ height: 400, width: "100%" }} />
          </div>

          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4 max-h-[400px] overflow-y-auto">
            <h3 className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-3">Analyzed Areas ({results.length})</h3>
            {results.length === 0 ? (
              <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Search for areas above to start building your compliance portfolio.</p>
            ) : (
              <div className="space-y-2">
                {results.map((r, i) => {
                  const score = r.analysis?.complianceAssessment?.riskScore || 0;
                  const badge = getStatusBadge(r.analysis?.complianceAssessment?.complianceStatus);
                  const isSelected = selectedResult === r;
                  return (
                    <div
                      key={i}
                      onClick={() => { setSelectedResult(r); setSelectedView("overview"); flyTo(r.location.lat, r.location.lng); }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300" : "border-[#e5e7eb] hover:border-indigo-200 hover:bg-gray-50"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] truncate">{r.location.name}</p>
                          <p className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">{r.location.country}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold ${getRiskColor(score)}`}>{score}</span>
                          <button onClick={(e) => { e.stopPropagation(); removeResult(i); }} className="text-[#9ca3af] hover:text-red-500 text-xs ml-1">×</button>
                        </div>
                      </div>
                      <span className={`inline-block mt-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${badge.color}`}>
                        {badge.icon} {r.analysis?.complianceAssessment?.complianceStatus}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        {selectedResult && a && (
          <>
            {/* View Tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                { id: "overview", label: "📊 Compliance Overview" },
                { id: "commodities", label: "☕ Commodity Analysis" },
                { id: "threats", label: "⚠️ Threats & Risks" },
                { id: "documentation", label: "📋 Documentation" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedView(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-[family-name:var(--font-body)] transition-all ${
                    selectedView === tab.id
                      ? "bg-indigo-600 text-white font-semibold"
                      : "bg-white border border-[#e5e7eb] text-[#6b7c6b] hover:border-indigo-400"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {selectedView === "overview" && (
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-[1fr,300px] gap-4">
                  <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{a.areaInfo?.name || selectedResult.location.name}</h2>
                        <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">
                          {a.areaInfo?.region}, {a.areaInfo?.country || selectedResult.location.country} • {a.areaInfo?.estimatedArea}
                        </p>
                        <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mt-0.5">
                          📍 {selectedResult.location.lat.toFixed(4)}°N, {selectedResult.location.lng.toFixed(4)}°E • {a.areaInfo?.ecosystem}
                        </p>
                      </div>
                      {(() => {
                        const badge = getStatusBadge(ca?.complianceStatus);
                        return (
                          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold font-[family-name:var(--font-body)] ${badge.color}`}>
                            {badge.icon} {ca?.complianceStatus}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Deforestation Risk Score</span>
                        <span className={`text-lg font-bold font-[family-name:var(--font-display)] ${getRiskColor(ca?.riskScore || 0)}`}>{ca?.riskScore || 0}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-700 ${(ca?.riskScore || 0) >= 70 ? "bg-red-500" : (ca?.riskScore || 0) >= 40 ? "bg-orange-400" : "bg-green-500"}`}
                          style={{ width: `${ca?.riskScore || 0}%` }}
                        />
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">Key Findings</h3>
                    <ul className="space-y-1.5 mb-4">
                      {ca?.keyFindings?.map((f, i) => (
                        <li key={i} className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] flex items-start gap-2">
                          <span className="text-indigo-500 mt-0.5">•</span> {f}
                        </li>
                      ))}
                    </ul>

                    <div className={`rounded-xl p-4 border ${getRiskBg(ca?.riskScore || 0)}`}>
                      <h4 className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-1">Post-2020 Deforestation Assessment</h4>
                      <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{ca?.post2020Deforestation}</p>
                      <p className="text-[10px] text-[#9ca3af] font-[family-name:var(--font-body)] mt-2">Data confidence: {ca?.dataConfidence}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
                    <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-4">🌿 Vegetation Health</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">Canopy Cover</p>
                        <p className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{vh?.canopyCoverEstimate || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">Vegetation Trend</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full font-[family-name:var(--font-body)] ${
                          vh?.vegetationTrend === "Declining" || vh?.vegetationTrend === "Severely Degraded"
                            ? "bg-red-100 text-red-700"
                            : vh?.vegetationTrend === "Improving"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {vh?.vegetationTrend || "Unknown"}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">Soil Moisture</p>
                        <p className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">{vh?.soilMoistureStatus || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">Evapotranspiration</p>
                        <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{vh?.evapotranspirationNote || "N/A"}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#e5e7eb]">
                      <p className="text-[10px] text-[#9ca3af] font-[family-name:var(--font-body)] mb-1.5">Data Sources</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedResult.dataSources?.weather && <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-[family-name:var(--font-body)]">Weather ✓</span>}
                        {selectedResult.dataSources?.soil && <span className="text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-[family-name:var(--font-body)]">Soil ✓</span>}
                        {selectedResult.dataSources?.airQuality && <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-[family-name:var(--font-body)]">Air Quality ✓</span>}
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-[family-name:var(--font-body)]">AI Analysis ✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Commodities Tab */}
            {selectedView === "commodities" && a.commodityAnalysis && (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden mb-8">
                <div className="p-5 border-b border-[#e5e7eb]">
                  <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">☕ Commodity Risk — {selectedResult.location.name}</h2>
                  <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mt-1">EUDR-regulated commodity assessment for this sourcing area</p>
                </div>
                <div className="divide-y divide-[#f0f0f0]">
                  {a.commodityAnalysis.map((c, i) => {
                    const emoji = EUDR_COMMODITIES.find((x) => x.name.toLowerCase() === c.commodity?.toLowerCase())?.icon || "📦";
                    return (
                      <div key={i} className="p-5 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <span className="text-3xl">{emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{c.commodity}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-[family-name:var(--font-body)] ${
                                c.riskLevel === "Critical" ? "bg-red-100 text-red-700" :
                                c.riskLevel === "High" ? "bg-orange-100 text-orange-700" :
                                c.riskLevel === "Moderate" ? "bg-yellow-100 text-yellow-700" :
                                "bg-green-100 text-green-700"
                              }`}>{c.riskLevel} Risk</span>
                              {c.producedInArea && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-[family-name:var(--font-body)]">Produced in area</span>
                              )}
                            </div>
                            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-1">{c.eudrImplication}</p>
                            <p className="text-xs text-indigo-700 font-[family-name:var(--font-body)]">
                              <strong>Verification:</strong> {c.verificationNeeded}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Threats Tab */}
            {selectedView === "threats" && a.threats && (
              <div className="space-y-4 mb-8">
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                  <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-4">⚠️ Identified Threats — {selectedResult.location.name}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {a.threats.map((t, i) => (
                      <div key={i} className={`rounded-xl border p-4 ${getSeverityColor(t.severity)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold font-[family-name:var(--font-display)]">{t.type}</h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/60 font-[family-name:var(--font-body)]">{t.severity}</span>
                        </div>
                        <p className="text-xs font-[family-name:var(--font-body)] opacity-80">{t.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {a.recommendations && (
                  <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                    <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-3">💡 Recommendations</h3>
                    <ul className="space-y-2">
                      {a.recommendations.map((r, i) => (
                        <li key={i} className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] flex items-start gap-2">
                          <span className="text-indigo-500 font-bold">{i + 1}.</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Documentation Tab */}
            {selectedView === "documentation" && (
              <div className="space-y-4 mb-8">
                {a.requiredDocumentation && (
                  <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                    <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-4">📋 Required Documentation</h2>
                    <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-4">
                      Documents needed to demonstrate EUDR compliance for products sourced from {selectedResult.location.name}:
                    </p>
                    <div className="space-y-2">
                      {a.requiredDocumentation.map((doc, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-indigo-600 font-bold text-xs mt-0.5">📄</span>
                          <p className="text-xs text-[#1a2e1a] font-[family-name:var(--font-body)]">{doc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {a.dueDiligenceSteps && (
                  <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                    <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-3">🔍 Due Diligence Steps</h3>
                    <div className="space-y-3">
                      {a.dueDiligenceSteps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                          <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!selectedResult && results.length === 0 && !analyzing && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center mb-8">
            <div className="text-5xl mb-4">🗺️</div>
            <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">Start Your Compliance Analysis</h2>
            <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] mb-6 max-w-md mx-auto">
              Search for a forest, farming area, or sourcing region to get an AI-powered EUDR compliance assessment with real environmental data.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Mabira Forest", "Bugoma Forest", "Bwindi", "Kibale Forest", "Congo Basin", "Mount Elgon"].map((q) => (
                <button
                  key={q}
                  onClick={() => { setSearchQuery(q); setSearchMode("name"); }}
                  className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full font-[family-name:var(--font-body)] hover:bg-indigo-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Analyzing spinner */}
        {analyzing && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center mb-8">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-display)]">Analyzing area...</p>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mt-1">Fetching environmental data and running AI compliance assessment</p>
          </div>
        )}

        {/* Tools */}
        <h2 className="text-lg font-bold text-[#1a2e1a] mb-4 font-[family-name:var(--font-display)]">🛠️ Your Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/advisor" className="bg-white rounded-xl p-5 border border-[#e5e7eb] hover:shadow-md hover:border-indigo-300 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🌿</span>
              <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Dr. Kibira AI</h3>
            </div>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">AI-powered deforestation analysis, compliance reports, and satellite data interpretation.</p>
            <span className="text-sm text-indigo-600 font-semibold font-[family-name:var(--font-body)] group-hover:underline">Start Analysis →</span>
          </Link>
          <Link href="/forest-sentinel" className="bg-white rounded-xl p-5 border border-[#e5e7eb] hover:shadow-md hover:border-indigo-300 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🌲</span>
              <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Forest Sentinel</h3>
            </div>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">Real-time forest monitoring with satellite imagery and deforestation alerts.</p>
            <span className="text-sm text-indigo-600 font-semibold font-[family-name:var(--font-body)] group-hover:underline">Monitor Forests →</span>
          </Link>
          <Link href="/urban-warning" className="bg-white rounded-xl p-5 border border-[#e5e7eb] hover:shadow-md hover:border-indigo-300 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🏙️</span>
              <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Climate Data</h3>
            </div>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">Environmental climate data for sourcing areas — rainfall, temperature, and ecosystem health.</p>
            <span className="text-sm text-indigo-600 font-semibold font-[family-name:var(--font-body)] group-hover:underline">View Data →</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
