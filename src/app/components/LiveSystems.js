export default function LiveSystems() {
  const systems = [
    {
      title: "Urban Heat & Flood Early Warning",
      subtitle: "Predictive Urban Protection",
      description:
        "AI-powered hyperlocal climate monitoring for Kampala's most vulnerable neighborhoods. Predicts flash floods 24–72 hours ahead and maps urban heat islands at neighborhood level, pushing SMS alerts to at-risk residents.",
      href: "/urban-warning",
      badge: "🏙️ FREE",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      stats: [
        { value: "5", label: "Neighborhoods" },
        { value: "225K+", label: "People Protected" },
        { value: "72h", label: "Advance Warning" },
      ],
      features: [
        "Hyperlocal flood prediction from weather + drainage data",
        "Heat island mapping with AI-generated cooling plans",
        "SMS/WhatsApp early warning alerts to residents",
      ],
      gradient: "from-[#0c2d48] to-[#1a1a2e]",
      accentColor: "text-blue-400",
      buttonBg: "bg-blue-500 hover:bg-blue-600 text-white",
      icon: "🌊",
    },
    {
      title: "Children's Climate Health Early Warning",
      subtitle: "Schools, Clinics & Local Leaders",
      description:
        "Facility-aware early warning for children — heat, humidity, UV, air quality, flood, heat-illness and vector risk — with playbooks for headteachers, CHWs, and community leaders. Public APIs and school/clinic sensor telemetry included.",
      href: "/childrens-early-warning",
      badge: "👧 FREE",
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      stats: [
        { value: "12", label: "Facilities" },
        { value: "10", label: "AQ/Weather Stations" },
        { value: "v1.0", label: "Open Source" },
      ],
      features: [
        "Child-sensitive thresholds for schools and clinics",
        "Heat-illness + vector suitability predictions",
        "Public status dashboard and open JSON APIs",
      ],
      gradient: "from-[#4a1c2a] to-[#2d1a24]",
      accentColor: "text-rose-300",
      buttonBg: "bg-rose-500 hover:bg-rose-600 text-white",
      icon: "🏫",
    },
    {
      title: "Dr. Kibira AI",
      subtitle: "Climate Research Assistant",
      description:
        "Ask anything about climate risk, deforestation, reforestation, urban heat, and children's climate health. Free for everyone — no signup required.",
      href: "/advisor",
      badge: "🌿 FREE",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      stats: [
        { value: "AI", label: "Advisor" },
        { value: "Live", label: "Weather" },
        { value: "Free", label: "Access" },
      ],
      features: [
        "Deforestation and reforestation analysis",
        "Location-aware weather and crop context",
        "No account required to start asking",
      ],
      gradient: "from-[#1a2e1a] to-[#0a1f13]",
      accentColor: "text-[#4ade80]",
      buttonBg: "bg-[#4ade80] hover:bg-[#22c55e] text-[#0a1f13]",
      icon: "🌿",
    },
  ];

  return (
    <section className="relative py-16 sm:py-24 px-4 sm:px-6 bg-[#f7faf6]">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-16">
          <span className="inline-flex items-center gap-2 text-[#2d6a4f] font-semibold text-xs sm:text-sm tracking-widest uppercase mb-3 sm:mb-4 font-[family-name:var(--font-body)]">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Systems
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1a2e1a] leading-tight mb-4 sm:mb-6 font-[family-name:var(--font-display)]">
            Beyond Data — <span className="gradient-text">Active Protection</span>
          </h2>
          <p className="text-[#6b7c6b] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-body)]">
            AI-powered systems that turn climate intelligence into real-time action —
            protecting forests, cities, and children&apos;s health.
          </p>
        </div>

        {/* System cards */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {systems.map((sys, i) => (
            <div
              key={i}
              className={`relative bg-gradient-to-br ${sys.gradient} rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 overflow-hidden group`}
            >
              {/* Glow effects */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

              <div className="relative z-10">
                {/* Badge */}
                <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border mb-4 ${sys.badgeColor}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {sys.badge}
                </span>

                {/* Title */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl sm:text-4xl">{sys.icon}</span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white font-[family-name:var(--font-display)] leading-tight">
                      {sys.title}
                    </h3>
                    <p className={`text-xs sm:text-sm font-semibold ${sys.accentColor} mt-1 font-[family-name:var(--font-body)]`}>
                      {sys.subtitle}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-white/60 text-sm leading-relaxed mb-5 font-[family-name:var(--font-body)]">
                  {sys.description}
                </p>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                  {sys.stats.map((stat, j) => (
                    <div key={j} className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 text-center">
                      <p className={`text-lg sm:text-xl font-bold ${sys.accentColor} font-[family-name:var(--font-display)]`}>
                        {stat.value}
                      </p>
                      <p className="text-white/40 text-[10px] sm:text-xs mt-0.5 font-[family-name:var(--font-body)]">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {sys.features.map((feat, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span className={`${sys.accentColor} text-xs mt-0.5`}>✓</span>
                      <p className="text-white/50 text-xs sm:text-sm font-[family-name:var(--font-body)]">{feat}</p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href={sys.href}
                  className={`inline-flex items-center gap-2 ${sys.buttonBg} font-bold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm transition-all hover:scale-105 shadow-lg w-full sm:w-auto justify-center sm:justify-start`}
                >
                  Launch Live System →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Plant a tree CTA */}
        <div className="mt-8 sm:mt-12 bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] rounded-2xl sm:rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#4ade80]/10 rounded-full blur-3xl" />
          <div className="relative z-10 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 font-[family-name:var(--font-display)]">
              🌱 Plant a Real Tree
            </h3>
            <p className="text-white/70 text-sm sm:text-base font-[family-name:var(--font-body)] max-w-lg">
              Contribute $1 per tree. We plant native species in Uganda&apos;s deforested areas. 
              Every tree is GPS-tagged and tracked on the KibiraAI platform.
            </p>
          </div>
          <a
            href="/plant-a-tree"
            className="relative z-10 bg-[#4ade80] hover:bg-[#22c55e] text-[#0a1f13] font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg transition-all hover:scale-105 shadow-lg shadow-[#4ade80]/25 flex-shrink-0 w-full sm:w-auto text-center"
          >
            🌳 Plant a Tree — $1
          </a>
        </div>
      </div>
    </section>
  );
}
