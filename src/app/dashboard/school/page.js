"use client";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
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

const WARD_PRESETS = [
  { ward: "Kawempe", lat: 0.3775, lng: 32.5572 },
  { ward: "Bwaise", lat: 0.3538, lng: 32.5615 },
  { ward: "Katanga", lat: 0.3352, lng: 32.5738 },
  { ward: "Namuwongo", lat: 0.3015, lng: 32.6058 },
  { ward: "Kisenyi", lat: 0.3128, lng: 32.5682 },
  { ward: "Kalerwe", lat: 0.3612, lng: 32.5718 },
  { ward: "Makerere", lat: 0.3336, lng: 32.5675 },
  { ward: "Nakawa", lat: 0.332, lng: 32.6155 },
  { ward: "Mulago", lat: 0.3389, lng: 32.5756 },
];

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

const emptyForm = {
  name: "",
  type: "school",
  ward: "Kawempe",
  district: "Kampala",
  lat: "0.3775",
  lng: "32.5572",
  enrollment: "",
  catchment: "",
  contactRole: "Headteacher",
  contactName: "",
  contactPhone: "",
  alertConsent: true,
};

function LevelBadge({ level }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${LEVEL_STYLES[level] || LEVEL_STYLES.normal}`}>
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
    emerald: "bg-emerald-500",
  };
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 font-[family-name:var(--font-body)]">{label}</span>
        <span className="font-bold text-gray-800 font-[family-name:var(--font-display)]">{value ?? "—"}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]} transition-all duration-500`} style={{ width: `${Math.min(100, value || 0)}%` }} />
      </div>
    </div>
  );
}

