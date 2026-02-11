export default function Solution() {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
      title: "Deforestation Risk Mapping",
      description:
        "AI analyzes satellite imagery, land-use patterns, and socioeconomic data to identify areas at highest risk of deforestation — before it happens.",
      color: "bg-red-50 text-red-600",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ),
      title: "Smart Reforestation Plans",
      description:
        "Get AI-generated planting strategies using native tree species suited to your region's soil, rainfall, and climate patterns — maximizing survival rates and ecological impact.",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      title: "Carbon Sequestration Tracking",
      description:
        "Measure the carbon capture potential of your reforestation efforts with science-backed models. Generate verifiable reports for carbon credit markets.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      title: "Community Empowerment",
      description:
        "Designed for accessibility — works in low-bandwidth environments with simple interfaces. Empowers local leaders, farmers, and NGOs with actionable climate intelligence.",
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
        </svg>
      ),
      title: "Resilient Urban Services",
      description:
        "Innovative AI-powered services to help urban communities adapt to heat stress, flooding, food insecurity, and water scarcity through data-driven advisory and digital planning.",
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Select a Location",
      description: "Enter any region, district, or community in Africa",
    },
    {
      step: "02",
      title: "AI Analyzes Data",
      description: "Our AI processes climate, soil, and deforestation data",
    },
    {
      step: "03",
      title: "Get Recommendations",
      description: "Receive tailored reforestation and land-use strategies",
    },
    {
      step: "04",
      title: "Track & Report",
      description: "Monitor progress and generate carbon credit reports",
    },
  ];

  return (
    <section id="solution" className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Forest background image */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1920&q=80')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f13]/80 via-[#0a1f13]/70 to-[#0a1f13]/85" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-16">
          <span className="inline-block text-[#4ade80] font-semibold text-xs sm:text-sm tracking-widest uppercase mb-3 sm:mb-4 font-[family-name:var(--font-body)]">
            Our Solution
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6">
            Intelligence That
            <br />
            <span className="text-[#4ade80]">Grows Forests</span>
          </h2>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-body)]">
            KibiraAI combines cutting-edge AI with local ecological knowledge to give
            communities the tools they need to restore and protect Africa&rsquo;s forests.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-14 sm:mb-20">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-8 border border-white/15 hover:bg-white/15 transition-all duration-300 shadow-lg"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${feature.color} mb-4 sm:mb-5`}>
                {feature.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 font-[family-name:var(--font-display)]">
                {feature.title}
              </h3>
              <p className="text-white/70 leading-relaxed text-sm sm:text-base font-[family-name:var(--font-body)]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="text-center mb-8 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            How It Works
          </h3>
          <p className="text-white/60 text-base sm:text-lg font-[family-name:var(--font-body)]">
            Simple, accessible, and powerful
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#4ade80] text-[#0a1f13] text-base sm:text-xl font-bold mb-3 sm:mb-4 font-[family-name:var(--font-display)]">
                {step.step}
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-white/20" />
              )}
              <h4 className="text-sm sm:text-lg font-bold text-white mb-1 sm:mb-2 font-[family-name:var(--font-display)]">
                {step.title}
              </h4>
              <p className="text-white/60 text-xs sm:text-sm font-[family-name:var(--font-body)]">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Link to detail page */}
        <div className="mt-16 sm:mt-24 text-center">
          <a 
            href="/solution"
            className="inline-flex items-center gap-2 text-[#4ade80] hover:text-white transition-colors font-bold text-lg sm:text-xl group"
          >
            Explore the Detailed Digital Solution
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
