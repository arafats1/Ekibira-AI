"use client";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf6] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#2d6a4f]">
          <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
          <span className="font-[family-name:var(--font-body)] text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = ["arafat@abramgroup.org", "admin@kibira.ai"].includes(user.email);

  const systems = [
    {
      title: "Forest Sentinel",
      desc: "Real-time acoustic monitoring of African forests. Detect threats like illegal logging and poaching using AI-powered sound classification.",
      icon: "🌲",
      href: "/forest-sentinel",
      status: "Live",
      statusColor: "bg-emerald-500",
      stats: [
        { label: "Forests Monitored", value: "4" },
        { label: "Sensor Zones", value: "16" },
        { label: "Sound Classes", value: "9" },
      ],
      features: ["Chainsaw & axe detection", "GPS triangulation", "Real-time alerts", "Event logging"],
    },
    {
      title: "AI Advisor",
      desc: "Get AI-powered climate analysis for any location in Africa. Deforestation risk, carbon potential, and future predictions.",
      icon: "🌿",
      href: "/advisor",
      status: "Live",
      statusColor: "bg-emerald-500",
      stats: [
        { label: "AI Model", value: "GPT-4o" },
        { label: "Coverage", value: "All Africa" },
        { label: "Data Sources", value: "IPCC+" },
      ],
      features: ["Location analysis", "Future predictions", "Carbon credit estimates", "Species recommendations"],
      isPublic: true,
    },
    {
      title: "Urban Warning",
      desc: "Climate risk monitoring for Kampala neighborhoods. Heat island mapping, flood risk assessment, and early warning systems.",
      icon: "🏙️",
      href: "/urban-warning",
      status: "Live",
      statusColor: "bg-blue-500",
      stats: [
        { label: "Neighborhoods", value: "5" },
        { label: "Risk Types", value: "2" },
        { label: "Forecast", value: "5 days" },
      ],
      features: ["Flood risk analytics", "Heat island mapping", "SMS/WhatsApp alerts", "Action plans"],
      isPublic: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7faf6]">
      {/* Top Bar */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="font-[family-name:var(--font-display)] text-xl font-bold text-[#1b4332]">KibiraAI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[#6b7c6b] hover:text-[#2d6a4f] font-[family-name:var(--font-body)] hidden sm:block">
              Home
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2d6a4f] flex items-center justify-center text-white text-xs font-bold font-[family-name:var(--font-body)]">
                {user.fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">{user.fullName}</p>
                <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{user.company || user.email}</p>
              </div>
              <button
                onClick={() => { logout(); router.push("/"); }}
                className="text-xs text-[#6b7c6b] hover:text-red-600 font-[family-name:var(--font-body)] px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
            Welcome back, {user.fullName?.split(" ")[0]}
          </h1>
          <p className="text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)]">
            Your KibiraAI dashboard — access all climate intelligence systems.
          </p>
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-[#fef3c7] border border-[#fde68a] text-[#92400e] text-sm font-semibold hover:bg-[#fde68a] transition-colors font-[family-name:var(--font-body)]"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
              Admin Dashboard — Manage users, chats & knowledge base
            </Link>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Systems Active", value: "3", icon: "📡" },
            { label: "Forests Monitored", value: "4", icon: "🌲" },
            { label: "Cities Covered", value: "5+", icon: "🏙️" },
            { label: "AI Analyses", value: "∞", icon: "🌿" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-[#e5e7eb] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-2xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{stat.value}</span>
              </div>
              <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Systems */}
        <h2 className="text-lg font-bold text-[#1a2e1a] mb-4 font-[family-name:var(--font-display)]">
          Your Systems
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {systems.map((sys, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sys.icon}</span>
                    <div>
                      <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{sys.title}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${sys.statusColor} animate-pulse`} />
                        <span className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{sys.status}</span>
                        {sys.isPublic && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-[family-name:var(--font-body)]">Public</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[#6b7c6b] mb-4 font-[family-name:var(--font-body)] leading-relaxed">{sys.desc}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {sys.stats.map((s, j) => (
                    <div key={j} className="bg-[#f0fdf4] rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-[#2d6a4f] font-[family-name:var(--font-display)]">{s.value}</p>
                      <p className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {sys.features.map((f, j) => (
                    <span key={j} className="text-[11px] bg-[#f8faf5] text-[#2d6a4f] border border-[#dcfce7] px-2 py-1 rounded-full font-[family-name:var(--font-body)]">
                      {f}
                    </span>
                  ))}
                </div>

                <Link
                  href={sys.href}
                  className="block w-full text-center py-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-sm font-semibold transition-colors font-[family-name:var(--font-body)]"
                >
                  Open {sys.title}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Plant a Tree CTA */}
        <div className="bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] rounded-2xl p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold font-[family-name:var(--font-display)]">🌱 Plant a Tree</h3>
              <p className="text-sm text-white/80 mt-1 font-[family-name:var(--font-body)]">
                Support reforestation directly — each tree sequesters up to 22kg of CO₂ per year.
              </p>
            </div>
            <Link
              href="/plant-a-tree"
              className="px-6 py-2.5 bg-white text-[#2d6a4f] rounded-xl font-semibold text-sm hover:bg-[#f0fdf4] transition-colors font-[family-name:var(--font-body)] flex-shrink-0"
            >
              Plant Now
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