export default function SchoolDashboard() {
  const { user, loading, logout, getToken } = useAuth();
  const router = useRouter();
  const [greeting, setGreeting] = useState("Hello");
  const [tab, setTab] = useState("facilities"); // facilities | register | risk | playbooks | resources
  const [facilities, setFacilities] = useState([]);
  const [stats, setStats] = useState({ childrenCovered: 0, clinicCatchment: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const [riskPayload, setRiskPayload] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [listLoading, setListLoading] = useState(true);
  const [riskLoading, setRiskLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (loading || !user) return;
    const type = user.accountType;
    if (type && type !== "school_health" && type !== "local_gov" && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      contactName: prev.contactName || user.fullName || "",
      contactPhone: prev.contactPhone || user.phone || "",
    }));
  }, [user]);

  const loadFacilities = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setListLoading(true);
    setError("");
    try {
      const res = await fetch("/api/school-facilities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load facilities");
      setFacilities(data.facilities || []);
      setStats({
        childrenCovered: data.childrenCovered || 0,
        clinicCatchment: data.clinicCatchment || 0,
      });
      if (!selectedId && data.facilities?.length) {
        setSelectedId(data.facilities[0].id);
      }
    } catch (err) {
      setError(err.message || "Could not load facilities");
    } finally {
      setListLoading(false);
    }
  }, [getToken, selectedId]);

  useEffect(() => {
    if (user) loadFacilities();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRisk = useCallback(async (facilityId) => {
    if (!facilityId) return;
    const token = getToken();
    if (!token) return;
    setRiskLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/school-facilities/${encodeURIComponent(facilityId)}/risk`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load risk");
      setRiskPayload(data);
    } catch (err) {
      setError(err.message || "Risk load failed");
      setRiskPayload(null);
    } finally {
      setRiskLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (selectedId && (tab === "risk" || tab === "playbooks" || tab === "facilities")) {
      loadRisk(selectedId);
    }
  }, [selectedId, tab, loadRisk]);

  const selected = useMemo(
    () => facilities.find((f) => f.id === selectedId) || null,
    [facilities, selectedId]
  );

  const applyWardPreset = (wardName) => {
    const preset = WARD_PRESETS.find((w) => w.ward === wardName);
    setForm((prev) => ({
      ...prev,
      ward: wardName,
      lat: preset ? String(preset.lat) : prev.lat,
      lng: preset ? String(preset.lng) : prev.lng,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const token = getToken();
      const res = await fetch("/api/school-facilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
          enrollment: form.enrollment,
          catchment: form.catchment,
          contactName: form.contactName || user.fullName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setMessage(`${data.facility.name} registered successfully.`);
      setForm({
        ...emptyForm,
        contactName: user.fullName || "",
        contactPhone: user.phone || "",
      });
      setSelectedId(data.facility.id);
      await loadFacilities();
      setTab("risk");
    } catch (err) {
      setError(err.message || "Could not register facility");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (facilityId) => {
    if (!confirm("Remove this facility from your registry?")) return;
    const token = getToken();
    try {
      const res = await fetch(`/api/school-facilities/${encodeURIComponent(facilityId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      if (selectedId === facilityId) {
        setSelectedId(null);
        setRiskPayload(null);
      }
      await loadFacilities();
    } catch (err) {
      setError(err.message || "Could not delete");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f7faf6] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const risk = riskPayload?.risk;
  const tabs = [
    { id: "facilities", label: "My Facilities" },
    { id: "register", label: "Register Facility" },
    { id: "risk", label: "Live Risk" },
    { id: "playbooks", label: "Action Playbooks" },
    { id: "resources", label: "Public Tools" },
  ];

  return (
    <div className="min-h-screen bg-[#f7faf6]">
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🏫</span>
            <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[#1a2e1a]">KibiraAI</span>
            <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">Schools & Health</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/childrens-early-warning" className="text-sm text-[#6b7c6b] hover:text-rose-700 font-[family-name:var(--font-body)] hidden sm:block">
              Public EW
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white text-xs font-bold">
                {user.fullName?.charAt(0)?.toUpperCase() || "S"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">{user.fullName}</p>
                <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{user.company || "School / Health"}</p>
              </div>
              <button
                type="button"
                onClick={() => { logout(); router.push("/"); }}
                className="text-xs text-[#6b7c6b] hover:text-red-600 font-[family-name:var(--font-body)] px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
            {greeting}, {user.fullName?.split(" ")[0] || "there"}
          </h1>
          <p className="text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)] max-w-3xl">
            Children&apos;s climate–health early warning workspace — register schools and clinics, monitor heat, UV, AQI, humidity and flood risk, and run anticipatory action playbooks.
          </p>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Your facilities", value: facilities.length },
            { label: "Schools", value: facilities.filter((f) => f.type === "school").length },
            { label: "Children (enrollment)", value: stats.childrenCovered.toLocaleString() },
            { label: "Clinic catchment", value: stats.clinicCatchment.toLocaleString() },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-2xl border border-[#e5e7eb] p-4">
              <p className="text-[10px] uppercase tracking-widest text-[#6b7c6b] font-[family-name:var(--font-body)]">{k.label}</p>
              <p className="text-2xl font-bold text-[#1a2e1a] mt-1 font-[family-name:var(--font-display)]">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors font-[family-name:var(--font-body)] ${
                tab === t.id ? "bg-rose-600 text-white" : "bg-white text-[#6b7c6b] border border-[#e5e7eb] hover:border-rose-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-[family-name:var(--font-body)]">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm font-[family-name:var(--font-body)]">
            {message}
          </div>
        )}

        {/* FACILITIES */}
        {tab === "facilities" && (
          <div className="grid lg:grid-cols-[0.9fr,1.1fr] gap-6">
            <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Facility registry</h2>
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="text-xs font-bold text-rose-700 hover:underline font-[family-name:var(--font-body)]"
                >
                  + Register
                </button>
              </div>
              {listLoading ? (
                <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">Loading…</p>
              ) : facilities.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-4xl mb-3">🏫</p>
                  <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] mb-4">
                    No facilities yet. Register a school or clinic with GPS, ward, and enrollment/catchment.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("register")}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold"
                  >
                    Register your first facility
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {facilities.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => { setSelectedId(f.id); setTab("risk"); }}
                      className={`w-full text-left rounded-xl border p-3 transition-all ${
                        selectedId === f.id ? "border-rose-400 bg-rose-50" : "border-[#e5e7eb] hover:border-rose-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{f.name}</p>
                          <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mt-0.5">
                            {f.type === "clinic" ? "Clinic" : "School"} · {f.ward}, {f.district}
                          </p>
                          <p className="text-[11px] text-[#9ca3af] font-[family-name:var(--font-body)] mt-1">
                            GPS {f.lat.toFixed(4)}, {f.lng.toFixed(4)} ·{" "}
                            {f.type === "school" ? `${f.enrollment} enrolled` : `${f.catchment.toLocaleString()} catchment`}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-rose-700 bg-rose-100 px-2 py-1 rounded-full">
                          {f.type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
              <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-3">Selected facility</h2>
              {!selected ? (
                <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">Select a facility to see contacts and quick risk.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{selected.name}</p>
                    <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">
                      {selected.contactRole}: {selected.contactName || user.fullName}
                      {selected.contactPhone ? ` · ${selected.contactPhone}` : ""}
                    </p>
                    {selected.alertConsent && (
                      <p className="text-xs text-emerald-700 mt-2 font-[family-name:var(--font-body)]">
                        ✓ Consented for SMS/WhatsApp early-warning alerts
                      </p>
                    )}
                  </div>
                  {riskLoading ? (
                    <p className="text-sm text-[#6b7c6b]">Loading live risk…</p>
                  ) : risk ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <LevelBadge level={risk.alertLevel} />
                        <span className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Overall alert level</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <RiskMeter label="Heat-illness risk" value={risk.readings?.heatIllnessRisk} color="rose" />
                        <RiskMeter label="Flood risk" value={risk.readings?.floodRisk} color="blue" />
                        <RiskMeter label="Vector suitability" value={risk.readings?.vectorRisk} color="violet" />
                        <RiskMeter label="AQI" value={risk.readings?.aqi} color="orange" />
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button type="button" onClick={() => setTab("risk")} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold">
                          Open live risk
                        </button>
                        <button type="button" onClick={() => setTab("playbooks")} className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold">
                          View playbooks
                        </button>
                        <button type="button" onClick={() => handleDelete(selected.id)} className="px-4 py-2 rounded-xl border border-red-100 text-red-600 text-xs font-semibold">
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => loadRisk(selected.id)} className="text-sm font-semibold text-rose-700 underline">
                      Load live risk
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REGISTER */}
        {tab === "register" && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 sm:p-7 max-w-3xl">
            <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-1">
              Register school or health facility
            </h2>
            <p className="text-sm text-[#6b7c6b] mb-5 font-[family-name:var(--font-body)]">
              Facility registry MVP — GPS, ward, enrollment/catchment, and focal-person contacts for early warning (UNICEF Q1).
            </p>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#1a2e1a] mb-1 block font-[family-name:var(--font-body)]">Facility name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Kawempe C.O.U Primary School"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] mb-1 block font-[family-name:var(--font-body)]">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        type: e.target.value,
                        contactRole: e.target.value === "clinic" ? "In-charge" : "Headteacher",
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] text-sm outline-none"
                  >
                    <option value="school">School</option>
                    <option value="clinic">Health facility / Clinic</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] mb-1 block font-[family-name:var(--font-body)]">Ward *</label>
                  <select
                    value={form.ward}
                    onChange={(e) => applyWardPreset(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] text-sm outline-none"
                  >
                    {WARD_PRESETS.map((w) => (
                      <option key={w.ward} value={w.ward}>{w.ward}</option>
                    ))}
                    <option value="Other">Other (enter GPS below)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] mb-1 block font-[family-name:var(--font-body)]">District</label>
                  <input
                    value={form.district}
                    onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] mb-1 block font-[family-name:var(--font-body)]">
                    {form.type === "clinic" ? "Catchment population" : "Enrollment (children)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.type === "clinic" ? form.catchment : form.enrollment}
                    onChange={(e) =>
                      setForm((p) =>
                        form.type === "clinic"
                          ? { ...p, catchment: e.target.value }
                          : { ...p, enrollment: e.target.value }
                      )
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] mb-1 block font-[family-name:var(--font-body)]">Latitude *</label>
                  <input
                    required
                    value={form.lat}
                    onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] mb-1 block font-[family-name:var(--font-body)]">Longitude *</label>
                  <input
                    required
                    value={form.lng}
                    onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] mb-1 block font-[family-name:var(--font-body)]">Focal role</label>
                  <input
                    value={form.contactRole}
                    onChange={(e) => setForm((p) => ({ ...p, contactRole: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] mb-1 block font-[family-name:var(--font-body)]">Focal person name</label>
                  <input
                    value={form.contactName}
                    onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                    placeholder={user.fullName || "Name"}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] text-sm outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#1a2e1a] mb-1 block font-[family-name:var(--font-body)]">Alert phone (MTN/Airtel)</label>
                  <input
                    value={form.contactPhone}
                    onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                    placeholder="07XXXXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] text-sm outline-none"
                  />
                </div>
              </div>
              <label className="flex items-start gap-2 text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">
                <input
                  type="checkbox"
                  checked={form.alertConsent}
                  onChange={(e) => setForm((p) => ({ ...p, alertConsent: e.target.checked }))}
                  className="mt-1"
                />
                I consent to receive SMS/WhatsApp early-warning alerts for this facility (Q2 live channels).
              </label>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm disabled:opacity-50"
              >
                {saving ? "Registering…" : "Register facility"}
              </button>
            </form>
          </div>
        )}

        {/* LIVE RISK */}
        {tab === "risk" && (
          <div className="space-y-6">
            {facilities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {facilities.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedId(f.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      selectedId === f.id ? "bg-rose-600 text-white border-rose-600" : "bg-white text-[#6b7c6b] border-[#e5e7eb]"
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}

            {!selectedId ? (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 text-center">
                <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">Register or select a facility to see live child-sensitive risk.</p>
                <button type="button" onClick={() => setTab("register")} className="mt-4 text-sm font-semibold text-rose-700 underline">
                  Register a facility
                </button>
              </div>
            ) : riskLoading ? (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 text-center text-sm text-[#6b7c6b]">Loading Open-Meteo risk…</div>
            ) : risk ? (
              <>
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{risk.name}</h2>
                      <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">
                        {risk.type} · {risk.ward}, {risk.district} · heat, humidity, UV, AQI, flood + predictors
                      </p>
                    </div>
                    <LevelBadge level={risk.alertLevel} />
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <RiskMeter label="Heat-illness (0–100)" value={risk.readings?.heatIllnessRisk} color="rose" />
                    <RiskMeter label="Flood risk (0–100)" value={risk.readings?.floodRisk} color="blue" />
                    <RiskMeter label="Vector suitability" value={risk.readings?.vectorRisk} color="violet" />
                    <RiskMeter label="EU AQI" value={risk.readings?.aqi} color="orange" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                    {[
                      { label: "Temp", value: `${risk.readings?.temperature ?? "—"}°C` },
                      { label: "Humidity", value: `${risk.readings?.humidity ?? "—"}%` },
                      { label: "Heat index", value: `${risk.readings?.heatIndex ?? "—"}°C` },
                      { label: "UV index", value: risk.readings?.uvIndex ?? "—" },
                    ].map((x) => (
                      <div key={x.label} className="bg-[#f7faf6] rounded-xl p-3 text-center">
                        <p className="text-[10px] uppercase text-[#6b7c6b]">{x.label}</p>
                        <p className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{x.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {risk.alerts?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
                    <h3 className="text-sm font-bold text-[#1a2e1a] mb-3 font-[family-name:var(--font-display)]">Active alerts</h3>
                    <div className="space-y-2">
                      {risk.alerts.map((a, i) => (
                        <div key={`${a.hazard}-${i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e5e7eb] px-3 py-2">
                          <div>
                            <p className="text-sm font-semibold text-[#1a2e1a] capitalize">{a.hazard}</p>
                            <p className="text-xs text-[#6b7c6b]">{a.value} {a.unit}</p>
                          </div>
                          <LevelBadge level={a.level} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {risk.outlook?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
                    <h3 className="text-sm font-bold text-[#1a2e1a] mb-3 font-[family-name:var(--font-display)]">7-day heat &amp; vector outlook</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={risk.outlook}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                          <Tooltip />
                          <Line type="monotone" dataKey="heatIllnessRisk" name="Heat illness" stroke="#e11d48" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="vectorRisk" name="Vector" stroke="#7c3aed" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 text-center text-sm text-[#6b7c6b]">
                Could not load risk for this facility.
              </div>
            )}
          </div>
        )}

        {/* PLAYBOOKS */}
        {tab === "playbooks" && (
          <div className="space-y-4">
            <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">
              Anticipatory action playbooks for headteachers, CHWs, and clinic leads — linked to child-sensitive alert levels.
            </p>
            {(riskPayload?.playbooks || []).map((pb) => {
              const active = risk?.alerts?.find((a) => a.playbookId === pb.id);
              const level = active?.level || "watch";
              const actions = pb.actions?.[level] || pb.actions?.watch || [];
              return (
                <div key={pb.id} className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="text-base font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{pb.title}</h3>
                    {active ? <LevelBadge level={level} /> : <span className="text-[10px] font-bold text-[#6b7c6b] uppercase">Template</span>}
                  </div>
                  <ul className="space-y-2">
                    {actions.map((act, i) => (
                      <li key={i} className="text-sm text-[#374151] font-[family-name:var(--font-body)] flex gap-2">
                        <span className="text-rose-500">•</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {!riskPayload?.playbooks?.length && (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 text-sm text-[#6b7c6b]">
                Select a facility under Live Risk to load playbooks for current conditions.
              </div>
            )}
          </div>
        )}

        {/* RESOURCES */}
        {tab === "resources" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                href: "/childrens-early-warning",
                title: "Children's Early Warning (public)",
                desc: "Pilot facility map, risk cards, forecasts, and playbooks — free for everyone.",
                icon: "👧",
              },
              {
                href: "/early-warning-status",
                title: "Public status dashboard",
                desc: "Live counters for facilities, alerts, and UNICEF-style transparency.",
                icon: "📊",
              },
              {
                href: "/urban-warning",
                title: "Urban Warning",
                desc: "Neighborhood flood and heat analysis for communities around your facility.",
                icon: "🏙️",
              },
              {
                href: "/advisor",
                title: "Dr. Kibira AI",
                desc: "Ask climate and children's health questions — free research assistant.",
                icon: "🌿",
              },
              {
                href: "/docs/early-warning",
                title: "Developer docs & APIs",
                desc: "Public /api/early-warning endpoints, thresholds, and open modules.",
                icon: "📄",
              },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="bg-white rounded-2xl border border-[#e5e7eb] p-5 hover:border-rose-300 hover:shadow-md transition-all"
              >
                <span className="text-3xl block mb-3">{card.icon}</span>
                <h3 className="text-base font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{card.title}</h3>
                <p className="text-sm text-[#6b7c6b] mt-2 font-[family-name:var(--font-body)]">{card.desc}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
