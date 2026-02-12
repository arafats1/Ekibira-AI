export default function LiveSystems() {
  const systems = [
    {
      title: "AI Forest Acoustic Sentinel",
      subtitle: "Real-Time Forest Protection",
      description:
        "IoT sound sensors powered by neural networks detect illegal logging across Uganda's critical forests — Mabira, Bugoma, Bwindi, and Kibale — in real-time. Rangers receive instant SMS alerts within 30 seconds of detection.",
      href: "/forest-sentinel",
      badge: "🔊 LIVE",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      stats: [
        { value: "4", label: "Forests" },
        { value: "16", label: "Sensor Zones" },
        { value: "9", label: "Sound Classes" },
      ],
      features: [
        "Chainsaw & axe sound detection via TensorFlow Lite",
        "GPS triangulation and instant ranger alerts",
        "Evidence logging for NFA prosecution",
      ],
      gradient: "from-[#1a2e1a] to-[#0a1f13]",
      accentColor: "text-[#4ade80]",
      buttonBg: "bg-[#4ade80] hover:bg-[#22c55e] text-[#0a1f13]",
      icon: "🌳",
    },
    {
      title: "Urban Heat & Flood Early Warning",
      subtitle: "Predictive Urban Protection",
      description:
        "AI-powered hyperlocal climate monitoring for Kampala's most vulnerable neighborhoods. Predicts flash floods 24–72 hours ahead and maps urban heat islands at neighborhood level, pushing SMS alerts to at-risk residents.",
      href: "/urban-warning",
      badge: "🏙️ LIVE",
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
            Two AI-powered systems that turn climate intelligence into real-time action — 
            protecting Uganda&apos;s forests and city residents right now.
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
