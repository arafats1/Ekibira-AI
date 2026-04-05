"use client";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function InsuranceDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [riskData, setRiskData] = useState({});
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [selectedView, setSelectedView] = useState("overview");
  const [areaInput, setAreaInput] = useState("");
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const addArea = async (areaName) => {
    if (!areaName.trim() || areas.includes(areaName.trim())) return;
    const area = areaName.trim();
    setAreas((prev) => [...prev, area]);
    setLoadingRisk(true);
    try {
      const [floodRes, heatRes] = await Promise.all([
        fetch("/api/flood-risk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ neighborhood: area }),
        }),
        fetch("/api/heat-risk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ neighborhood: area }),
        }),
      ]);
      const flood = await floodRes.json();
      const heat = await heatRes.json();
      setRiskData((prev) => ({ ...prev, [area]: { flood, heat } }));
    } catch { /* silently fail */ }
    setLoadingRisk(false);
  };

  const removeArea = (area) => {
    setAreas((prev) => prev.filter((a) => a !== area));
    setRiskData((prev) => { const next = { ...prev }; delete next[area]; return next; });
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

  const getRiskColor = (score) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-500";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getRiskBg = (score) => {
    if (score >= 80) return "bg-red-50 border-red-200";
    if (score >= 60) return "bg-orange-50 border-orange-200";
    if (score >= 40) return "bg-yellow-50 border-yellow-200";
    return "bg-green-50 border-green-200";
  };

  const getRiskLabel = (score) => {
    if (score >= 80) return "Critical";
    if (score >= 60) return "High";
    if (score >= 40) return "Moderate";
    return "Low";
  };

  const getPremiumMultiplier = (floodScore, heatScore) => {
    const combined = (floodScore * 0.6 + heatScore * 0.4);
    if (combined >= 80) return "2.5x - 3.0x";
    if (combined >= 60) return "1.8x - 2.5x";
    if (combined >= 40) return "1.2x - 1.8x";
    return "1.0x - 1.2x";
  };

  const getClaimLikelihood = (floodScore, heatScore) => {
    const combined = (floodScore * 0.6 + heatScore * 0.4);
    if (combined >= 80) return "Very High (>60%)";
    if (combined >= 60) return "High (35-60%)";
    if (combined >= 40) return "Moderate (15-35%)";
    return "Low (<15%)";
  };

  // Summary metrics
  const allAreas = Object.keys(riskData);
  const avgFlood = allAreas.length ? Math.round(allAreas.reduce((s, a) => s + (riskData[a]?.flood?.riskScore || 0), 0) / allAreas.length) : 0;
  const avgHeat = allAreas.length ? Math.round(allAreas.reduce((s, a) => s + (riskData[a]?.heat?.heatIndex || 0), 0) / allAreas.length) : 0;
  const criticalAreas = allAreas.filter(a => (riskData[a]?.flood?.riskScore || 0) >= 80 || (riskData[a]?.heat?.heatIndex || 0) >= 80).length;

  return (
    <div className="min-h-screen bg-[#f7faf6]">
      {/* Top Bar */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="font-[family-name:var(--font-display)] text-xl font-bold text-[#1b4332]">KibiraAI</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-[family-name:var(--font-body)] font-semibold">Insurance</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[#6b7c6b] hover:text-[#2d6a4f] font-[family-name:var(--font-body)] hidden sm:block">Home</Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {user.fullName?.charAt(0)?.toUpperCase() || "I"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">{user.fullName}</p>
                <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{user.company || "Insurance"}</p>
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
            🛡️ Insurance Risk Intelligence
          </h1>
          <p className="text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)]">
            Climate risk data for underwriting, portfolio analysis, and loss prediction across monitored areas.
          </p>
        </div>

        {/* Area Search */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 mb-8">
          <h2 className="text-sm font-bold text-[#1a2e1a] mb-3 font-[family-name:var(--font-display)]">Add Areas to Monitor</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (areaInput.trim()) { addArea(areaInput); setAreaInput(""); } }} className="flex gap-3 mb-4">
            <input
              type="text"
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              placeholder="Enter area name (e.g. Bwaise, Lira, Gulu, Mbale...)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
            />
            <button type="submit" disabled={!areaInput.trim() || loadingRisk} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-body)]">
              {loadingRisk ? "Adding..." : "Add Area"}
            </button>
          </form>
          {areas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {areas.map((area) => (
                <span key={area} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold font-[family-name:var(--font-body)]">
                  {area}
                  <button onClick={() => removeArea(area)} className="hover:text-red-600 transition-colors">×</button>
                </span>
              ))}
            </div>
          )}
          {areas.length === 0 && (
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Search and add areas to build your risk portfolio.</p>
          )}
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-[#e5e7eb]">
            <div className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] mb-1">Areas Monitored</div>
            <div className="text-3xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{areas.length}</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-[#e5e7eb]">
            <div className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] mb-1">Avg Flood Risk</div>
            <div className={`text-3xl font-bold font-[family-name:var(--font-display)] ${getRiskColor(avgFlood)}`}>{loadingRisk ? "..." : avgFlood}/100</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-[#e5e7eb]">
            <div className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] mb-1">Avg Heat Risk</div>
            <div className={`text-3xl font-bold font-[family-name:var(--font-display)] ${getRiskColor(avgHeat)}`}>{loadingRisk ? "..." : avgHeat}/100</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-[#e5e7eb]">
            <div className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] mb-1">Critical Zones</div>
            <div className="text-3xl font-bold text-red-600 font-[family-name:var(--font-display)]">{loadingRisk ? "..." : criticalAreas}</div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "overview", label: "Risk Overview" },
            { id: "underwriting", label: "Underwriting Data" },
            { id: "claims", label: "Loss Prediction" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-[family-name:var(--font-body)] transition-all ${
                selectedView === tab.id
                  ? "bg-blue-600 text-white font-semibold"
                  : "bg-white border border-[#e5e7eb] text-[#6b7c6b] hover:border-blue-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Risk Overview Table */}
        {selectedView === "overview" && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden mb-8">
            <div className="p-6 border-b border-[#e5e7eb]">
              <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Area Risk Overview</h2>
              <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mt-1">Real-time climate risk scores for all monitored neighborhoods</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold text-[#6b7c6b] font-[family-name:var(--font-body)]">Area</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#6b7c6b] font-[family-name:var(--font-body)]">Flood Risk</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#6b7c6b] font-[family-name:var(--font-body)]">Heat Risk</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#6b7c6b] font-[family-name:var(--font-body)]">Combined</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#6b7c6b] font-[family-name:var(--font-body)]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">Add areas above to see risk data</td></tr>
                  ) : areas.map((area) => {
                    const flood = riskData[area]?.flood?.riskScore || 0;
                    const heat = riskData[area]?.heat?.heatIndex || 0;
                    const combined = Math.round(flood * 0.6 + heat * 0.4);
                    return (
                      <tr key={area} className="border-t border-[#f0f0f0] hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">{area}</td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold font-[family-name:var(--font-display)] ${getRiskColor(flood)}`}>{loadingRisk ? "..." : flood}</span>
                          <span className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">/100</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold font-[family-name:var(--font-display)] ${getRiskColor(heat)}`}>{loadingRisk ? "..." : heat}</span>
                          <span className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">/100</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold font-[family-name:var(--font-display)] ${getRiskColor(combined)}`}>{loadingRisk ? "..." : combined}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold font-[family-name:var(--font-body)] ${getRiskBg(combined)}`}>
                            {getRiskLabel(combined)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Underwriting Data */}
        {selectedView === "underwriting" && (
          <div className="space-y-4 mb-8">
            <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
              <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-4">📊 Premium Risk Multipliers</h2>
              <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-4">
                Suggested premium adjustments based on climate risk scoring (60% flood weight, 40% heat weight).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {areas.map((area) => {
                  const flood = riskData[area]?.flood?.riskScore || 0;
                  const heat = riskData[area]?.heat?.heatIndex || 0;
                  const combined = Math.round(flood * 0.6 + heat * 0.4);
                  return (
                    <div key={area} className={`rounded-xl p-4 border ${getRiskBg(combined)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{area}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold font-[family-name:var(--font-body)] ${getRiskBg(combined)}`}>
                          {getRiskLabel(combined)}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-[family-name:var(--font-body)]">
                          <span className="text-[#6b7c6b]">Premium Multiplier</span>
                          <span className="font-bold text-[#1a2e1a]">{getPremiumMultiplier(flood, heat)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-[family-name:var(--font-body)]">
                          <span className="text-[#6b7c6b]">Crop Insurance Risk</span>
                          <span className={`font-bold ${getRiskColor(flood)}`}>{getRiskLabel(flood)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-[family-name:var(--font-body)]">
                          <span className="text-[#6b7c6b]">Property Insurance Risk</span>
                          <span className={`font-bold ${getRiskColor(heat)}`}>{getRiskLabel(heat)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Loss Prediction */}
        {selectedView === "claims" && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden mb-8">
            <div className="p-6 border-b border-[#e5e7eb]">
              <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">📉 Loss Prediction Model</h2>
              <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mt-1">Estimated claim likelihood per area based on current climate risk data</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold text-[#6b7c6b] font-[family-name:var(--font-body)]">Area</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#6b7c6b] font-[family-name:var(--font-body)]">Claim Likelihood</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#6b7c6b] font-[family-name:var(--font-body)]">Primary Risk</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#6b7c6b] font-[family-name:var(--font-body)]">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">Add areas above to see predictions</td></tr>
                  ) : areas.map((area) => {
                    const flood = riskData[area]?.flood?.riskScore || 0;
                    const heat = riskData[area]?.heat?.heatIndex || 0;
                    const primaryRisk = flood > heat ? "Flooding" : "Heat Stress";
                    const combined = Math.round(flood * 0.6 + heat * 0.4);
                    let recommendation = "Standard coverage";
                    if (combined >= 80) recommendation = "Limit exposure, increase premiums, require mitigation";
                    else if (combined >= 60) recommendation = "Higher premiums, add flood/heat exclusions";
                    else if (combined >= 40) recommendation = "Standard with climate rider";
                    return (
                      <tr key={area} className="border-t border-[#f0f0f0] hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">{area}</td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold font-[family-name:var(--font-body)] ${getRiskColor(combined)}`}>{getClaimLikelihood(flood, heat)}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">{primaryRisk}</td>
                        <td className="px-6 py-4 text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] max-w-xs">{recommendation}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tools */}
        <h2 className="text-lg font-bold text-[#1a2e1a] mb-4 font-[family-name:var(--font-display)]">🛠️ Analysis Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/advisor" className="bg-white rounded-xl p-5 border border-[#e5e7eb] hover:shadow-md hover:border-blue-300 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🌿</span>
              <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Dr. Kibira AI</h3>
            </div>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">Deep-dive climate risk analysis for any African region. Get deforestation data, carbon metrics, and projections.</p>
            <span className="text-sm text-blue-600 font-semibold font-[family-name:var(--font-body)] group-hover:underline">Run Analysis →</span>
          </Link>
          <Link href="/urban-warning" className="bg-white rounded-xl p-5 border border-[#e5e7eb] hover:shadow-md hover:border-blue-300 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🏙️</span>
              <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Urban Warning</h3>
            </div>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">Detailed flood and heat mapping with 5-day forecasts and neighborhood-level vulnerability data.</p>
            <span className="text-sm text-blue-600 font-semibold font-[family-name:var(--font-body)] group-hover:underline">View Details →</span>
          </Link>
          <Link href="/forest-sentinel" className="bg-white rounded-xl p-5 border border-[#e5e7eb] hover:shadow-md hover:border-blue-300 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🌲</span>
              <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Forest Sentinel</h3>
            </div>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">Monitor deforestation risk in real-time. Essential for forestry and agricultural insurance portfolios.</p>
            <span className="text-sm text-blue-600 font-semibold font-[family-name:var(--font-body)] group-hover:underline">Monitor →</span>
          </Link>
        </div>

        {/* Quick Queries */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 sm:p-8 text-white">
          <h3 className="text-lg font-bold font-[family-name:var(--font-display)] mb-3">💡 Insurance-Specific AI Queries</h3>
          <div className="flex flex-wrap gap-2">
            {[
              "Climate risk assessment for Kampala flood zones",
              "Crop failure probability in central Uganda this season",
              "Deforestation impact on rainfall patterns in East Africa",
              "Heat stress projections for urban areas 2025-2030",
              "Carbon credit insurance opportunities in Africa",
            ].map((q, i) => (
              <Link key={i} href={`/advisor?q=${encodeURIComponent(q)}`} className="text-xs bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-2 rounded-full font-[family-name:var(--font-body)] transition-colors">
                {q}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
