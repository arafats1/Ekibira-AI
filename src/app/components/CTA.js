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
    <section id="support" className="py-24 md:py-32 px-6 bg-gradient-to-br from-[#e8f5e9] via-[#f1f8e9] to-[#fff8e1] relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#a5d6a7]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#c8e6c9]/20 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-[#2d6a4f] font-semibold text-sm tracking-widest uppercase mb-4 font-[family-name:var(--font-body)]">
            Support This Initiative
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1b4332] leading-tight mb-6">
            Help Us Restore
            <br />
            <span className="gradient-text">Africa&rsquo;s Green Future</span>
          </h2>
          <p className="text-[#4a6741] text-lg max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-body)]">
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
              className={`rounded-2xl p-6 border ${
                i === 1
                  ? "bg-white text-[#1a2e1a] border-accent shadow-lg"
                  : "bg-white/70 text-[#1a2e1a] border-[#2d6a4f]/10 shadow-sm"
              }`}
            >
              {i === 1 && (
                <div className="text-xs font-bold text-[#d4a843] uppercase tracking-wider mb-2 font-[family-name:var(--font-body)]">
                  Priority Phase
                </div>
              )}
              <div className={`text-3xl font-bold mb-1 font-[family-name:var(--font-display)] gradient-text`}>
                {phase.amount}
              </div>
              <h3 className="text-lg font-bold mb-1 font-[family-name:var(--font-display)] text-[#1a2e1a]">
                {phase.title}
              </h3>
              <div className="text-xs mb-4 font-[family-name:var(--font-body)] text-[#6b7c6b]">
                {phase.timeline}
              </div>
              <ul className="space-y-2">
                {phase.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm font-[family-name:var(--font-body)] text-[#6b7c6b]">
                    <span className="mt-1 flex-shrink-0 text-[#2d6a4f]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Partnership types */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-[#2d6a4f]/10 shadow-sm mb-12">
          <h3 className="text-2xl font-bold text-[#1b4332] text-center mb-6 font-[family-name:var(--font-display)]">
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
                <h4 className="text-[#1b4332] font-bold text-sm font-[family-name:var(--font-display)]">{partner.title}</h4>
                <p className="text-[#4a6741] text-xs mt-1 font-[family-name:var(--font-body)]">{partner.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a
              href="mailto:hello@kijaniai.org?subject=Grant%20Partnership%20Inquiry%20-%20KijaniAI&body=I%20am%20interested%20in%20supporting%20KijaniAI.%20Please%20share%20more%20details%20about%20partnership%20opportunities."
              className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-bold px-10 py-4 rounded-full text-lg transition-all hover:scale-105 shadow-lg font-[family-name:var(--font-body)]"
            >
              Contact Us for Partnership
            </a>
            <a
              href="#demo"
              className="border-2 border-[#2d6a4f]/30 text-[#2d6a4f] hover:bg-[#2d6a4f]/10 font-semibold px-10 py-4 rounded-full text-lg transition-all font-[family-name:var(--font-body)]"
            >
              Try the Demo First
            </a>
          </div>
          <p className="text-[#4a6741]/60 text-sm font-[family-name:var(--font-body)]">
            KijaniAI is an initiative by Abram Group &bull; Built with purpose in Uganda 🇺🇬
          </p>
        </div>
      </div>
    </section>
  );
}
