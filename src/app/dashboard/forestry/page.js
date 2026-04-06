"use client";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ForestryDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f7faf6] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tools = [
    {
      href: "/forest-sentinel",
      icon: "🌲",
      title: "Forest Sentinel",
      desc: "Real-time deforestation monitoring with satellite imagery, NDVI analysis, and conservation alerts for any forest region.",
      tag: "Full Access",
      tagColor: "bg-emerald-100 text-emerald-700",
    },
    {
      href: "/advisor",
      icon: "🌿",
      title: "Dr. Kibira AI",
      desc: "AI-powered climate risk analysis with deforestation data, carbon metrics, biodiversity insights, and projections.",
      tag: "AI Analysis",
      tagColor: "bg-blue-100 text-blue-700",
    },
    {
      href: "/urban-warning",
      icon: "🏙️",
      title: "Urban Warning",
      desc: "Flood and heat mapping with 5-day forecasts and neighborhood-level vulnerability data for urban areas.",
      tag: "Risk Data",
      tagColor: "bg-amber-100 text-amber-700",
    },
  ];

  const quickQueries = [
    "Deforestation rate in Kibira National Forest 2024-2025",
    "Carbon stock assessment for Bwindi Impenetrable Forest",
    "NDVI change detection in Mabira Forest Reserve",
    "Biodiversity impact of logging in Central African forests",
    "Reforestation progress in Uganda national parks",
    "Climate change impact on East African montane forests",
  ];

  return (
    <div className="min-h-screen bg-[#f7faf6]">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🌲</span>
            <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[#1a2e1a]">KibiraAI</span>
            <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">Forestry</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[#6b7c6b] hover:text-[#2d6a4f] font-[family-name:var(--font-body)] hidden sm:block">Home</Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                {user.fullName?.charAt(0)?.toUpperCase() || "F"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">{user.fullName}</p>
                <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{user.company || "Forestry"}</p>
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
            {greeting}, {user.fullName?.split(" ")[0] || "there"} 🌲
          </h1>
          <p className="text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)]">
            Monitor forests, track deforestation, and access AI-powered conservation intelligence.
          </p>
        </div>

        {/* Quick Launch - Forest Sentinel */}
        <Link href="/forest-sentinel" className="block mb-8 group">
          <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-2xl p-6 sm:p-8 text-white hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">🛰️</span>
                  <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-display)]">Forest Sentinel</h2>
                </div>
                <p className="text-emerald-200 text-sm font-[family-name:var(--font-body)] max-w-lg">
                  Launch the full forest monitoring system — satellite imagery analysis, NDVI vegetation tracking,
                  deforestation alerts, carbon stock estimates, and conservation reporting.
                </p>
              </div>
              <span className="text-emerald-300 group-hover:translate-x-1 transition-transform text-2xl hidden sm:block">→</span>
            </div>
          </div>
        </Link>

        {/* Tools Grid */}
        <h2 className="text-lg font-bold text-[#1a2e1a] mb-4 font-[family-name:var(--font-display)]">Your Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white rounded-xl p-5 border border-[#e5e7eb] hover:shadow-md hover:border-emerald-300 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tool.icon}</span>
                  <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{tool.title}</h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tool.tagColor}`}>{tool.tag}</span>
              </div>
              <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mb-3">{tool.desc}</p>
              <span className="text-sm text-emerald-600 font-semibold font-[family-name:var(--font-body)] group-hover:underline">Open →</span>
            </Link>
          ))}
        </div>

        {/* AI Quick Queries */}
        <div className="bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] rounded-2xl p-6 sm:p-8 text-white">
          <h3 className="text-base font-bold font-[family-name:var(--font-display)] mb-3">💡 Quick Forest Queries</h3>
          <p className="text-emerald-200 text-xs mb-4 font-[family-name:var(--font-body)]">
            Click any query to start an AI-powered analysis with Dr. Kibira
          </p>
          <div className="flex flex-wrap gap-2">
            {quickQueries.map((q, i) => (
              <Link key={i} href={`/advisor?q=${encodeURIComponent(q)}`} className="text-xs bg-white/15 hover:bg-white/25 backdrop-blur-sm px-3 py-2 rounded-full font-[family-name:var(--font-body)] transition-colors">
                {q}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
