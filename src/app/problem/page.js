import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ProblemPage() {
  const forestCrisisStats = [
    {
      value: "3.9M",
      unit: "hectares/year",
      label: "Forest lost across Africa annually — more than any other continent",
      icon: "🪓",
    },
    {
      value: "15–20%",
      unit: "of global CO₂",
      label: "Contributed by land-use change in Africa, accelerating the warming cycle",
      icon: "💨",
    },
    {
      value: "<3%",
      unit: "climate finance",
      label: "Reaches African nations despite bearing the greatest burden of climate change",
      icon: "💸",
    },
  ];

  const urbanCrisisStats = [
    {
      value: "100M+",
      unit: "people at risk",
      label: "Urban dwellers in Africa exposed to severe heat, flooding, and water stress",
      icon: "🏙️",
    },
    {
      value: "1.5×",
      unit: "faster warming",
      label: "Africa heats faster than the global average, with cities amplifying the effect",
      icon: "🌡️",
    },
    {
      value: "60%",
      unit: "depend on land",
      label: "Of Africans rely on agriculture and natural resources now under threat",
      icon: "🌾",
    },
  ];

  const forestProblems = [
    {
      title: "The Congo Basin Under Siege",
      description:
        "The world's second-largest tropical forest is receding at an alarming pace. Illegal logging, slash-and-burn agriculture, and expanding commercial plantations are driving irreversible loss. Communities that depend on these ecosystems for food, water, and medicine are losing their lifeline.",
      stat: "~500K ha lost annually in the Congo Basin alone",
    },
    {
      title: "Soil & Water System Collapse",
      description:
        "Forests anchor Africa's water cycles. As tree cover disappears, rainfall patterns destabilize, rivers silt up, and aquifers deplete. The cascade reaches millions of smallholder farmers who depend on predictable seasons to grow food and earn a living.",
      stat: "70% of Africa's freshwater originates in forested watersheds",
    },
    {
      title: "Biodiversity Loss at Scale",
      description:
        "Africa hosts 6 of the world's 36 biodiversity hotspots. Deforestation fragments habitats, pushing species toward extinction and eliminating natural pest-control and pollination services that agriculture depends on.",
      stat: "25% of Africa's mammal species are now threatened",
    },
    {
      title: "Carbon Emission Feedback Loop",
      description:
        "When forests are cleared, stored carbon is released. Africa's land-use emissions account for 15–20% of the global total, yet the continent receives less than 3% of international climate finance to address the problem. Without intervention, forests shift from carbon sinks to carbon sources.",
      stat: "4.4 Gt CO₂ released from tropical deforestation globally each year",
    },
  ];

  const urbanProblems = [
    {
      title: "Urban Heat Islands",
      description:
        "Concrete, metal roofing, and minimal green cover turn African cities into furnaces. Temperatures in dense neighborhoods can exceed surrounding rural areas by 5–8°C. Heat-related illness, lost productivity, and increased energy demand disproportionately affect low-income communities with no access to cooling.",
      stat: "Up to 8°C hotter in informal settlements vs. rural areas",
      icon: "🌡️",
      color: "border-l-red-500",
    },
    {
      title: "Flash Flooding & Drainage Failure",
      description:
        "Rapid, unplanned urbanization paves over natural drainage. When heavy rains hit, water has nowhere to go. Informal settlements in Kampala, Lagos, Dar es Salaam, and Nairobi experience devastating floods that destroy homes, spread waterborne disease, and displace thousands — often with zero advance warning.",
      stat: "86% of Africa's urban growth occurs in flood-prone informal zones",
      icon: "🌊",
      color: "border-l-blue-500",
    },
    {
      title: "Food Insecurity in Growing Cities",
      description:
        "Africa's urban population is projected to triple by 2050. Cities already struggle to feed residents affordably. Rising temperatures reduce crop yields in peri-urban farmland, while supply chains to city markets remain fragile and expensive. Low-income households spend 60–80% of income on food.",
      stat: "By 2050, 1.3 billion Africans will live in cities",
      icon: "🥬",
      color: "border-l-amber-500",
    },
    {
      title: "Water Scarcity & Inequitable Access",
      description:
        "400 million people in Sub-Saharan Africa lack access to safe drinking water. Urban infrastructure cannot keep pace with population growth, leading to chronic shortages, reliance on unsafe sources, and conflict over shared water supplies. Climate change is intensifying drought cycles that feed the crisis.",
      stat: "400M people lack safe water access in Sub-Saharan Africa",
      icon: "💧",
      color: "border-l-cyan-500",
    },
  ];

  const interconnections = [
    {
      from: "Deforestation",
      to: "Urban Flooding",
      explanation: "Forest loss upstream destabilizes watersheds, increasing downstream flood severity in cities.",
    },
    {
      from: "Rising Temperatures",
      to: "Food Insecurity",
      explanation: "Higher heat reduces crop yields in peri-urban farmland, driving up city food prices.",
    },
    {
      from: "Carbon Emissions",
      to: "Heat Stress",
      explanation: "Deforestation-driven emissions accelerate warming, compounding urban heat island effects.",
    },
    {
      from: "Water System Collapse",
      to: "Water Scarcity",
      explanation: "Degraded forest watersheds mean less groundwater recharge and more erratic supply to cities.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7faf6]">
      <Navbar />

      <main className="pt-24 sm:pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* ── Hero Header ── */}
          <section className="relative overflow-hidden rounded-[2.5rem] border border-[#d6e7d6] bg-gradient-to-br from-[#fef9f0] via-[#f4fbf7] to-[#ecf7ef] px-6 sm:px-10 py-12 sm:py-16 mb-16 sm:mb-24">
            <div className="absolute -top-16 -right-10 w-64 h-64 bg-[#c1440e]/8 rounded-full blur-3xl" />
            <div className="absolute bottom-0 -left-12 w-72 h-72 bg-[#d4a843]/10 rounded-full blur-3xl" />
            <div className="relative text-center max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 text-[#c1440e] font-semibold text-xs tracking-widest uppercase mb-4 font-[family-name:var(--font-body)]">
                Understanding The Crisis
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-[#1a2e1a] leading-tight mb-6 font-[family-name:var(--font-display)]">
                Two Crises, <span className="text-[#c1440e]">One Continent</span>
              </h1>
              <p className="text-[#5d6f5d] text-lg sm:text-xl leading-relaxed font-[family-name:var(--font-body)]">
                Africa&rsquo;s forests are disappearing while its cities overheat, flood, and run short of food and water.
                These aren&rsquo;t separate problems — they&rsquo;re deeply interconnected, and they demand a unified response.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <a href="#forest-crisis" className="border border-[#2d6a4f]/30 text-[#2d6a4f] hover:bg-[#2d6a4f]/10 font-semibold px-6 py-3 rounded-full transition-colors text-sm">
                  Forest Crisis ↓
                </a>
                <a href="#urban-crisis" className="border border-[#c1440e]/30 text-[#c1440e] hover:bg-[#c1440e]/10 font-semibold px-6 py-3 rounded-full transition-colors text-sm">
                  Urban Crisis ↓
                </a>
                <a href="#interconnected" className="border border-[#d4a843]/30 text-[#8b6914] hover:bg-[#d4a843]/10 font-semibold px-6 py-3 rounded-full transition-colors text-sm">
                  How They Connect ↓
                </a>
              </div>
            </div>
          </section>

          {/* ── Headline Stats: Forest ── */}
          <section id="forest-crisis" className="mb-8">
            <div className="grid sm:grid-cols-3 gap-4">
              {forestCrisisStats.map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-[#dce9dc] shadow-sm text-center">
                  <span className="text-3xl">{stat.icon}</span>
                  <p className="text-3xl sm:text-4xl font-bold text-[#c1440e] mt-3 font-[family-name:var(--font-display)]">{stat.value}</p>
                  <p className="text-xs uppercase tracking-widest text-[#c1440e]/70 font-semibold mt-1">{stat.unit}</p>
                  <p className="text-sm text-[#5d6f5d] mt-3 font-[family-name:var(--font-body)]">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Forest Crisis Deep-Dive ── */}
          <section className="mb-20 sm:mb-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-14">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#c1440e] font-semibold mb-4 font-[family-name:var(--font-body)]">
                  Crisis 1 of 2
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2e1a] mb-6 font-[family-name:var(--font-display)]">
                  Africa&rsquo;s Forests Are Vanishing —<br />
                  And Taking Livelihoods With Them
                </h2>
                <div className="space-y-5 text-[#5d6f5d] font-[family-name:var(--font-body)] text-base sm:text-lg">
                  <p>
                    Africa loses more forest each year than any other continent. The drivers are complex:
                    commercial agriculture, charcoal production, illegal logging, and population pressure.
                    The consequences are devastating and far-reaching.
                  </p>
                  <p>
                    Over 60% of Africans depend directly on the land. When forests fall,
                    soil erodes, water systems collapse, biodiversity disappears, and carbon floods the atmosphere —
                    trapping communities in a cycle of poverty and environmental degradation.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-[2.5rem] p-2 shadow-2xl shadow-[#14532d]/10 overflow-hidden border border-[#cfe6d4]">
                <img
                  src="/deforestation.jpg"
                  alt="Deforestation in Africa"
                  className="rounded-2xl w-full h-full object-cover aspect-[4/3]"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {forestProblems.map((problem, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 sm:p-8 border border-[#dce9dc] hover:border-[#c1440e]/30 transition-all group shadow-sm">
                  <h3 className="text-lg sm:text-xl font-bold text-[#1a2e1a] mb-3 font-[family-name:var(--font-display)]">
                    {problem.title}
                  </h3>
                  <p className="text-[#5d6f5d] text-sm leading-relaxed font-[family-name:var(--font-body)] mb-4">
                    {problem.description}
                  </p>
                  <div className="inline-flex items-center gap-2 bg-[#c1440e]/8 text-[#c1440e] rounded-full px-3 py-1 text-xs font-semibold font-[family-name:var(--font-body)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c1440e]" />
                    {problem.stat}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Headline Stats: Urban ── */}
          <section id="urban-crisis" className="mb-8">
            <div className="grid sm:grid-cols-3 gap-4">
              {urbanCrisisStats.map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-[#dce9dc] shadow-sm text-center">
                  <span className="text-3xl">{stat.icon}</span>
                  <p className="text-3xl sm:text-4xl font-bold text-[#2d6a4f] mt-3 font-[family-name:var(--font-display)]">{stat.value}</p>
                  <p className="text-xs uppercase tracking-widest text-[#2d6a4f]/70 font-semibold mt-1">{stat.unit}</p>
                  <p className="text-sm text-[#5d6f5d] mt-3 font-[family-name:var(--font-body)]">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Urban Crisis Deep-Dive ── */}
          <section className="relative mb-20 sm:mb-28">
            <div className="absolute inset-0 bg-gradient-to-br from-[#e9f5ed] to-[#f6fbf7] rounded-[3rem]" />
            <div className="relative p-8 sm:p-14">
              <div className="grid lg:grid-cols-2 gap-12 items-center mb-14">
                <div className="order-2 lg:order-1 bg-white rounded-[2.5rem] p-2 shadow-2xl shadow-black/10 overflow-hidden border border-[#cfe6d4]">
                  <img
                    src="/kampala.jpg"
                    alt="Kampala city skyline"
                    className="rounded-2xl w-full h-full object-cover aspect-[4/3]"
                  />
                </div>
                <div className="order-1 lg:order-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#2d6a4f] font-semibold mb-4 font-[family-name:var(--font-body)]">
                    Crisis 2 of 2
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2e1a] mb-6 font-[family-name:var(--font-display)]">
                    African Cities Are Growing <br/>
                    Into Climate Danger Zones
                  </h2>
                  <div className="space-y-5 text-[#5d6f5d] font-[family-name:var(--font-body)] text-base sm:text-lg">
                    <p>
                      Africa is urbanizing faster than any other region. By 2050, over 1.3 billion people will
                      live in African cities. But this growth is outpacing infrastructure, planning, and services —
                      creating concentrated vulnerability to four escalating climate threats.
                    </p>
                    <p>
                      Heat stress, flash flooding, food insecurity, and water scarcity are not future risks.
                      They are happening now in Kampala, Lagos, Nairobi, Dar es Salaam, Accra, and dozens of
                      rapidly growing secondary cities.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                {urbanProblems.map((problem, i) => (
                  <div key={i} className={`bg-white rounded-2xl p-6 sm:p-8 border-l-4 ${problem.color} border border-[#dce9dc] shadow-sm`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{problem.icon}</span>
                      <h3 className="text-lg sm:text-xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
                        {problem.title}
                      </h3>
                    </div>
                    <p className="text-[#5d6f5d] text-sm leading-relaxed font-[family-name:var(--font-body)] mb-4">
                      {problem.description}
                    </p>
                    <div className="inline-flex items-center gap-2 bg-[#2d6a4f]/8 text-[#2d6a4f] rounded-full px-3 py-1 text-xs font-semibold font-[family-name:var(--font-body)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
                      {problem.stat}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Interconnections ── */}
          <section id="interconnected" className="mb-20 sm:mb-28">
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-[0.3em] text-[#d4a843] font-semibold mb-4 font-[family-name:var(--font-body)]">
                The Hidden Link
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2e1a] mb-5 font-[family-name:var(--font-display)]">
                These Crises Feed Each Other
              </h2>
              <p className="text-[#5d6f5d] text-base sm:text-lg max-w-2xl mx-auto font-[family-name:var(--font-body)]">
                Deforestation and urban climate vulnerability are not isolated — they form
                a reinforcing loop. Solving one without addressing the other is incomplete.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {interconnections.map((link, i) => (
                <div key={i} className="bg-[#1a2e1a] rounded-2xl p-6 sm:p-8 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-[#c1440e]/20 text-[#ff8a65] text-xs font-bold px-3 py-1 rounded-full font-[family-name:var(--font-body)]">
                      {link.from}
                    </span>
                    <svg width="20" height="20" fill="none" stroke="#d4a843" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <span className="bg-[#2d6a4f]/40 text-[#a7f3d0] text-xs font-bold px-3 py-1 rounded-full font-[family-name:var(--font-body)]">
                      {link.to}
                    </span>
                  </div>
                  <p className="text-white/75 text-sm leading-relaxed font-[family-name:var(--font-body)]">
                    {link.explanation}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── The Gap ── */}
          <section className="mb-20">
            <div className="bg-gradient-to-br from-[#14532d] to-[#1a2e1a] rounded-[2.5rem] p-8 sm:p-14 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#4ade80]/8 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#c1440e]/8 rounded-full blur-3xl" />

              <div className="relative grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 font-[family-name:var(--font-display)]">
                    The Gap That Keeps <br />Communities Vulnerable
                  </h2>
                  <div className="space-y-4 text-white/80 font-[family-name:var(--font-body)] text-base sm:text-lg">
                    <p>
                      Data exists — satellite imagery, climate models, hydrological surveys. But it sits
                      in silos, behind paywalls, or in formats that local leaders, farmers, and city
                      planners cannot use.
                    </p>
                    <p>
                      Without accessible intelligence, communities react instead of prepare.
                      Trees are cleared because no one mapped the risk. Neighborhoods flood because
                      no one modeled the drainage. Harvests fail because no one forecasted the heat.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { gap: "No early-warning systems", detail: "Communities learn about floods and heat waves after they hit" },
                    { gap: "No localized forest data", detail: "Deforestation mapping exists at global scale, not village scale" },
                    { gap: "No digital planning tools", detail: "City planners lack data to route drainage or site green corridors" },
                    { gap: "No unified platform", detail: "Forest and urban climate challenges are treated as separate problems" },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/8 backdrop-blur-sm rounded-xl border border-white/10 p-5">
                      <p className="text-white font-semibold text-sm font-[family-name:var(--font-display)]">{item.gap}</p>
                      <p className="text-white/60 text-xs mt-1 font-[family-name:var(--font-body)]">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <div className="bg-gradient-to-r from-[#f0fdf4] to-[#ecf7ef] rounded-[3rem] p-8 sm:p-16 text-center border border-[#d6e7d6]">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1a2e1a] mb-5 font-[family-name:var(--font-display)]">
              This Is The Problem <br />KibiraAI Is Built To Solve
            </h2>
            <p className="text-[#5d6f5d] text-base sm:text-lg max-w-2xl mx-auto mb-8 font-[family-name:var(--font-body)]">
              One AI-powered platform that turns fragmented climate data into actionable intelligence
              for Africa&rsquo;s forests and cities — accessible to the communities who need it most.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/solution"
                className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-bold px-10 py-5 rounded-full text-lg transition-all hover:scale-105 shadow-xl shadow-[#14532d]/15 w-full sm:w-auto"
              >
                See How We Solve It →
              </a>
              <a
                href="/advisor"
                className="border-2 border-[#2d6a4f]/20 text-[#2d6a4f] hover:bg-[#2d6a4f]/10 font-bold px-10 py-5 rounded-full text-lg transition-all w-full sm:w-auto"
              >
                Try the AI Advisor
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
