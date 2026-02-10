export default function CTA() {
  const fundingNeeds = [
    {
      amount: "$150K",
      title: "Phase 1: Foundation",
      timeline: "Months 1-6",
      items: [
        "Satellite data pipeline & AI model development",
        "Pilot program in 3 districts (Uganda, Ghana, DRC)",
        "Community engagement & local data collection",
        "Mobile-first platform development",
      ],
    },
    {
      amount: "$400K",
      title: "Phase 2: Scale",
      timeline: "Months 7-18",
      items: [
        "Expand to 5 countries across East & West Africa",
        "Real-time monitoring dashboard for partners",
        "Carbon credit verification system integration",
        "Train 200+ community climate ambassadors",
      ],
    },
    {
      amount: "$1.2M",
      title: "Phase 3: Impact",
      timeline: "Months 19-36",
      items: [
        "Full continental coverage (12 countries)",
        "Advanced AI models with drone integration",
        "Carbon credit marketplace for communities",
        "Research partnerships with African universities",
      ],
    },
  ];

  return (
    <section id="support" className="relative py-24 md:py-32 px-6 overflow-hidden">
      {/* Full background image */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1920&q=80')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f13]/85 via-[#0a1f13]/75 to-[#0a1f13]/90" />
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#4ade80]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#d4a843]/10 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-[#4ade80] font-semibold text-sm tracking-widest uppercase mb-4 font-[family-name:var(--font-body)]">
            Support This Initiative
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Help Us Restore
            <br />
            <span className="text-[#4ade80]">Africa&rsquo;s Green Future</span>
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-body)]">
            We are seeking grant funding and partnerships to bring KijaniAI from concept to
            continental impact. Your support will directly fund AI development, community
            programs, and reforestation efforts across Africa.
          </p>
        </div>

        {/* Funding phases */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {fundingNeeds.map((phase, i) => (
            <div
              key={i}
              className={`rounded-2xl p-6 border backdrop-blur-md ${
                i === 1
                  ? "bg-white/20 text-white border-[#4ade80]/40 shadow-lg shadow-[#4ade80]/10 ring-1 ring-[#4ade80]/20"
                  : "bg-white/10 text-white border-white/15"
              }`}
            >
              {i === 1 && (
                <div className="text-xs font-bold text-[#4ade80] uppercase tracking-wider mb-2 font-[family-name:var(--font-body)]">
                  Priority Phase
                </div>
              )}
              <div className="text-3xl font-bold mb-1 font-[family-name:var(--font-display)] text-[#4ade80]">
                {phase.amount}
              </div>
              <h3 className="text-lg font-bold mb-1 font-[family-name:var(--font-display)] text-white">
                {phase.title}
              </h3>
              <div className="text-xs mb-4 font-[family-name:var(--font-body)] text-white/50">
                {phase.timeline}
              </div>
              <ul className="space-y-2">
                {phase.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm font-[family-name:var(--font-body)] text-white/70">
                    <span className="mt-1 flex-shrink-0 text-[#4ade80]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Partnership types */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/15 mb-12">
          <h3 className="text-2xl font-bold text-white text-center mb-6 font-[family-name:var(--font-display)]">
            Partnership Opportunities
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "🏛️", title: "Grant Funders", desc: "Climate & technology foundations" },
              { icon: "🏢", title: "Corporate Partners", desc: "CSR & carbon offset programs" },
              { icon: "🌐", title: "NGOs & INGOs", desc: "Conservation & development orgs" },
              { icon: "🎓", title: "Research Partners", desc: "Universities & research institutions" },
            ].map((partner, i) => (
              <div key={i} className="text-center p-4">
                <div className="text-3xl mb-2">{partner.icon}</div>
                <h4 className="text-white font-bold text-sm font-[family-name:var(--font-display)]">{partner.title}</h4>
                <p className="text-white/50 text-xs mt-1 font-[family-name:var(--font-body)]">{partner.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a
              href="mailto:hello@kijaniai.org?subject=Grant%20Partnership%20Inquiry%20-%20KijaniAI&body=I%20am%20interested%20in%20supporting%20KijaniAI.%20Please%20share%20more%20details%20about%20partnership%20opportunities."
              className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0a1f13] font-bold px-10 py-4 rounded-full text-lg transition-all hover:scale-105 shadow-lg shadow-[#4ade80]/25 font-[family-name:var(--font-body)]"
            >
              Contact Us for Partnership
            </a>
            <a
              href="#demo"
              className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-10 py-4 rounded-full text-lg transition-all backdrop-blur-sm font-[family-name:var(--font-body)]"
            >
              Try the Demo First
            </a>
          </div>
          <p className="text-white/40 text-sm font-[family-name:var(--font-body)]">
            KijaniAI is an initiative by Abram Group &bull; Built with purpose in Uganda 🇺🇬
          </p>
        </div>
      </div>
    </section>
  );
}
