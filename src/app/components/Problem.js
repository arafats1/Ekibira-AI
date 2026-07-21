export default function Problem() {
  const problems = [
    {
      icon: "🪓",
      title: "Rapid Deforestation",
      description:
        "Africa loses 3.9 million hectares of forest annually — more than any other continent. Without monitoring and enforcement, critical ecosystems like the Congo Basin continue to disappear.",
      stat: "3.9M ha/year",
    },
    {
      icon: "🏙️",
      title: "Urban Climate Risk",
      description:
        "African cities face acute heat stress, flash flooding, and air pollution. Without data-driven early warning, millions of urban residents face displacement and climate-related disasters.",
      stat: "100M+ at risk",
    },
    {
      icon: "👧",
      title: "Children's Climate Health",
      description:
        "Extreme heat, floods, and pollution threaten children's access to health services, safe water, and schooling. Schools and clinics rarely get hyper-local alerts in time to act.",
      stat: "1B+ children in high-risk countries",
    },
  ];

  return (
    <section id="problem" className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-gradient-to-b from-white to-[#f0fdf4] overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M40 10 L25 35 L30 35 L20 55 L60 55 L50 35 L55 35 Z' fill='%23166534'/%3E%3Crect x='37' y='55' width='6' height='10' fill='%23166534'/%3E%3C/svg%3E")`, backgroundSize: '80px 80px'}} />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-10 sm:mb-16">
          <span className="inline-block text-[#2d6a4f] font-semibold text-xs sm:text-sm tracking-widest uppercase mb-3 sm:mb-4 font-[family-name:var(--font-body)]">
            The Crisis
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a2e1a] leading-tight mb-4 sm:mb-6">
            The <span className="gradient-text">Climate Challenge</span>
          </h2>
          <p className="text-[#6b7c6b] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-body)]">
            Africa loses millions of hectares of forest every year while its fastest-growing
            cities face heat, flooding, and pollution — and children bear the health burden.
            Communities need tools for forests, cities, and early action.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {problems.map((problem, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-2xl p-5 sm:p-8 border border-[#bbf7d0] hover:border-[#4ade80] transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-[#4ade80]/10"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <div className="flex items-start gap-3 sm:gap-5">
                <div className="text-3xl sm:text-4xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  {problem.icon}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">
                    {problem.title}
                  </h3>
                  <p className="text-[#6b7c6b] leading-relaxed text-sm sm:text-[15px] font-[family-name:var(--font-body)]">
                    {problem.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 bg-[#c1440e]/8 text-[#c1440e] rounded-full px-3 py-1 text-sm font-semibold font-[family-name:var(--font-body)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                    {problem.stat}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 sm:mt-16 bg-gradient-to-r from-[#14532d] to-[#166534] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center shadow-2xl shadow-[#14532d]/20">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 font-[family-name:var(--font-display)] text-white">
            The gap? Communities lack the tools and data to act.
          </h3>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto font-[family-name:var(--font-body)] mb-6">
            From forest rangers to city planners, farmers, schools, and clinics —
            people need accessible climate intelligence to protect ecosystems and lives.
            That&rsquo;s where KibiraAI comes in.
          </p>
          <a
            href="/problem"
            className="inline-flex items-center gap-2 text-[#4ade80] hover:text-white transition-colors font-bold text-lg group"
          >
            Explore the Full Problem Analysis
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
