"use client";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const FORESTS = [
  {
    name: "Mabira Forest",
    area: "29,964 ha",
    region: "Central Uganda",
    threatLevel: 82,
    annualLoss: "312 ha/yr",
    canopy: "68%",
    keyThreat: "Sugar cane encroachment",
    products: ["Coffee", "Cocoa", "Vanilla", "Timber"],
    coords: { lat: 0.4, lng: 33.0 },
  },
  {
    name: "Bugoma Forest",
    area: "41,144 ha",
    region: "Western Uganda",
    threatLevel: 95,
    annualLoss: "890 ha/yr",
    canopy: "52%",
    keyThreat: "Hoima Sugar Ltd lease",
    products: ["Coffee", "Shea butter", "Timber"],
    coords: { lat: 1.2, lng: 30.9 },
  },
  {
    name: "Bwindi Impenetrable",
    area: "32,092 ha",
    region: "SW Uganda",
    threatLevel: 58,
    annualLoss: "85 ha/yr",
    canopy: "89%",
    keyThreat: "Buffer zone pressure",
    products: ["Honey", "Coffee", "Medicinal herbs"],
    coords: { lat: -1.0, lng: 29.6 },
  },
  {
    name: "Kibale Forest",
    area: "79,500 ha",
    region: "Western Uganda",
    threatLevel: 65,
    annualLoss: "145 ha/yr",
    canopy: "78%",
    keyThreat: "Community encroachment",
    products: ["Coffee", "Tea", "Timber"],
    coords: { lat: 0.5, lng: 30.4 },
  },
];

const EUDR_COMMODITIES = [
  { name: "Coffee", icon: "☕", risk: "High", regions: "Central & Western Uganda", note: "85% of Uganda's exports pass through forest-adjacent areas" },
  { name: "Cocoa", icon: "🍫", risk: "Critical", regions: "West Africa, Central Africa", note: "EUDR requires proof of zero-deforestation after Dec 2020" },
  { name: "Palm Oil", icon: "🌴", risk: "Critical", regions: "West Africa, Central Africa", note: "Most scrutinized commodity under EUDR" },
  { name: "Timber", icon: "🪵", risk: "High", regions: "Congo Basin, East Africa", note: "Must prove legal harvest from non-deforested areas" },
  { name: "Soy", icon: "🫘", risk: "Moderate", regions: "Southern Africa", note: "Growing African production under EU monitoring" },
  { name: "Rubber", icon: "🏭", risk: "Moderate", regions: "West Africa", note: "Increasing scrutiny on African rubber plantations" },
];

