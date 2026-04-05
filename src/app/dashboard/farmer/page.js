"use client";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const SEASON_ICONS = { "Dry": "☀️", "Rainy": "🌧️", "Long Rains": "🌧️", "Short Rains": "🌦️", "Short Dry": "🔧", "Wet": "🌧️", "Planting": "🌱", "Harvest": "🌾", "Preparation": "🔧" };

export default function FarmerDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [analysis, setAnalysis] = useState(null);
  const [selectedArea, setSelectedArea] = useState("");
  const [areaInput, setAreaInput] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const fetchFarmerData = async (area) => {
    setLoadingData(true);
    setError(null);
    try {
      const res = await fetch("/api/farmer-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: area }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setAnalysis(null);
      } else {
        setAnalysis(data.analysis);
      }
    } catch {
      setError("Failed to fetch data. Please try again.");
      setAnalysis(null);
    }
    setLoadingData(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (areaInput.trim()) {
      setSelectedArea(areaInput.trim());
      fetchFarmerData(areaInput.trim());
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f7faf6] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#2d6a4f]">
          <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
          <span className="font-[family-name:var(--font-body)] text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  const floodScore = analysis?.floodRisk || 0;
  const heatScore = analysis?.heatStress || 0;
  const soil = analysis?.soil;

  const getRiskColor = (score) => {
    if (score >= 80) return "text-red-600 bg-red-50 border-red-200";
    if (score >= 60) return "text-orange-600 bg-orange-50 border-orange-200";
    if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getRiskLabel = (score) => {
    if (score >= 80) return "Critical";
    if (score >= 60) return "High";
    if (score >= 40) return "Moderate";
    return "Low";
  };

  const getSoilColor = (level) => {
    if (level === "Saturated" || level === "High") return "text-blue-700 bg-blue-50 border-blue-200";
    if (level === "Adequate" || level === "Moderate") return "text-cyan-700 bg-cyan-50 border-cyan-200";
    return "text-amber-700 bg-amber-50 border-amber-200";
  };

  return (
    <div className="min-h-screen bg-[#f7faf6]">
      {/* Top Bar */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="font-[family-name:var(--font-display)] text-xl font-bold text-[#1b4332]">KibiraAI</span>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-[family-name:var(--font-body)] font-semibold">Farmer</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[#6b7c6b] hover:text-[#2d6a4f] font-[family-name:var(--font-body)] hidden sm:block">Home</Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold">
                {user.fullName?.charAt(0)?.toUpperCase() || "F"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">{user.fullName}</p>
                <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{user.company || "Farmer"}</p>
              </div>
              <button onClick={() => { logout(); router.push("/"); }} className="text-xs text-[#6b7c6b] hover:text-red-600 font-[family-name:var(--font-body)] px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
            🌾 Welcome, {user.fullName?.split(" ")[0]}
          </h1>
          <p className="text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)]">
            Your climate-smart farming dashboard — real weather data, location-specific crop planning, and agroforestry guidance.
          </p>
        </div>

        {/* Area Search */}
        <div className="mb-6">
          <label className="text-sm font-medium text-[#1a2e1a] font-[family-name:var(--font-body)] mb-2 block">Search your area for real climate data:</label>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              placeholder="Enter area name (e.g. Karamoja, Kabale, Gulu, Mbale, Lira...)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
            />
            <button
              type="submit"
              disabled={!areaInput.trim() || loadingData}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-body)]"
            >
              {loadingData ? "Analyzing..." : "Search"}
            </button>
          </form>
          {selectedArea && analysis && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">
                Showing real data for: <span className="font-semibold text-amber-700">{analysis.locationName}</span>
                {analysis.district && <span className="text-[#6b7c6b]"> • {analysis.district}</span>}
                {analysis.climateZone && <span className="text-[#6b7c6b]"> • {analysis.climateZone}</span>}
                {analysis.elevation && <span className="text-[#6b7c6b]"> • {analysis.elevation}</span>}
              </p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loadingData && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 mb-8 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">Fetching real climate data for {selectedArea}...</p>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mt-1">Weather, soil moisture, historical rainfall, and AI crop analysis</p>
          </div>
        )}

        {/* Error State */}
        {error && !loadingData && (
          <div className="bg-red-50 rounded-2xl border border-red-200 p-6 mb-8">
            <p className="text-sm font-semibold text-red-800 font-[family-name:var(--font-body)]">⚠️ {error}</p>
          </div>
        )}

        {/* Results — only shown once data is loaded */}
        {analysis && !loadingData && (
          <>
            {/* Risk Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Flood Risk */}
              <div className={`rounded-xl p-5 border ${getRiskColor(floodScore)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold font-[family-name:var(--font-body)]">Flood Risk</span>
                  <span className="text-2xl">🌊</span>
                </div>
                <div className="text-3xl font-bold font-[family-name:var(--font-display)]">{floodScore}/100</div>
                <div className="text-xs mt-1 font-[family-name:var(--font-body)]">{getRiskLabel(floodScore)}</div>
              </div>

              {/* Heat/Drought Stress */}
              <div className={`rounded-xl p-5 border ${getRiskColor(heatScore)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold font-[family-name:var(--font-body)]">Heat / Drought Stress</span>
                  <span className="text-2xl">🌡️</span>
                </div>
                <div className="text-3xl font-bold font-[family-name:var(--font-display)]">{heatScore}/100</div>
                <div className="text-xs mt-1 font-[family-name:var(--font-body)]">{getRiskLabel(heatScore)}</div>
              </div>

              {/* Soil Moisture — from real sensor data */}
              <div className={`rounded-xl p-5 border ${soil ? getSoilColor(soil.level) : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold font-[family-name:var(--font-body)]">Soil Moisture</span>
                  <span className="text-2xl">💧</span>
                </div>
                <div className="text-3xl font-bold font-[family-name:var(--font-display)]">
                  {soil ? soil.level : "—"}
                </div>
                <div className="text-xs mt-1 font-[family-name:var(--font-body)]">
                  {soil?.currentMoisture != null ? `${soil.currentMoisture}% vol` : "No data"}
                  {soil?.soilTemp != null && ` • ${soil.soilTemp}°C soil temp`}
                </div>
              </div>

              {/* Climate Zone / Season */}
              <div className="rounded-xl p-5 border border-emerald-200 bg-emerald-50 text-emerald-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold font-[family-name:var(--font-body)]">Climate Zone</span>
                  <span className="text-2xl">🌍</span>
                </div>
                <div className="text-lg font-bold font-[family-name:var(--font-display)] leading-tight">
                  {analysis.climateZone || "Tropical"}
                </div>
                <div className="text-xs mt-1 font-[family-name:var(--font-body)]">
                  {analysis.annualRainfallMm ? `~${analysis.annualRainfallMm}mm/yr` : ""} 
                  {analysis.soilType ? ` • ${analysis.soilType}` : ""}
                </div>
              </div>
            </div>

            {/* 7-Day Weather Forecast */}
            {analysis.forecast && analysis.forecast.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 mb-8">
                <h2 className="text-lg font-bold text-[#1a2e1a] mb-4 font-[family-name:var(--font-display)]">
                  🌤️ 7-Day Weather Forecast — {analysis.locationName}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {analysis.forecast.map((day, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">{day.date}</p>
                      <p className="text-xl my-1">{day.condition === "Sunny" ? "☀️" : day.condition === "Heavy Rain" ? "🌧️" : day.condition === "Light Rain" || day.condition === "Showers" ? "🌦️" : day.condition === "Thunderstorm" ? "⛈️" : day.condition === "Drizzle" ? "🌧️" : "☁️"}</p>
                      <p className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">{day.condition}</p>
                      <p className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-body)] mt-1">{day.tempHigh}° / {day.tempLow}°</p>
                      <p className="text-[10px] text-blue-600 font-[family-name:var(--font-body)]">{day.rainfall}mm rain</p>
                      {day.wind > 0 && <p className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">💨 {day.wind} km/h</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Climate-Smart Advice — from AI, specific to this location */}
            {analysis.climateAdvice && analysis.climateAdvice.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 mb-8">
                <h2 className="text-lg font-bold text-[#1a2e1a] mb-4 font-[family-name:var(--font-display)]">
                  🧠 Climate-Smart Advice for {analysis.locationName}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.climateAdvice.map((advice, i) => {
                    const icons = ["🌱", "💧", "🌤️", "📊"];
                    const styles = [
                      "bg-green-50 border-green-100",
                      "bg-blue-50 border-blue-100",
                      "bg-amber-50 border-amber-100",
                      "bg-emerald-50 border-emerald-100",
                    ];
                    return (
                      <div key={i} className={`flex gap-3 p-4 rounded-xl border ${styles[i % styles.length]}`}>
                        <span className="text-xl flex-shrink-0">{icons[i % icons.length]}</span>
                        <p className="text-xs text-[#3d4f3d] font-[family-name:var(--font-body)] leading-relaxed">{advice}</p>
                      </div>
                    );
                  })}
                </div>
                {analysis.waterHarvestingAdvice && (
                  <div className="mt-4 flex gap-3 p-4 bg-cyan-50 rounded-xl border border-cyan-100">
                    <span className="text-xl flex-shrink-0">🚿</span>
                    <div>
                      <p className="text-xs font-semibold text-cyan-800 font-[family-name:var(--font-body)] mb-1">Water Harvesting</p>
                      <p className="text-xs text-cyan-700 font-[family-name:var(--font-body)] leading-relaxed">{analysis.waterHarvestingAdvice}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rainfall Pattern — from historical data */}
            {analysis.rainfallProfile && (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 mb-8">
                <h2 className="text-lg font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">
                  📊 Annual Rainfall Pattern — {analysis.locationName}
                </h2>
                <p className="text-xs text-[#6b7c6b] mb-4 font-[family-name:var(--font-body)]">
                  {analysis.rainySeasons || "Historical monthly rainfall based on the past 12 months"}
                </p>
                <div className="flex items-end gap-1 sm:gap-2 h-40">
                  {analysis.rainfallProfile.map((m, i) => {
                    const maxRain = Math.max(...analysis.rainfallProfile.map(r => r.rainfallMm), 1);
                    const height = Math.max(4, (m.rainfallMm / maxRain) * 100);
                    const isWet = m.rainfallMm > maxRain * 0.4;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                        <p className="text-[9px] font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1">{m.rainfallMm}mm</p>
                        <div
                          className={`w-full rounded-t-md transition-all ${isWet ? 'bg-blue-500' : 'bg-amber-400'}`}
                          style={{ height: `${height}%`, minHeight: "4px" }}
                        />
                        <p className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)] mt-1">{m.month}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-blue-500" /><span className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">Wet months</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-amber-400" /><span className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">Dry months</span></div>
                </div>
              </div>
            )}

            {/* Two Column: Crop Calendar + Agroforestry */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Crop Calendar — from AI, specific to this location's climate */}
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                <h2 className="text-lg font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">📅 Crop Calendar — {analysis.locationName}</h2>
                <p className="text-xs text-[#6b7c6b] mb-4 font-[family-name:var(--font-body)]">
                  Based on {analysis.climateZone} climate with {analysis.annualRainfallMm ? `~${analysis.annualRainfallMm}mm` : ""} annual rainfall
                </p>
                <div className="space-y-3">
                  {analysis.cropCalendar.map((item, i) => {
                    const icon = Object.entries(SEASON_ICONS).find(([k]) => item.season?.toLowerCase().includes(k.toLowerCase()))?.[1] || "📋";
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xl mt-0.5">{icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{item.months}</span>
                            <span className="text-[10px] bg-[#2d6a4f] text-white px-2 py-0.5 rounded-full font-[family-name:var(--font-body)]">{item.season}</span>
                          </div>
                          <p className="text-xs text-[#4a5c4a] mt-1 font-[family-name:var(--font-body)]">{item.activity}</p>
                          {item.crops && <p className="text-xs text-amber-700 mt-1 font-[family-name:var(--font-body)] font-medium">Crops: {item.crops}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {analysis.majorCrops && analysis.majorCrops.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-2">Major crops in this area:</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.majorCrops.map((crop, i) => (
                        <span key={i} className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-[family-name:var(--font-body)]">{crop}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Agroforestry Species — from AI, specific to this location */}
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                <h2 className="text-lg font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">🌳 Agroforestry Species — {analysis.locationName}</h2>
                <p className="text-xs text-[#6b7c6b] mb-4 font-[family-name:var(--font-body)]">
                  Trees recommended for this specific climate zone and altitude.
                </p>
                <div className="space-y-3">
                  {analysis.agroforestrySpecies.map((sp, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      <span className="text-xl mt-0.5">🌿</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] italic">{sp.name}</p>
                        <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{sp.use}</p>
                        {sp.suitability && <p className="text-xs text-emerald-700 mt-1 font-[family-name:var(--font-body)]">{sp.suitability}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-[#2d6a4f] font-[family-name:var(--font-body)]">{sp.co2PerHaPerYear || sp.co2}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Sources */}
            {analysis.dataSources && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-8">
                <p className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">
                  <span className="font-semibold">Data sources:</span>{" "}
                  Weather: {analysis.dataSources.weather} • Flood: {analysis.dataSources.flood} • Climate: {analysis.dataSources.climate} • Analysis: {analysis.dataSources.analysis}
                </p>
              </div>
            )}
          </>
        )}

        {/* Empty state — no area searched yet */}
        {!analysis && !loadingData && !error && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center mb-8">
            <span className="text-5xl mb-4 block">🌍</span>
            <h3 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">Search your area to get started</h3>
            <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] max-w-md mx-auto">
              Enter your location above to get real weather data, location-specific crop calendars, flood and drought risk scores, and agroforestry recommendations tailored to your area&apos;s climate.
            </p>
          </div>
        )}

        {/* Quick Access Tools */}
        <h2 className="text-lg font-bold text-[#1a2e1a] mb-4 font-[family-name:var(--font-display)]">🛠️ Your Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/dashboard/farmer/my-farm" className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border-2 border-amber-300 hover:shadow-md hover:border-amber-400 transition-all group relative overflow-hidden">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🌱</span>
              <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">My Farm</h3>
            </div>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">Track your crops, get AI-powered daily actions based on real weather, and log harvests.</p>
            <span className="text-sm text-amber-700 font-semibold font-[family-name:var(--font-body)] group-hover:underline">Manage Crops →</span>
            <span className="absolute top-2 right-2 text-[9px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-[family-name:var(--font-body)] font-bold">NEW</span>
          </Link>

          <Link href="/advisor" className="bg-white rounded-xl p-5 border border-[#e5e7eb] hover:shadow-md hover:border-amber-300 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🌿</span>
              <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Dr. Kibira AI</h3>
            </div>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">Ask about crop disease, climate predictions, soil improvement, or carbon credit opportunities for your farm.</p>
            <span className="text-sm text-amber-600 font-semibold font-[family-name:var(--font-body)] group-hover:underline">Ask a Question →</span>
          </Link>

          <Link href="/urban-warning" className="bg-white rounded-xl p-5 border border-[#e5e7eb] hover:shadow-md hover:border-blue-300 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🌧️</span>
              <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Weather Alerts</h3>
            </div>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">Get 24-72 hour flood and heat warnings for your area. Plan harvesting and planting around weather events.</p>
            <span className="text-sm text-blue-600 font-semibold font-[family-name:var(--font-body)] group-hover:underline">Check Alerts →</span>
          </Link>

          <Link href="/plant-a-tree" className="bg-white rounded-xl p-5 border border-[#e5e7eb] hover:shadow-md hover:border-green-300 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🌱</span>
              <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Plant Trees</h3>
            </div>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">Start an agroforestry project on your farm. Each tree sequesters up to 22kg of CO₂ per year and earns carbon credits.</p>
            <span className="text-sm text-green-600 font-semibold font-[family-name:var(--font-body)] group-hover:underline">Get Started →</span>
          </Link>
        </div>

        {/* Quick Queries for Dr. Kibira */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-6 sm:p-8 text-white">
          <h3 className="text-lg font-bold font-[family-name:var(--font-display)] mb-3">💡 Quick Questions for Dr. Kibira AI</h3>
          <p className="text-sm text-white/80 font-[family-name:var(--font-body)] mb-4">Click any question to get instant AI-powered farming advice:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Best crops for my region this season?",
              "How to start agroforestry on 2 acres?",
              "Drought-resistant crop varieties for Uganda",
              "How to earn carbon credits from my farm?",
              "Organic pest control for maize",
              "Water harvesting techniques for small farms",
            ].map((q, i) => (
              <Link
                key={i}
                href={`/advisor?q=${encodeURIComponent(q)}`}
                className="text-xs bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-2 rounded-full font-[family-name:var(--font-body)] transition-colors"
              >
                {q}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
