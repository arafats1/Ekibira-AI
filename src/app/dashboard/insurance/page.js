"use client";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const PLAN_TIERS = {
  "insurance-basic": { name: "Starter", price: 49, maxAreas: 3, color: "blue" },
  "insurance-professional": { name: "Professional", price: 199, maxAreas: 15, color: "purple" },
  "insurance-enterprise": { name: "Enterprise", price: 499, maxAreas: 100, color: "amber" },
};

export default function InsuranceDashboard() {
  const { user, loading, logout, getToken } = useAuth();
  const router = useRouter();

  const [subInfo, setSubInfo] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [areas, setAreas] = useState([]);
  const [areaInput, setAreaInput] = useState("");
  const [riskData, setRiskData] = useState({});
  const [loadingAreas, setLoadingAreas] = useState({});
  const [selectedView, setSelectedView] = useState("overview");
  const [expandedArea, setExpandedArea] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Fetch subscription status
  const fetchSub = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoadingSub(true);
    try {
      const res = await fetch("/api/insurance-subscription", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSubInfo(await res.json());
    } catch {}
    setLoadingSub(false);
  }, [getToken]);

  useEffect(() => {
    if (user) fetchSub();
  }, [user, fetchSub]);

  // Add area and fetch AI risk analysis
  const addArea = async (areaName) => {
    const name = areaName.trim();
    if (!name || areas.includes(name)) return;
    const maxAreas = subInfo?.maxAreas || 2;
    if (areas.length >= maxAreas) { setShowPricing(true); return; }

    setAreas(prev => [...prev, name]);
    setLoadingAreas(prev => ({ ...prev, [name]: true }));
    try {
      const res = await fetch("/api/insurance-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areas: [name] }),
      });
      const data = await res.json();
      if (data.results?.[name]) setRiskData(prev => ({ ...prev, [name]: data.results[name] }));
    } catch {}
    setLoadingAreas(prev => ({ ...prev, [name]: false }));
  };

  const removeArea = (area) => {
    setAreas(prev => prev.filter(a => a !== area));
    setRiskData(prev => { const next = { ...prev }; delete next[area]; return next; });
    if (expandedArea === area) setExpandedArea(null);
  };

  const refreshAll = async () => {
    if (areas.length === 0) return;
    const l = {}; areas.forEach(a => l[a] = true); setLoadingAreas(l);
    try {
      const res = await fetch("/api/insurance-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areas }),
      });
      const data = await res.json();
      if (data.results) setRiskData(data.results);
    } catch {}
    setLoadingAreas({});
  };

  // Handle subscription payment
  const handleSubscribe = async (planType) => {
    const token = getToken();
    if (!token) return;
    setProcessingPayment(planType);
    try {
      const payRes = await fetch("/api/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: PLAN_TIERS[planType].price,
          currency: "USD",
          phone: user.phone || "N/A",
          email: user.email,
          name: user.fullName || user.username,
          description: `KibiraAI Insurance ${PLAN_TIERS[planType].name} Plan`,
          type: planType,
        }),
      });
      const payData = await payRes.json();
      if (!payData.success) throw new Error("Payment failed");

      const subRes = await fetch("/api/insurance-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: planType, paymentRef: payData.paymentRef, paymentMethod: payData.method || "card" }),
      });
      const subData = await subRes.json();
      if (subData.success) { await fetchSub(); setShowPricing(false); }
    } catch (err) { console.error("Payment error:", err); }
    setProcessingPayment(null);
  };

  if (loading || !user || loadingSub) {
    return (
      <div className="min-h-screen bg-[#f7faf6] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#2d6a4f]">
          <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
          <span className="font-[family-name:var(--font-body)] text-sm">Loading insurance platform...</span>
        </div>
      </div>
    );
  }

  // ─── Computed metrics ───
  const analyzedAreas = areas.filter(a => riskData[a]?.analysis);
  const avgOverallRisk = analyzedAreas.length
    ? Math.round(analyzedAreas.reduce((s, a) => s + (riskData[a].analysis.riskOverview?.overallRiskScore || 0), 0) / analyzedAreas.length) : 0;
  const criticalZones = analyzedAreas.filter(a => (riskData[a].analysis.riskOverview?.overallRiskScore || 0) >= 75).length;
  const highRiskZones = analyzedAreas.filter(a => { const s = riskData[a].analysis.riskOverview?.overallRiskScore || 0; return s >= 60 && s < 75; }).length;
  const avgPremiumMult = analyzedAreas.length
    ? (analyzedAreas.reduce((s, a) => s + (riskData[a].analysis.underwriting?.premiumMultiplier || 1), 0) / analyzedAreas.length).toFixed(2) : "1.00";

  const getRiskColor = (s) => s >= 75 ? "text-red-600" : s >= 50 ? "text-orange-500" : s >= 25 ? "text-yellow-600" : "text-green-600";
  const getRiskBg = (s) => s >= 75 ? "bg-red-50 border-red-200 text-red-700" : s >= 50 ? "bg-orange-50 border-orange-200 text-orange-700" : s >= 25 ? "bg-yellow-50 border-yellow-200 text-yellow-700" : "bg-green-50 border-green-200 text-green-700";
  const tierLabel = subInfo?.tier?.startsWith("insurance-") ? PLAN_TIERS[subInfo.tier]?.name : "Free Trial";

  return (
    <div className="min-h-screen bg-[#f7faf6]">
      {/* ─── Header ─── */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="font-[family-name:var(--font-display)] text-xl font-bold text-[#1b4332]">KibiraAI</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-[family-name:var(--font-body)] font-semibold">Insurance</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[#6b7c6b] hover:text-[#2d6a4f] font-[family-name:var(--font-body)] hidden sm:block">Home</Link>
            <button onClick={() => setShowPricing(true)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold font-[family-name:var(--font-body)] hover:bg-blue-100 transition-colors hidden sm:block">
              {tierLabel} Plan
            </button>
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
        {/* ─── Title ─── */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">🛡️ Insurance Risk Intelligence</h1>
          <p className="text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)] text-sm">
            AI-powered climate risk analysis for underwriting, portfolio management, and catastrophe modeling.
          </p>
        </div>

        {/* Free tier banner */}
        {(!subInfo?.tier || subInfo.tier === "free") && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-5 mb-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold font-[family-name:var(--font-display)] text-lg">Free Trial — {subInfo?.maxAreas || 2} areas, {subInfo?.maxReports || 3} AI reports/month</h3>
                <p className="text-blue-100 text-sm font-[family-name:var(--font-body)] mt-1">
                  Upgrade for full AI underwriting intelligence, loss prediction, parametric triggers, and unlimited analysis.
                </p>
              </div>
              <button onClick={() => setShowPricing(true)} className="px-5 py-2.5 bg-white text-blue-700 rounded-xl font-bold text-sm font-[family-name:var(--font-body)] hover:bg-blue-50 transition-colors whitespace-nowrap">
                View Plans
              </button>
            </div>
          </div>
        )}

        {/* ─── Area Search ─── */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Monitored Areas</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{areas.length}/{subInfo?.maxAreas || 2} areas</span>
              {areas.length > 0 && (
                <button onClick={refreshAll} disabled={Object.values(loadingAreas).some(Boolean)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold font-[family-name:var(--font-body)] disabled:opacity-50">↻ Refresh All</button>
              )}
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (areaInput.trim()) { addArea(areaInput); setAreaInput(""); } }} className="flex gap-3 mb-4">
            <input type="text" value={areaInput} onChange={(e) => setAreaInput(e.target.value)}
              placeholder="Enter area name (e.g. Gulu, Kampala, Mbarara, Lira, Mbale...)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all" />
            <button type="submit" disabled={!areaInput.trim() || Object.values(loadingAreas).some(Boolean)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 font-[family-name:var(--font-body)]">
              + Add Area
            </button>
          </form>
          {areas.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {areas.map(area => (
                <span key={area} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-[family-name:var(--font-body)] border ${
                  loadingAreas[area] ? "bg-gray-50 text-gray-500 border-gray-200 animate-pulse" :
                  riskData[area]?.analysis ? getRiskBg(riskData[area].analysis.riskOverview?.overallRiskScore || 0) :
                  riskData[area]?.error ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200"
                }`}>
                  {loadingAreas[area] && <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />}
                  {area}
                  {riskData[area]?.analysis && <span className="font-bold ml-1">{riskData[area].analysis.riskOverview?.overallRiskScore || 0}</span>}
                  <button onClick={() => removeArea(area)} className="hover:text-red-600 ml-0.5">×</button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Search and add areas to build your risk portfolio.</p>
          )}
        </div>

        {/* ─── Portfolio Summary ─── */}
        {analyzedAreas.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: "Areas Analyzed", value: analyzedAreas.length, color: "text-[#1a2e1a]" },
              { label: "Avg Risk Score", value: `${avgOverallRisk}/100`, color: getRiskColor(avgOverallRisk) },
              { label: "Critical Zones", value: criticalZones, color: "text-red-600" },
              { label: "High Risk", value: highRiskZones, color: "text-orange-500" },
              { label: "Avg Premium Mult.", value: `${avgPremiumMult}×`, color: "text-[#1a2e1a]" },
            ].map((m, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-[#e5e7eb]">
                <div className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-1">{m.label}</div>
                <div className={`text-2xl font-bold font-[family-name:var(--font-display)] ${m.color}`}>{m.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ─── View Tabs ─── */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: "overview", label: "📊 Risk Overview" },
            { id: "underwriting", label: "📋 Underwriting" },
            { id: "loss", label: "📉 Loss Prediction" },
            { id: "parametric", label: "⚡ Parametric" },
            { id: "portfolio", label: "🗂️ Portfolio" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setSelectedView(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-[family-name:var(--font-body)] transition-all whitespace-nowrap ${
                selectedView === tab.id ? "bg-blue-600 text-white font-semibold shadow-sm" : "bg-white border border-[#e5e7eb] text-[#6b7c6b] hover:border-blue-400"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Empty State ─── */}
        {analyzedAreas.length === 0 && !Object.values(loadingAreas).some(Boolean) && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center mb-8">
            <span className="text-5xl mb-4 block">🌍</span>
            <h3 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">Add areas to begin risk analysis</h3>
            <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] max-w-md mx-auto mb-4">
              Search for any location. Our AI fetches real-time weather, flood forecasts, soil data, and air quality — then produces comprehensive insurance risk intelligence.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Kampala", "Gulu", "Mbarara", "Lira", "Nairobi", "Dar es Salaam"].map(a => (
                <button key={a} onClick={() => addArea(a)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-semibold font-[family-name:var(--font-body)] hover:bg-blue-100 transition-colors border border-blue-200">+ {a}</button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Loading ─── */}
        {Object.values(loadingAreas).some(Boolean) && analyzedAreas.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center mb-8">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">Analyzing climate risk...</h3>
            <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">Fetching weather forecasts, flood data, soil conditions, air quality. AI is generating your risk report.</p>
          </div>
        )}

        {/* ═══ RISK OVERVIEW ═══ */}
        {selectedView === "overview" && analyzedAreas.length > 0 && (
          <div className="space-y-4 mb-8">
            {analyzedAreas.map(area => {
              const d = riskData[area], a = d.analysis, ro = a.riskOverview, isExp = expandedArea === area;
              return (
                <div key={area} className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                  <button onClick={() => setExpandedArea(isExp ? null : area)} className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold font-[family-name:var(--font-display)] ${getRiskBg(ro?.overallRiskScore || 0)}`}>{ro?.overallRiskScore || 0}</div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{area}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-[family-name:var(--font-body)] ${getRiskBg(ro?.overallRiskScore || 0)}`}>{ro?.riskLevel}</span>
                        </div>
                        <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mt-0.5">{d.geo?.region ? `${d.geo.region}, ` : ""}{d.geo?.country || ""} · {d.geo?.elevation || "?"}m</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex gap-1.5">
                        {(ro?.hazards || []).slice(0, 4).map((h, i) => (
                          <span key={i} className={`text-[9px] px-2 py-0.5 rounded-full font-semibold font-[family-name:var(--font-body)] ${getRiskBg(h.riskScore)}`}>{h.type} {h.riskScore}</span>
                        ))}
                      </div>
                      <span className="text-[#6b7c6b] text-lg">{isExp ? "▲" : "▼"}</span>
                    </div>
                  </button>
                  {isExp && (
                    <div className="border-t border-[#e5e7eb] p-5 space-y-5">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-[#1a2e1a] font-[family-name:var(--font-body)] leading-relaxed">{ro?.summary}</p>
                        {ro?.climateTrend && <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mt-2"><span className="font-semibold text-[#1a2e1a]">Climate Trend:</span> {ro.climateTrend}</p>}
                        {ro?.seasonalPattern && <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mt-1"><span className="font-semibold text-[#1a2e1a]">Seasonal:</span> {ro.seasonalPattern}</p>}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-3">Hazard Breakdown</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(ro?.hazards || []).map((h, i) => (
                            <div key={i} className={`rounded-xl p-4 border ${getRiskBg(h.riskScore)}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold font-[family-name:var(--font-display)]">{h.type}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-sm font-bold font-[family-name:var(--font-display)] ${getRiskColor(h.riskScore)}`}>{h.riskScore}</span>
                                  <span className="text-[9px] opacity-70">/100</span>
                                </div>
                              </div>
                              <p className="text-[11px] font-[family-name:var(--font-body)] leading-relaxed opacity-90">{h.description}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${h.trend === "Increasing" ? "bg-red-100 text-red-700" : h.trend === "Decreasing" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{h.trend}</span>
                                <span className="text-[9px] opacity-60">{h.level}</span>
                              </div>
                              {h.dataPoints && <p className="text-[9px] mt-1.5 opacity-60 font-[family-name:var(--font-body)]">📊 {h.dataPoints}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Raw data cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {d.rawData?.weather && <>
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                            <div className="text-[10px] text-blue-600 font-[family-name:var(--font-body)] mb-0.5">14-Day Rainfall</div>
                            <div className="text-sm font-bold text-blue-800 font-[family-name:var(--font-display)]">{d.rawData.weather.totalRain14d}mm</div>
                            <div className="text-[9px] text-blue-500">{d.rawData.weather.heavyRainDays} heavy rain days</div>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                            <div className="text-[10px] text-orange-600 font-[family-name:var(--font-body)] mb-0.5">Max Temperature</div>
                            <div className="text-sm font-bold text-orange-800 font-[family-name:var(--font-display)]">{d.rawData.weather.maxTemp}°C</div>
                            <div className="text-[9px] text-orange-500">Avg: {d.rawData.weather.avgTemp}°C</div>
                          </div>
                        </>}
                        {d.rawData?.flood && (
                          <div className={`rounded-lg p-3 border ${d.rawData.flood.floodAlert ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
                            <div className={`text-[10px] font-[family-name:var(--font-body)] mb-0.5 ${d.rawData.flood.floodAlert ? "text-red-600" : "text-green-600"}`}>River Discharge</div>
                            <div className={`text-sm font-bold font-[family-name:var(--font-display)] ${d.rawData.flood.floodAlert ? "text-red-800" : "text-green-800"}`}>{d.rawData.flood.dischargeRatio}× mean</div>
                            <div className={`text-[9px] ${d.rawData.flood.floodAlert ? "text-red-500" : "text-green-500"}`}>{d.rawData.flood.floodAlert ? "⚠️ Elevated" : "✅ Normal"}</div>
                          </div>
                        )}
                        {d.rawData?.soil && (
                          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                            <div className="text-[10px] text-amber-600 font-[family-name:var(--font-body)] mb-0.5">Soil Moisture</div>
                            <div className="text-sm font-bold text-amber-800 font-[family-name:var(--font-display)]">{d.rawData.soil.avgMoisture}%</div>
                            <div className="text-[9px] text-amber-500">{d.rawData.soil.saturationLevel}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ UNDERWRITING ═══ */}
        {selectedView === "underwriting" && analyzedAreas.length > 0 && (
          <div className="space-y-4 mb-8">
            {analyzedAreas.map(area => {
              const u = riskData[area].analysis.underwriting, ro = riskData[area].analysis.riskOverview;
              if (!u) return null;
              return (
                <div key={area} className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{area}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-[family-name:var(--font-body)] ${getRiskBg(ro?.overallRiskScore || 0)}`}>{ro?.riskLevel}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{u.premiumMultiplier}×</div>
                      <div className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">Premium Multiplier</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] leading-relaxed">{u.premiumBasis}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {/* Crop */}
                    <div className="rounded-xl border border-[#e5e7eb] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🌾</span>
                        <h4 className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Crop Insurance</h4>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold font-[family-name:var(--font-body)] ${(u.cropInsurance?.riskTier === "Very High" || u.cropInsurance?.riskTier === "High") ? getRiskBg(75) : getRiskBg(25)}`}>{u.cropInsurance?.riskTier}</span>
                      </div>
                      <div className="space-y-2 text-xs font-[family-name:var(--font-body)]">
                        <div className="flex justify-between"><span className="text-[#6b7c6b]">Coverage</span><span className="font-semibold text-[#1a2e1a] text-right max-w-[60%]">{u.cropInsurance?.recommendedCoverage}</span></div>
                        <div className="flex justify-between"><span className="text-[#6b7c6b]">Expected Loss Ratio</span><span className="font-semibold text-[#1a2e1a]">{u.cropInsurance?.expectedLossRatio}</span></div>
                        {u.cropInsurance?.primaryPerils?.length > 0 && (
                          <div><span className="text-[#6b7c6b]">Primary Perils:</span>
                            <div className="flex flex-wrap gap-1 mt-1">{u.cropInsurance.primaryPerils.map((p, i) => (
                              <span key={i} className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full border border-red-200">{p}</span>
                            ))}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Property */}
                    <div className="rounded-xl border border-[#e5e7eb] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🏠</span>
                        <h4 className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Property Insurance</h4>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold font-[family-name:var(--font-body)] ${(u.propertyInsurance?.riskTier === "Very High" || u.propertyInsurance?.riskTier === "High") ? getRiskBg(75) : getRiskBg(25)}`}>{u.propertyInsurance?.riskTier}</span>
                      </div>
                      <div className="space-y-2 text-xs font-[family-name:var(--font-body)]">
                        <div className="flex justify-between"><span className="text-[#6b7c6b]">Flood Zone</span><span className="font-semibold text-[#1a2e1a]">{u.propertyInsurance?.floodZone}</span></div>
                        <div className="flex justify-between"><span className="text-[#6b7c6b]">Wind Risk</span><span className="font-semibold text-[#1a2e1a]">{u.propertyInsurance?.windRisk}</span></div>
                        {u.propertyInsurance?.structuralRequirements && <p className="text-[10px] text-[#6b7c6b]">{u.propertyInsurance.structuralRequirements}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <h4 className="text-xs font-bold text-blue-800 font-[family-name:var(--font-display)] mb-2">📋 Coverage Recommended</h4>
                      <p className="text-[11px] text-blue-700 font-[family-name:var(--font-body)] leading-relaxed">{u.coverageRecommendation}</p>
                      {u.maxExposureAdvice && <p className="text-[10px] text-blue-600 font-[family-name:var(--font-body)] mt-2"><span className="font-semibold">Max Exposure:</span> {u.maxExposureAdvice}</p>}
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                      <h4 className="text-xs font-bold text-red-800 font-[family-name:var(--font-display)] mb-2">⛔ Exclusions Advised</h4>
                      <div className="flex flex-wrap gap-1">
                        {(u.exclusionsAdvised || []).map((e, i) => (
                          <span key={i} className="text-[10px] bg-white text-red-700 px-2 py-0.5 rounded-full border border-red-200 font-[family-name:var(--font-body)]">{e}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ LOSS PREDICTION ═══ */}
        {selectedView === "loss" && analyzedAreas.length > 0 && (
          <div className="space-y-4 mb-8">
            {analyzedAreas.map(area => {
              const lp = riskData[area].analysis.lossPrediction, ro = riskData[area].analysis.riskOverview;
              if (!lp) return null;
              return (
                <div key={area} className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-base font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{area}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-[family-name:var(--font-body)] ${getRiskBg(ro?.overallRiskScore || 0)}`}>{ro?.riskLevel}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "Annual Expected Loss", value: lp.annualExpectedLoss },
                      { label: "12m Claim Probability", value: lp.claimProbability12m },
                      { label: "Peak Risk Months", value: (lp.peakRiskMonths || []).join(", ") },
                      { label: "Reinsurance", value: (lp.reinsuranceAdvice || "").slice(0, 60) + "..." },
                    ].map((m, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3 border border-[#e5e7eb]">
                        <div className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)] mb-0.5">{m.label}</div>
                        <div className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{m.value}</div>
                      </div>
                    ))}
                  </div>
                  {lp.catastropheScenarios?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-3">🌪️ Catastrophe Scenarios</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead><tr className="bg-gray-50">
                            {["Scenario", "Probability", "Est. Loss", "Return Period"].map(h => (
                              <th key={h} className="px-3 py-2 text-[10px] font-semibold text-[#6b7c6b] font-[family-name:var(--font-body)] text-left">{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {lp.catastropheScenarios.map((sc, i) => (
                              <tr key={i} className="border-t border-[#f0f0f0]">
                                <td className="px-3 py-2 text-xs font-[family-name:var(--font-body)] text-[#1a2e1a]">{sc.scenario}</td>
                                <td className="px-3 py-2 text-xs font-semibold font-[family-name:var(--font-body)] text-orange-600">{sc.probability}</td>
                                <td className="px-3 py-2 text-xs font-semibold font-[family-name:var(--font-body)] text-red-600">{sc.estimatedLoss}</td>
                                <td className="px-3 py-2 text-xs font-[family-name:var(--font-body)] text-[#6b7c6b]">{sc.returnPeriod}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                      <h4 className="text-xs font-bold text-purple-800 font-[family-name:var(--font-display)] mb-2">🗂️ Portfolio Impact</h4>
                      <p className="text-[11px] text-purple-700 font-[family-name:var(--font-body)] leading-relaxed">{lp.portfolioImpact}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                      <h4 className="text-xs font-bold text-green-800 font-[family-name:var(--font-display)] mb-2">✅ Mitigation</h4>
                      <ul className="space-y-1">{(lp.mitigationRecommendations || []).map((m, i) => (
                        <li key={i} className="text-[10px] text-green-700 font-[family-name:var(--font-body)] flex items-start gap-1"><span className="mt-0.5">•</span><span>{m}</span></li>
                      ))}</ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ PARAMETRIC ═══ */}
        {selectedView === "parametric" && analyzedAreas.length > 0 && (
          <div className="space-y-4 mb-8">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-200 p-6 mb-2">
              <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">⚡ Parametric Insurance Products</h3>
              <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] leading-relaxed">
                Parametric insurance pays based on event intensity (e.g. rainfall exceeding a threshold) rather than actual damage.
                This enables faster payouts, lower admin costs, and works where traditional loss adjustment is impractical — critical for African markets.
              </p>
            </div>
            {analyzedAreas.map(area => {
              const p = riskData[area].analysis.underwriting?.parametricOpportunity;
              if (!p) return null;
              return (
                <div key={area} className={`rounded-2xl border p-6 ${p.viable ? "bg-white border-purple-200" : "bg-gray-50 border-[#e5e7eb]"}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{area}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-[family-name:var(--font-body)] ${p.viable ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                      {p.viable ? "✅ Viable" : "❌ Not Recommended"}
                    </span>
                  </div>
                  {p.viable ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <div className="text-[10px] text-purple-600 font-[family-name:var(--font-body)] mb-1 font-semibold">Trigger Metric</div>
                        <p className="text-xs text-purple-800 font-[family-name:var(--font-body)] font-semibold">{p.triggerMetric}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="text-[10px] text-blue-600 font-[family-name:var(--font-body)] mb-1 font-semibold">Payout Structure</div>
                        <p className="text-xs text-blue-800 font-[family-name:var(--font-body)]">{p.suggestedPayout}</p>
                      </div>
                      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                        <div className="text-[10px] text-indigo-600 font-[family-name:var(--font-body)] mb-1 font-semibold">Rationale</div>
                        <p className="text-xs text-indigo-800 font-[family-name:var(--font-body)]">{p.rationale}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{p.rationale}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ PORTFOLIO ═══ */}
        {selectedView === "portfolio" && analyzedAreas.length > 0 && (
          <div className="space-y-4 mb-8">
            <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
              <div className="p-5 border-b border-[#e5e7eb]">
                <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Portfolio Risk Matrix</h2>
                <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mt-1">Comparative view across all monitored areas</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-gray-50 text-left">
                    {["Area", "Risk", "Premium ×", "Claim Prob.", "Crop Tier", "Property Tier", "Parametric", "Primary Hazard"].map(h => (
                      <th key={h} className="px-4 py-3 text-[10px] font-semibold text-[#6b7c6b] font-[family-name:var(--font-body)]">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {analyzedAreas.map(area => {
                      const aa = riskData[area].analysis, ro = aa.riskOverview, u = aa.underwriting, lp = aa.lossPrediction;
                      const topH = [...(ro?.hazards || [])].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))[0];
                      const tierBg = (t) => t === "Very High" ? getRiskBg(85) : t === "High" ? getRiskBg(65) : t === "Moderate" ? getRiskBg(40) : getRiskBg(15);
                      return (
                        <tr key={area} className="border-t border-[#f0f0f0] hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">{area}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold font-[family-name:var(--font-display)] ${getRiskColor(ro?.overallRiskScore || 0)}`}>{ro?.overallRiskScore || 0}</span>
                            <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-semibold font-[family-name:var(--font-body)] ${getRiskBg(ro?.overallRiskScore || 0)}`}>{ro?.riskLevel}</span>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{u?.premiumMultiplier}×</td>
                          <td className="px-4 py-3 text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">{lp?.claimProbability12m}</td>
                          <td className="px-4 py-3"><span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold font-[family-name:var(--font-body)] ${tierBg(u?.cropInsurance?.riskTier)}`}>{u?.cropInsurance?.riskTier}</span></td>
                          <td className="px-4 py-3"><span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold font-[family-name:var(--font-body)] ${tierBg(u?.propertyInsurance?.riskTier)}`}>{u?.propertyInsurance?.riskTier}</span></td>
                          <td className="px-4 py-3"><span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold font-[family-name:var(--font-body)] ${u?.parametricOpportunity?.viable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{u?.parametricOpportunity?.viable ? "✅ Yes" : "—"}</span></td>
                          <td className="px-4 py-3 text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">{topH ? `${topH.type} (${topH.riskScore})` : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Diversification */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-3">📊 Portfolio Diversification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)] mb-1">Risk Concentration</div>
                  <div className={`text-sm font-bold font-[family-name:var(--font-display)] ${criticalZones > analyzedAreas.length * 0.5 ? "text-red-600" : criticalZones > 0 ? "text-orange-600" : "text-green-600"}`}>
                    {criticalZones > analyzedAreas.length * 0.5 ? "High — diversify" : criticalZones > 0 ? "Moderate — monitor" : "Well diversified"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)] mb-1">Avg Loss Ratio</div>
                  <div className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{analyzedAreas.length > 0 ? riskData[analyzedAreas[0]].analysis.lossPrediction?.annualExpectedLoss || "—" : "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)] mb-1">Parametric Opportunities</div>
                  <div className="text-sm font-bold text-purple-600 font-[family-name:var(--font-display)]">{analyzedAreas.filter(a => riskData[a].analysis.underwriting?.parametricOpportunity?.viable).length} of {analyzedAreas.length}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Tools ─── */}
        <h2 className="text-lg font-bold text-[#1a2e1a] mb-4 font-[family-name:var(--font-display)]">🛠️ Analysis Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { href: "/advisor", icon: "🌿", title: "Dr. Kibira AI", desc: "Deep-dive climate risk analysis with deforestation data, carbon metrics, and projections." },
            { href: "/urban-warning", icon: "🏙️", title: "Urban Warning", desc: "Detailed flood and heat mapping with 5-day forecasts and neighborhood-level data." },
            { href: "/forest-sentinel", icon: "🌲", title: "Forest Sentinel", desc: "Real-time deforestation monitoring for forestry and agricultural insurance portfolios." },
          ].map((t, i) => (
            <Link key={i} href={t.href} className="bg-white rounded-xl p-5 border border-[#e5e7eb] hover:shadow-md hover:border-blue-300 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{t.icon}</span>
                <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{t.title}</h3>
              </div>
              <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">{t.desc}</p>
              <span className="text-sm text-blue-600 font-semibold font-[family-name:var(--font-body)] group-hover:underline">Open →</span>
            </Link>
          ))}
        </div>

        {/* AI Queries */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white mb-8">
          <h3 className="text-base font-bold font-[family-name:var(--font-display)] mb-3">💡 Insurance AI Queries</h3>
          <div className="flex flex-wrap gap-2">
            {["Climate risk for flood-prone zones in East Africa", "Crop failure probability in Uganda this season", "Parametric insurance triggers for drought in Sahel", "Heat stress projections for urban areas 2025-2030", "Deforestation impact on rainfall patterns", "Catastrophe bond structuring for African weather risk"].map((q, i) => (
              <Link key={i} href={`/advisor?q=${encodeURIComponent(q)}`} className="text-xs bg-white/15 hover:bg-white/25 px-3 py-2 rounded-full font-[family-name:var(--font-body)] transition-colors">{q}</Link>
            ))}
          </div>
        </div>
      </main>

      {/* ═══ PRICING MODAL ═══ */}
      {showPricing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPricing(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Insurance Intelligence Plans</h2>
                <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] mt-1">Climate risk intelligence powered by real-time data + AI</p>
              </div>
              <button onClick={() => setShowPricing(false)} className="text-[#6b7c6b] hover:text-[#1a2e1a] text-xl">✕</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(PLAN_TIERS).map(([key, plan]) => {
                  const isCurrent = subInfo?.tier === key;
                  const features = {
                    "insurance-basic": ["3 monitored areas", "Basic risk scores (0-100)", "Flood & heat hazard analysis", "Monthly risk reports", "Email alerts"],
                    "insurance-professional": ["15 monitored areas", "Full AI underwriting data", "Loss prediction modeling", "Parametric trigger analysis", "Catastrophe scenarios", "Crop & property risk tiers", "Portfolio risk matrix", "Weekly reports"],
                    "insurance-enterprise": ["Unlimited areas", "Everything in Professional", "Custom parametric products", "Portfolio optimization AI", "Reinsurance analytics", "Catastrophe bond structuring", "API access", "Priority support", "Custom AI training"],
                  };
                  return (
                    <div key={key} className={`rounded-xl border-2 p-5 relative ${key === "insurance-professional" ? "border-purple-400 bg-purple-50/30" : key === "insurance-enterprise" ? "border-amber-400 bg-amber-50/30" : "border-[#e5e7eb]"}`}>
                      {key === "insurance-professional" && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full font-[family-name:var(--font-body)]">MOST POPULAR</div>}
                      <h3 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{plan.name}</h3>
                      <div className="mt-2 mb-4">
                        <span className="text-3xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">${plan.price}</span>
                        <span className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">/month</span>
                      </div>
                      <ul className="space-y-2 mb-5">
                        {(features[key] || []).map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs font-[family-name:var(--font-body)] text-[#1a2e1a]"><span className="text-green-600 mt-0.5">✓</span><span>{f}</span></li>
                        ))}
                      </ul>
                      <button onClick={() => !isCurrent && handleSubscribe(key)} disabled={isCurrent || processingPayment === key}
                        className={`w-full py-2.5 rounded-xl font-semibold text-sm font-[family-name:var(--font-body)] transition-colors ${
                          isCurrent ? "bg-gray-100 text-gray-500 cursor-not-allowed" : processingPayment === key ? "bg-blue-400 text-white cursor-wait" :
                          key === "insurance-professional" ? "bg-purple-600 hover:bg-purple-700 text-white" : key === "insurance-enterprise" ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}>
                        {isCurrent ? "Current Plan" : processingPayment === key ? "Processing..." : "Subscribe"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-[#e5e7eb]">
                <h4 className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-1">🆓 Free Trial</h4>
                <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">
                  Monitor 2 areas with basic risk scores. All plans use real-time Open-Meteo weather, GloFAS flood forecasts, soil conditions, and air quality data.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
