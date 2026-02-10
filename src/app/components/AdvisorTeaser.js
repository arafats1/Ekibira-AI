import Link from "next/link";

export default function AdvisorTeaser() {
  return (
    <section id="demo" className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Forest background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1511497584788-876760111969?w=1920&q=80"
          alt="Forest canopy"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f13]/75 via-[#0a1f13]/60 to-[#0a1f13]/80" />
      </div>

      {/* Decorative glows */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-[#4ade80]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-[#d4a843]/8 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <span className="inline-block text-[#4ade80] font-semibold text-xs sm:text-sm tracking-widest uppercase mb-3 sm:mb-4 font-[family-name:var(--font-body)]">
          Interactive AI
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6 font-[family-name:var(--font-display)] drop-shadow-lg">
          Try the <span className="text-[#4ade80]">AI Advisor</span>
        </h2>
        <p className="text-white/75 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 font-[family-name:var(--font-body)]">
          Get AI-powered deforestation risk assessments, native tree recommendations,
          carbon sequestration estimates, and climate-smart strategies for any location in Africa.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
          {[
            { icon: "📊", label: "Risk Analysis" },
            { icon: "🌳", label: "Native Trees" },
            { icon: "🌍", label: "Carbon Estimates" },
            { icon: "🌾", label: "Smart Farming" },
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

        {/* Chat preview mockup */}
        <div className="max-w-sm sm:max-w-lg mx-auto mb-8 sm:mb-10 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 overflow-hidden shadow-2xl shadow-black/20">
          <div className="bg-gradient-to-r from-[#14532d]/90 to-[#166534]/90 px-5 py-3 flex items-center gap-3 border-b border-white/10">
            <div className="w-8 h-8 rounded-full bg-[#4ade80]/20 flex items-center justify-center text-base border border-[#4ade80]/30">
              🌿
            </div>
            <div>
              <h3 className="text-white font-bold text-sm font-[family-name:var(--font-display)]">EkibiraAI Advisor</h3>
              <p className="text-[#a7f3d0]/70 text-[10px] font-[family-name:var(--font-body)]">AI-Powered Intelligence</p>
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
                Welcome! Tell me a location in Africa...
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-[#2d6a4f] text-white rounded-xl rounded-br-sm px-3 py-2 text-xs font-[family-name:var(--font-body)]">
                Uganda 🏔️
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center text-xs flex-shrink-0">🌿</div>
              <div className="bg-white/80 rounded-xl rounded-bl-sm px-3 py-2 text-xs text-[#2d6a4f] font-semibold font-[family-name:var(--font-body)]">
                📊 Risk: High (78/100) &bull; 🌳 5 native trees &bull; 🌍 8.2-14.5 t CO₂/ha/yr
              </div>
            </div>
          </div>
        </div>

        {/* CTA button */}
        <Link
          href="/advisor"
          className="inline-flex items-center gap-3 bg-[#4ade80] hover:bg-[#22c55e] text-[#0a1f13] font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg transition-all hover:scale-105 shadow-lg shadow-[#4ade80]/25"
        >
          Launch AI Advisor
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
