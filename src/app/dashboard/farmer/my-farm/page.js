"use client";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const COMMON_CROPS = [
  "Maize", "Beans", "Cassava", "Sweet Potatoes", "Rice", "Sorghum", "Millet",
  "Groundnuts", "Soybeans", "Coffee", "Bananas", "Irish Potatoes", "Tomatoes",
  "Onions", "Cabbage", "Sunflower", "Sesame", "Cotton", "Wheat", "Peas",
];

const PRIORITY_STYLES = {
  urgent: "bg-red-50 border-red-200 text-red-800",
  important: "bg-amber-50 border-amber-200 text-amber-800",
  routine: "bg-green-50 border-green-200 text-green-800",
};

const SEVERITY_STYLES = {
  critical: "bg-red-100 border-red-300 text-red-900",
  warning: "bg-orange-100 border-orange-300 text-orange-900",
  info: "bg-blue-100 border-blue-300 text-blue-900",
};

export default function MyFarmPage() {
  const { user, loading, logout, getToken } = useAuth();
  const router = useRouter();

  // State
  const [crops, setCrops] = useState([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingCrop, setAddingCrop] = useState(false);
  const [activeTab, setActiveTab] = useState("plan"); // plan | crops | harvest
  const [formError, setFormError] = useState(null);

  // Add crop form
  const [cropForm, setCropForm] = useState({
    cropName: "", variety: "", area: "", areaUnit: "acres",
    plantingDate: new Date().toISOString().split("T")[0],
    location: "", notes: "",
  });

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Load crops
  const fetchCrops = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoadingCrops(true);
    try {
      const res = await fetch("/api/farm-crops", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.crops) setCrops(data.crops);
    } catch { /* silently fail */ }
    setLoadingCrops(false);
  }, [getToken]);

  useEffect(() => {
    if (user) fetchCrops();
  }, [user, fetchCrops]);

  // Generate AI plan
  const generatePlan = async () => {
    const growingCrops = crops.filter(c => c.status === "growing");
    if (growingCrops.length === 0) return;

    // Use the location from the first crop (or most common)
    const location = growingCrops[0]?.location || "Uganda";

    setLoadingPlan(true);
    try {
      const res = await fetch("/api/farm-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crops: growingCrops, location }),
      });
      const data = await res.json();
      if (data.plan) setPlan(data.plan);
    } catch { /* silently fail */ }
    setLoadingPlan(false);
  };

  // Auto-generate plan when crops are loaded
  useEffect(() => {
    const growing = crops.filter(c => c.status === "growing");
    if (growing.length > 0 && !plan && !loadingPlan) {
      generatePlan();
    }
  }, [crops]);

  // Add crop
  const handleAddCrop = async (e) => {
    e.preventDefault();
    setFormError(null);
    const token = getToken();
    if (!token) return;

    if (!cropForm.cropName || !cropForm.plantingDate || !cropForm.location) {
      setFormError("Crop name, planting date, and location are required.");
      return;
    }

    setAddingCrop(true);
    try {
      const res = await fetch("/api/farm-crops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cropForm),
      });
      const data = await res.json();
      if (data.crop) {
        setCrops(prev => [data.crop, ...prev]);
        setCropForm({
          cropName: "", variety: "", area: "", areaUnit: "acres",
          plantingDate: new Date().toISOString().split("T")[0],
          location: cropForm.location, // keep the location for convenience
          notes: "",
        });
        setShowAddForm(false);
        setPlan(null); // Reset plan to force regeneration
      } else {
        setFormError(data.error || "Failed to add crop");
      }
    } catch {
      setFormError("Network error. Please try again.");
    }
    setAddingCrop(false);
  };

  // Update crop status
  const updateCropStatus = async (id, status, extras = {}) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("/api/farm-crops", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status, ...extras }),
      });
      const data = await res.json();
      if (data.crop) {
        setCrops(prev => prev.map(c => c.id === id ? { ...c, ...data.crop } : c));
        setPlan(null); // Reset plan
      }
    } catch { /* silently fail */ }
  };

  // Delete crop
  const deleteCrop = async (id) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/farm-crops?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCrops(prev => prev.filter(c => c.id !== id));
        setPlan(null);
      }
    } catch { /* silently fail */ }
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

  const growingCrops = crops.filter(c => c.status === "growing");
  const harvestedCrops = crops.filter(c => c.status === "harvested");
  const daysSince = (dateStr) => Math.max(0, Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-[#f7faf6]">
      {/* Top Bar */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/farmer" className="text-sm text-[#6b7c6b] hover:text-[#2d6a4f] font-[family-name:var(--font-body)]">← Dashboard</Link>
            <span className="text-[#d1d5db]">|</span>
            <span className="text-2xl">🌱</span>
            <span className="font-[family-name:var(--font-display)] text-xl font-bold text-[#1b4332]">My Farm</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold">
              {user.fullName?.charAt(0)?.toUpperCase() || "F"}
            </div>
            <button onClick={() => { logout(); router.push("/"); }} className="text-xs text-[#6b7c6b] hover:text-red-600 font-[family-name:var(--font-body)] px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header + Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
              🌱 My Farm
            </h1>
            <p className="text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)] text-sm">
              Track your crops, get weather-matched daily action items, and plan your harvests.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm transition-colors font-[family-name:var(--font-body)] flex items-center gap-2"
          >
            <span>+</span> Add Crop
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-[#e5e7eb]">
            <p className="text-2xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{growingCrops.length}</p>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Growing</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e5e7eb]">
            <p className="text-2xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{harvestedCrops.length}</p>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Harvested</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e5e7eb]">
            <p className="text-2xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
              {plan?.riskAlerts?.filter(a => a.severity === "critical").length || 0}
            </p>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Active Alerts</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e5e7eb]">
            <p className="text-2xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
              {plan?.dailyActions?.length || 0}
            </p>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Today&apos;s Actions</p>
          </div>
        </div>

        {/* Add Crop Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Add New Crop</h2>
                <button onClick={() => setShowAddForm(false)} className="text-[#6b7c6b] hover:text-red-600 text-xl">&times;</button>
              </div>
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-[family-name:var(--font-body)]">{formError}</div>
              )}
              <form onSubmit={handleAddCrop} className="space-y-4">
                {/* Crop Name */}
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Crop *</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {COMMON_CROPS.slice(0, 12).map(c => (
                      <button
                        key={c} type="button"
                        onClick={() => setCropForm(f => ({ ...f, cropName: c }))}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all font-[family-name:var(--font-body)] ${cropForm.cropName === c ? 'bg-amber-600 text-white border-amber-600' : 'bg-gray-50 text-[#6b7c6b] border-gray-200 hover:border-amber-300'}`}
                      >{c}</button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={cropForm.cropName}
                    onChange={e => setCropForm(f => ({ ...f, cropName: e.target.value }))}
                    placeholder="Or type crop name..."
                    className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)]"
                  />
                </div>

                {/* Variety */}
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Variety (optional)</label>
                  <input
                    type="text"
                    value={cropForm.variety}
                    onChange={e => setCropForm(f => ({ ...f, variety: e.target.value }))}
                    placeholder="e.g., Longe 5, NASE 14, K132..."
                    className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)]"
                  />
                </div>

                {/* Area + Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Farm Size</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cropForm.area}
                      onChange={e => setCropForm(f => ({ ...f, area: e.target.value }))}
                      placeholder="e.g., 2"
                      className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Unit</label>
                    <select
                      value={cropForm.areaUnit}
                      onChange={e => setCropForm(f => ({ ...f, areaUnit: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)]"
                    >
                      <option value="acres">Acres</option>
                      <option value="hectares">Hectares</option>
                      <option value="sqm">Sq Meters</option>
                    </select>
                  </div>
                </div>

                {/* Planting Date */}
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Planting Date *</label>
                  <input
                    type="date"
                    value={cropForm.plantingDate}
                    onChange={e => setCropForm(f => ({ ...f, plantingDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)]"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Location *</label>
                  <input
                    type="text"
                    value={cropForm.location}
                    onChange={e => setCropForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g., Lira, Kabale, Gulu..."
                    className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)]"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Notes (optional)</label>
                  <textarea
                    value={cropForm.notes}
                    onChange={e => setCropForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder="Any details about soil, fertilizer used, etc..."
                    className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)] resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2.5 border border-[#d1d5db] rounded-xl text-sm font-[family-name:var(--font-body)] text-[#6b7c6b] hover:bg-gray-50"
                  >Cancel</button>
                  <button
                    type="submit"
                    disabled={addingCrop}
                    className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm font-[family-name:var(--font-body)] disabled:opacity-50"
                  >{addingCrop ? "Adding..." : "Add Crop"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-[#e5e7eb] p-1 mb-6 w-fit">
          {[
            { key: "plan", label: "📋 Today's Plan", count: plan?.dailyActions?.length },
            { key: "crops", label: "🌾 My Crops", count: growingCrops.length },
            { key: "harvest", label: "📦 Harvest Log", count: harvestedCrops.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-[family-name:var(--font-body)] transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-[#6b7c6b] hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── TAB: Today's Plan ─── */}
        {activeTab === "plan" && (
          <div>
            {growingCrops.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center">
                <span className="text-5xl mb-4 block">🌱</span>
                <h3 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">Add your first crop</h3>
                <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] mb-4">
                  Add the crops you&apos;re currently growing and get personalized AI-powered daily actions based on real weather data.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm font-[family-name:var(--font-body)]"
                >+ Add Crop</button>
              </div>
            ) : loadingPlan ? (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">Generating your farm plan...</p>
                <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mt-1">Analyzing {growingCrops.length} crops against real weather data</p>
              </div>
            ) : plan ? (
              <div className="space-y-6">
                {/* Week Outlook */}
                {plan.weekOutlook && (
                  <div className="bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] rounded-2xl p-6 text-white">
                    <h3 className="font-bold font-[family-name:var(--font-display)] mb-2 flex items-center gap-2">
                      🌤️ Week Outlook — {plan.location}
                    </h3>
                    <p className="text-sm text-white/90 font-[family-name:var(--font-body)] leading-relaxed">{plan.weekOutlook}</p>
                    <p className="text-[10px] text-white/50 mt-3 font-[family-name:var(--font-body)]">Generated {new Date(plan.generatedAt).toLocaleString()}</p>
                  </div>
                )}

                {/* Risk Alerts */}
                {plan.riskAlerts && plan.riskAlerts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-3">⚠️ Risk Alerts</h3>
                    <div className="space-y-2">
                      {plan.riskAlerts.map((alert, i) => (
                        <div key={i} className={`rounded-xl p-4 border ${SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info}`}>
                          <div className="flex items-start gap-3">
                            <span className="text-lg">{alert.severity === "critical" ? "🔴" : alert.severity === "warning" ? "🟠" : "🔵"}</span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold font-[family-name:var(--font-body)]">{alert.risk}</p>
                              <p className="text-xs mt-1 font-[family-name:var(--font-body)] opacity-80">Crop: {alert.crop} • {alert.trigger}</p>
                              <p className="text-xs mt-1 font-[family-name:var(--font-body)] font-medium">→ {alert.action}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daily Actions */}
                {plan.dailyActions && plan.dailyActions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-3">📋 Today&apos;s Actions</h3>
                    <div className="space-y-2">
                      {plan.dailyActions.map((action, i) => (
                        <div key={i} className={`rounded-xl p-4 border ${PRIORITY_STYLES[action.priority] || PRIORITY_STYLES.routine}`}>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/60 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] uppercase font-bold font-[family-name:var(--font-body)] opacity-60">{action.priority}</span>
                                <span className="text-[10px] font-[family-name:var(--font-body)] opacity-60">•</span>
                                <span className="text-[10px] font-[family-name:var(--font-body)] opacity-60">{action.crop}</span>
                              </div>
                              <p className="text-sm font-semibold font-[family-name:var(--font-body)] mt-0.5">{action.action}</p>
                              <p className="text-xs mt-1 font-[family-name:var(--font-body)] opacity-70">{action.reason}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Crop Status Cards */}
                {plan.cropStatus && plan.cropStatus.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-3">🌾 Crop Growth Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plan.cropStatus.map((cs, i) => {
                        const healthColor = cs.healthScore >= 80 ? "text-green-600" : cs.healthScore >= 60 ? "text-amber-600" : "text-red-600";
                        const harvestDate = cs.estimatedHarvestDate ? new Date(cs.estimatedHarvestDate) : null;
                        const daysToHarvest = harvestDate ? Math.max(0, Math.ceil((harvestDate - new Date()) / (1000 * 60 * 60 * 24))) : null;
                        return (
                          <div key={i} className="bg-white rounded-xl border border-[#e5e7eb] p-5">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
                                  {cs.cropName}{cs.variety ? ` (${cs.variety})` : ""}
                                </h4>
                                <p className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">Day {cs.daysSincePlanting}</p>
                              </div>
                              <div className={`text-xl font-bold font-[family-name:var(--font-display)] ${healthColor}`}>
                                {cs.healthScore}%
                              </div>
                            </div>

                            {/* Growth stage bar */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)] mb-1">
                                <span className="font-semibold text-amber-700">{cs.growthStage}</span>
                                <span>→ {cs.nextStage} ({cs.daysToNextStage}d)</span>
                              </div>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-500 to-green-500 rounded-full transition-all" style={{ width: `${Math.min(100, (cs.daysSincePlanting / (cs.daysSincePlanting + (daysToHarvest || 30))) * 100)}%` }} />
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-body)]">
                                <span>💧</span>
                                <span className="text-[#6b7c6b]">Water: <span className="font-medium text-[#1a2e1a]">{cs.waterNeed}</span></span>
                              </div>
                              {cs.waterAdvice && (
                                <p className="text-[11px] text-blue-700 bg-blue-50 rounded-lg px-3 py-1.5 font-[family-name:var(--font-body)]">💡 {cs.waterAdvice}</p>
                              )}
                              {daysToHarvest != null && (
                                <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-body)]">
                                  <span>📅</span>
                                  <span className="text-[#6b7c6b]">Est. harvest: <span className="font-medium text-[#1a2e1a]">{daysToHarvest} days</span> ({cs.estimatedHarvestDate})</span>
                                </div>
                              )}
                              {cs.healthNotes && (
                                <p className="text-[11px] text-[#6b7c6b] font-[family-name:var(--font-body)]">{cs.healthNotes}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Refresh Button */}
                <div className="text-center">
                  <button
                    onClick={generatePlan}
                    disabled={loadingPlan}
                    className="text-sm text-amber-600 hover:text-amber-700 font-semibold font-[family-name:var(--font-body)] disabled:opacity-50"
                  >
                    🔄 Refresh Plan with Latest Weather
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 text-center">
                <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] mb-4">Could not generate plan. Click below to try again.</p>
                <button onClick={generatePlan} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm font-[family-name:var(--font-body)]">
                  Generate Farm Plan
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: My Crops ─── */}
        {activeTab === "crops" && (
          <div>
            {growingCrops.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center">
                <span className="text-5xl mb-4 block">🌾</span>
                <h3 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">No crops yet</h3>
                <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] mb-4">Add your current crops to start tracking them.</p>
                <button onClick={() => setShowAddForm(true)} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm font-[family-name:var(--font-body)]">+ Add Crop</button>
              </div>
            ) : (
              <div className="space-y-3">
                {growingCrops.map(crop => (
                  <div key={crop.id} className="bg-white rounded-xl border border-[#e5e7eb] p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{crop.cropName}</h3>
                          {crop.variety && <span className="text-[10px] bg-gray-100 text-[#6b7c6b] px-2 py-0.5 rounded-full font-[family-name:var(--font-body)]">{crop.variety}</span>}
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-[family-name:var(--font-body)] font-semibold">Growing</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">
                          <span>📍 {crop.location}</span>
                          <span>📅 Planted {crop.plantingDate} ({daysSince(crop.plantingDate)}d ago)</span>
                          {crop.area > 0 && <span>📐 {crop.area} {crop.areaUnit}</span>}
                        </div>
                        {crop.notes && <p className="text-xs text-[#6b7c6b] mt-2 font-[family-name:var(--font-body)] italic">{crop.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => updateCropStatus(crop.id, "harvested", { harvestDate: new Date().toISOString().split("T")[0] })}
                          className="text-[11px] px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg font-[family-name:var(--font-body)] font-medium transition-colors"
                        >✓ Harvested</button>
                        <button
                          onClick={() => updateCropStatus(crop.id, "failed")}
                          className="text-[11px] px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-[family-name:var(--font-body)] font-medium transition-colors"
                        >✗ Failed</button>
                        <button
                          onClick={() => { if (confirm("Remove this crop?")) deleteCrop(crop.id); }}
                          className="text-[11px] px-2 py-1.5 text-[#6b7c6b] hover:text-red-600 transition-colors"
                        >🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: Harvest Log ─── */}
        {activeTab === "harvest" && (
          <div>
            {harvestedCrops.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center">
                <span className="text-5xl mb-4 block">📦</span>
                <h3 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">No harvests yet</h3>
                <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">When you mark crops as harvested, they&apos;ll appear here for tracking.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-[#e5e7eb]">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] text-xs">Crop</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] text-xs">Location</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] text-xs">Planted</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] text-xs">Harvested</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] text-xs">Duration</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {harvestedCrops.map(crop => {
                      const duration = crop.harvestDate && crop.plantingDate
                        ? Math.floor((new Date(crop.harvestDate) - new Date(crop.plantingDate)) / (1000 * 60 * 60 * 24))
                        : "—";
                      return (
                        <tr key={crop.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-[family-name:var(--font-body)]">
                            <span className="font-medium text-[#1a2e1a]">{crop.cropName}</span>
                            {crop.variety && <span className="text-[#6b7c6b] text-xs ml-1">({crop.variety})</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{crop.location}</td>
                          <td className="px-4 py-3 text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{crop.plantingDate}</td>
                          <td className="px-4 py-3 text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{crop.harvestDate || "—"}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">{duration !== "—" ? `${duration}d` : "—"}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => { if (confirm("Delete this harvest record?")) deleteCrop(crop.id); }}
                              className="text-[11px] text-[#6b7c6b] hover:text-red-600 transition-colors"
                            >🗑️</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