export default function EUComplianceDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [selectedForest, setSelectedForest] = useState(null);
  const [selectedView, setSelectedView] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

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

  const getThreatColor = (score) => {
    if (score >= 80) return "text-red-600 bg-red-50 border-red-200";
    if (score >= 60) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getComplianceStatus = (score) => {
    if (score >= 80) return { label: "Non-Compliant", color: "bg-red-100 text-red-700", icon: "❌" };
    if (score >= 60) return { label: "At Risk", color: "bg-orange-100 text-orange-700", icon: "⚠️" };
    return { label: "Likely Compliant", color: "bg-green-100 text-green-700", icon: "✅" };
  };

  return (
    <div className="min-h-screen bg-[#f7faf6]">
      {/* Top Bar */}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
            🇪🇺 EU Deforestation Regulation (EUDR) Compliance
          </h1>
          <p className="text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)]">
            Verify deforestation-free sourcing areas, generate compliance reports, and monitor supply chain risks for EU market access.
          </p>
        </div>

        {/* EUDR Quick Stats */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs text-indigo-600 font-[family-name:var(--font-body)] font-semibold">EUDR REGULATION</p>
              <p className="text-sm text-indigo-800 font-[family-name:var(--font-body)] mt-1">
                EU Regulation 2023/1115 requires companies to prove products entering the EU market were not produced on land deforested after <strong>December 31, 2020</strong>. Applies to: coffee, cocoa, soy, palm oil, timber, rubber, and cattle.
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: "overview", label: "Forest Status" },
            { id: "commodities", label: "Commodity Risk" },
            { id: "reports", label: "Compliance Reports" },
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

        {/* Forest Status View */}
        {selectedView === "overview" && (
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FORESTS.map((forest, i) => {
                const status = getComplianceStatus(forest.threatLevel);
                return (
                  <div
                    key={i}
                    className={`bg-white rounded-2xl border border-[#e5e7eb] p-6 hover:shadow-lg transition-all cursor-pointer ${
                      selectedForest === i ? "ring-2 ring-indigo-400" : ""
                    }`}
                    onClick={() => setSelectedForest(selectedForest === i ? null : i)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{forest.name}</h3>
                        <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{forest.region} • {forest.area}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold font-[family-name:var(--font-body)] ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                    </div>

                    {/* Risk Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Deforestation Threat Level</span>
                        <span className={`text-sm font-bold font-[family-name:var(--font-display)] ${forest.threatLevel >= 80 ? 'text-red-600' : forest.threatLevel >= 60 ? 'text-orange-500' : 'text-green-600'}`}>{forest.threatLevel}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${forest.threatLevel >= 80 ? 'bg-red-500' : forest.threatLevel >= 60 ? 'bg-orange-400' : 'bg-green-500'}`}
                          style={{ width: `${forest.threatLevel}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{forest.annualLoss}</p>
                        <p className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">Annual Loss</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{forest.canopy}</p>
                        <p className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">Canopy Cover</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs font-bold text-red-600 font-[family-name:var(--font-display)]">{forest.keyThreat.split(" ")[0]}</p>
                        <p className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">Key Threat</p>
                      </div>
                    </div>

                    {/* Affected Products */}
                    <div className="flex flex-wrap gap-1.5">
                      {forest.products.map((p, j) => (
                        <span key={j} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-[family-name:var(--font-body)]">
                          {p}
                        </span>
                      ))}
                    </div>

                    {/* Expanded Detail */}
                    {selectedForest === i && (
                      <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
                        <h4 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">EUDR Assessment</h4>
                        <div className="space-y-2 text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">
                          <p>• <strong>Key Threat:</strong> {forest.keyThreat}</p>
                          <p>• <strong>Coordinates:</strong> {forest.coords.lat}°N, {forest.coords.lng}°E</p>
                          <p>• <strong>Satellite Coverage:</strong> Sentinel-2 + Landsat 8/9 available</p>
                          <p>• <strong>Post-2020 Status:</strong> {forest.threatLevel >= 80 ? 'Significant deforestation detected since 2020 — products from this area likely non-compliant' : forest.threatLevel >= 60 ? 'Some deforestation activity detected — detailed due diligence required' : 'Limited deforestation since 2020 — likely compliant with proper documentation'}</p>
                        </div>
                        <Link
                          href={`/advisor?q=${encodeURIComponent(`EUDR compliance analysis for ${forest.name}: deforestation since 2020, satellite data, and compliance recommendations`)}`}
                          className="inline-block mt-3 text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors font-[family-name:var(--font-body)]"
                        >
                          Get Full AI Report →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Commodity Risk View */}
        {selectedView === "commodities" && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden mb-8">
            <div className="p-6 border-b border-[#e5e7eb]">
              <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">🌍 EUDR Commodity Risk Assessment</h2>
              <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mt-1">Risk levels for key commodities sourced from African supply chains</p>
            </div>
            <div className="divide-y divide-[#f0f0f0]">
              {EUDR_COMMODITIES.map((commodity, i) => (
                <div key={i} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{commodity.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{commodity.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-[family-name:var(--font-body)] ${
                          commodity.risk === "Critical" ? "bg-red-100 text-red-700" : commodity.risk === "High" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"
                        }`}>{commodity.risk} Risk</span>
                      </div>
                      <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{commodity.regions}</p>
                      <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mt-1 italic">{commodity.note}</p>
                    </div>
                    <Link
                      href={`/advisor?q=${encodeURIComponent(`EUDR compliance for ${commodity.name} sourced from ${commodity.regions}: deforestation risk, supply chain verification, and documentation needed`)}`}
                      className="text-xs bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg font-semibold hover:bg-indigo-100 transition-colors font-[family-name:var(--font-body)] whitespace-nowrap"
                    >
                      Analyze →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Reports */}
        {selectedView === "reports" && (
          <div className="space-y-6 mb-8">
            {/* Area Search */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
              <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-4">📋 Generate Compliance Report</h2>
              <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-4">
                Enter a sourcing area name or coordinates to generate an EUDR compliance assessment using AI + satellite data.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., Mabira Forest, Bugoma area, or coordinates (0.4°N, 33.0°E)"
                  className="flex-1 px-4 py-3 rounded-xl border border-[#d1d5db] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
                />
                <Link
                  href={searchQuery ? `/advisor?q=${encodeURIComponent(`Generate a comprehensive EUDR compliance report for: ${searchQuery}. Include: 1) Deforestation assessment since December 2020, 2) Satellite imagery analysis, 3) Canopy cover change data, 4) Risk classification (low/standard/high), 5) Required documentation checklist, 6) Compliance recommendations`)}` : "#"}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors font-[family-name:var(--font-body)] whitespace-nowrap"
                >
                  Generate Report →
                </Link>
              </div>
            </div>

            {/* Report Templates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Due Diligence Statement",
                  desc: "Generate Art. 4 due diligence statement for a specific sourcing area. Includes risk assessment and mitigation measures.",
                  query: "Generate an EUDR Article 4 due diligence statement template for Ugandan coffee exports. Include risk assessment methodology, geolocation data requirements, and supplier verification steps",
                },
                {
                  title: "Supply Chain Verification",
                  desc: "Verify that your supply chain locations are deforestation-free post-December 2020.",
                  query: "How to verify deforestation-free supply chains for Ugandan agricultural exports under EUDR. Include satellite data sources, verification methods, and documentation requirements",
                },
                {
                  title: "Risk Benchmarking Report",
                  desc: "Compare deforestation risk levels across different African sourcing regions.",
                  query: "Compare deforestation risk levels for key agricultural sourcing regions in Uganda, DRC, and Kenya. Include forest loss data, threat levels, and EUDR risk classification for each region",
                },
                {
                  title: "Satellite Analysis Overview",
                  desc: "Get satellite data analysis for canopy cover changes in your sourcing areas.",
                  query: "Provide satellite-based canopy cover change analysis for major Ugandan forest reserves since 2020. Include Sentinel-2 and Global Forest Watch data references",
                },
              ].map((template, i) => (
                <Link
                  key={i}
                  href={`/advisor?q=${encodeURIComponent(template.query)}`}
                  className="bg-white rounded-xl p-5 border border-[#e5e7eb] hover:shadow-md hover:border-indigo-300 transition-all group"
                >
                  <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">{template.title}</h3>
                  <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">{template.desc}</p>
                  <span className="text-sm text-indigo-600 font-semibold font-[family-name:var(--font-body)] group-hover:underline">Generate →</span>
                </Link>
              ))}
            </div>
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
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">AI-powered deforestation analysis, compliance reports, and satellite data interpretation for EUDR.</p>
            <span className="text-sm text-indigo-600 font-semibold font-[family-name:var(--font-body)] group-hover:underline">Start Analysis →</span>
          </Link>
          <Link href="/forest-sentinel" className="bg-white rounded-xl p-5 border border-[#e5e7eb] hover:shadow-md hover:border-indigo-300 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🌲</span>
              <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Forest Sentinel</h3>
            </div>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">Real-time forest monitoring with acoustic sensors. Track illegal logging activity in sourcing areas.</p>
            <span className="text-sm text-indigo-600 font-semibold font-[family-name:var(--font-body)] group-hover:underline">Monitor Forests →</span>
          </Link>
          <Link href="/urban-warning" className="bg-white rounded-xl p-5 border border-[#e5e7eb] hover:shadow-md hover:border-indigo-300 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🏙️</span>
              <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Climate Data</h3>
            </div>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">Environmental data for sourcing areas — rainfall patterns, climate trends, and ecosystem health indicators.</p>
            <span className="text-sm text-indigo-600 font-semibold font-[family-name:var(--font-body)] group-hover:underline">View Data →</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
