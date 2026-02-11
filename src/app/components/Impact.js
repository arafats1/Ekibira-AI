export default function Impact() {
  const metrics = [
    {
      icon: "🌳",
      value: "50M+",
      label: "Trees Targeted",
      description: "Our 5-year goal across 12 African countries",
    },
    {
      icon: "🌍",
      value: "2.5M",
      label: "Hectares Restored",
      description: "Degraded land targeted for smart reforestation",
    },
    {
      icon: "💨",
      value: "18M",
      label: "Tonnes CO₂ Captured",
      description: "Estimated carbon sequestration over 10 years",
    },
    {
      icon: "👥",
      value: "500K+",
      label: "Farmers Empowered",
      description: "Smallholders gaining climate-smart tools",
    },
    {
      icon: "💰",
      value: "$45M",
      label: "Carbon Credit Revenue",
      description: "Projected community income from verified credits",
    },
    {
      icon: "📱",
      value: "12",
      label: "Countries Covered",
      description: "Across East, West, Central & Southern Africa",
    },
  ];

  const sdgs = [
    { number: 13, title: "Climate Action", color: "bg-green-600" },
    { number: 15, title: "Life on Land", color: "bg-emerald-600" },
    { number: 1, title: "No Poverty", color: "bg-red-600" },
    { number: 2, title: "Zero Hunger", color: "bg-amber-600" },
    { number: 8, title: "Decent Work", color: "bg-rose-600" },
    { number: 17, title: "Partnerships", color: "bg-blue-800" },
  ];

  return (
    <section id="impact" className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-gradient-to-b from-[#ecfdf5] via-[#d1fae5] to-[#ecfdf5] overflow-hidden">
      <div className="absolute top-0 right-0 w-52 sm:w-96 h-52 sm:h-96 bg-[#4ade80]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-52 sm:w-96 h-52 sm:h-96 bg-[#d4a843]/10 rounded-full blur-3xl" />
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-16">
          <span className="inline-block text-[#2d6a4f] font-semibold text-xs sm:text-sm tracking-widest uppercase mb-3 sm:mb-4 font-[family-name:var(--font-body)]">
            Projected Impact
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a2e1a] leading-tight mb-4 sm:mb-6">
            Measurable <span className="gradient-text">Climate Impact</span>
          </h2>
          <p className="text-[#6b7c6b] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-body)]">
            KibiraAI isn&rsquo;t just a tool — it&rsquo;s a movement. Here&rsquo;s what we aim to achieve
            with your support in the first 5 years.
          </p>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-10 sm:mb-16">
          {metrics.map((metric, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 sm:p-6 border border-[#a7f3d0] hover:border-[#34d399] transition-all duration-300 text-center shadow-md hover:shadow-xl hover:shadow-[#34d399]/10"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{metric.icon}</div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text font-[family-name:var(--font-display)]">
                {metric.value}
              </div>
              <div className="text-[#1a2e1a] font-semibold mt-1 text-sm sm:text-base font-[family-name:var(--font-display)]">
                {metric.label}
              </div>
              <p className="text-[#6b7c6b] text-xs sm:text-sm mt-1 sm:mt-2 font-[family-name:var(--font-body)] hidden sm:block">
                {metric.description}
              </p>
            </div>
          ))}
        </div>

        {/* SDG Alignment */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 border border-[#eef2e6]" style={{ boxShadow: "var(--card-shadow)" }}>
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1a2e1a] mb-2 sm:mb-3">
              Aligned with the UN Sustainable Development Goals
            </h3>
            <p className="text-[#6b7c6b] font-[family-name:var(--font-body)]">
              KibiraAI directly contributes to 6 SDGs, creating interconnected positive impact
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            {sdgs.map((sdg, i) => (
              <div
                key={i}
                className={`${sdg.color} text-white rounded-xl p-2.5 sm:p-4 text-center`}
              >
                <div className="text-base sm:text-2xl font-bold font-[family-name:var(--font-display)]">
                  SDG {sdg.number}
                </div>
                <div className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 opacity-90 font-[family-name:var(--font-body)]">
                  {sdg.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Theory of change */}
        <div className="mt-10 sm:mt-16 grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 text-center border border-[#eef2e6]" style={{ boxShadow: "var(--card-shadow)" }}>
            <div className="w-14 h-14 rounded-full bg-[#2d6a4f]/10 text-[#2d6a4f] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h4 className="font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">Technology</h4>
            <p className="text-[#6b7c6b] text-sm font-[family-name:var(--font-body)]">
              AI + satellite data + local knowledge = actionable climate intelligence accessible on any device
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 sm:p-6 text-center border border-[#eef2e6]" style={{ boxShadow: "var(--card-shadow)" }}>
            <div className="w-14 h-14 rounded-full bg-accent/10 text-[#d4a843] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h4 className="font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">Community</h4>
            <p className="text-[#6b7c6b] text-sm font-[family-name:var(--font-body)]">
              Empowering farmers, local leaders, and organizations to become climate champions in their communities
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 sm:p-6 text-center border border-[#eef2e6]" style={{ boxShadow: "var(--card-shadow)" }}>
            <div className="w-14 h-14 rounded-full bg-primary-light/10 text-primary-light flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
            <h4 className="font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">Scale</h4>
            <p className="text-[#6b7c6b] text-sm font-[family-name:var(--font-body)]">
              From local pilots to continental impact — designed to scale across Africa&rsquo;s diverse ecosystems
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
