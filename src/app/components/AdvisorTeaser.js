import Link from "next/link";

export default function AdvisorTeaser() {
  return (
    <section id="demo" className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1511497584788-876760111969?w=1920&q=80"
          alt="Forest canopy"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f13]/75 via-[#0a1f13]/60 to-[#0a1f13]/80" />
      </div>

      <div className="absolute top-10 right-10 w-72 h-72 bg-[#4ade80]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-[#d4a843]/8 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <span className="inline-block text-[#4ade80] font-semibold text-xs sm:text-sm tracking-widest uppercase mb-3 sm:mb-4 font-[family-name:var(--font-body)]">
          Free for Everyone
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6 font-[family-name:var(--font-display)] drop-shadow-lg">
          Ask <span className="text-[#4ade80]">Dr. Kibira AI</span>
        </h2>
        <p className="text-white/75 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 font-[family-name:var(--font-body)]">
          Get AI-powered deforestation risk assessments, reforestation plans, urban heat and flood
          analysis, children&rsquo;s climate–health guidance, and climate-resilient strategies for any
          location in Africa — free for everyone, no signup required.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
          {[
            { icon: "🌳", label: "Forest Restoration" },
            { icon: "🌡️", label: "Urban Heat" },
            { icon: "🌊", label: "Flood Resilience" },
            { icon: "👧", label: "Children's Health" },
            { icon: "🌾", label: "Food Security" },
            { icon: "📊", label: "Carbon Tracking" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-3 sm:px-4 py-1.5 sm:py-2"
            >
              <span className="text-sm">{item.icon}</span>
              <span className="text-white/90 text-xs sm:text-sm font-medium font-[family-name:var(--font-body)]">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="max-w-sm sm:max-w-lg mx-auto mb-8 sm:mb-10 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 overflow-hidden shadow-2xl shadow-black/20">
          <div className="bg-gradient-to-r from-[#14532d]/90 to-[#166534]/90 px-5 py-3 flex items-center gap-3 border-b border-white/10">
            <div className="w-8 h-8 rounded-full bg-[#4ade80]/20 flex items-center justify-center text-base border border-[#4ade80]/30">
              🌿
            </div>
            <div>
              <h3 className="text-white font-bold text-sm font-[family-name:var(--font-display)]">Dr. Kibira AI</h3>
              <p className="text-[#a7f3d0]/70 text-[10px] font-[family-name:var(--font-body)]">AI-Powered Climate Intelligence</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
              <span className="text-white/60 text-[10px] font-[family-name:var(--font-body)]">Online</span>
            </div>
          </div>
          <div className="p-5 space-y-3 bg-[#f0fdf4]/90">
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center text-xs flex-shrink-0">🌿</div>
              <div className="bg-white/80 rounded-xl rounded-bl-sm px-3 py-2 text-xs text-[#1a2e1a] font-[family-name:var(--font-body)]">
                Ask about forests, urban climate, or children&apos;s health risks anywhere in Africa...
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-[#2d6a4f] text-white rounded-xl rounded-br-sm px-3 py-2 text-xs font-[family-name:var(--font-body)]">
                Kampala, Uganda 🏙️
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center text-xs flex-shrink-0">🌿</div>
              <div className="bg-white/80 rounded-xl rounded-bl-sm px-3 py-2 text-xs text-[#2d6a4f] font-semibold font-[family-name:var(--font-body)]">
                🌡️ Heat Risk: High · 🌊 Flood Zone: 3 wards · 🌳 Tree Cover: -12% · 👧 Child health alert ready
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/advisor"
            className="inline-flex items-center gap-3 bg-[#4ade80] hover:bg-[#22c55e] text-[#0a1f13] font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg transition-all hover:scale-105 shadow-lg shadow-[#4ade80]/25"
          >
            Launch Dr. Kibira AI
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/childrens-early-warning"
            className="inline-flex items-center gap-3 border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-8 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg transition-all"
          >
            Try Children&apos;s Early Warning
          </Link>
        </div>
      </div>
    </section>
  );
}
