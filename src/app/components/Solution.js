export default function Solution() {
  const useCases = [
    {
      icon: "🌾",
      role: "Farmers & Agribusiness",
      title: "Climate-Smart Farming",
      description:
        "Farmers access AI-powered crop management with seasonal weather forecasts, flood and heat risk alerts, and smart irrigation recommendations. Add crops to your farm profile and get tailored plans for each growing season.",
      features: [
        "My Farm dashboard with crop tracking and calendar",
        "Flood & heat risk predictions for your location",
        "AI advisor for soil, pest, and harvest guidance",
        "Market price tracking and carbon credit opportunities",
      ],
      color: "from-amber-500/20 to-amber-600/10",
      accent: "text-amber-400",
      border: "border-amber-500/30",
    },
    {
      icon: "🌲",
      role: "Forestry & Conservation",
      title: "Real-Time Forest Protection",
      description:
        "Forestry officers and conservationists use acoustic sensors and AI to detect illegal logging in real time. Monitor forest health, track deforestation patterns, and receive instant alerts when threats are detected.",
      features: [
        "Forest Sentinel with live acoustic monitoring",
        "AI-powered chainsaw and logging sound detection",
        "GPS-tagged alerts sent to rangers within 30 seconds",
        "Dr. Kibira AI for forest research and analysis",
      ],
      color: "from-emerald-500/20 to-emerald-600/10",
      accent: "text-emerald-400",
      border: "border-emerald-500/30",
    },
    {
      icon: "🏙️",
      role: "Urban Policymakers",
      title: "Climate-Resilient Cities",
      description:
        "City planners and policymakers get AI-driven urban climate analysis — heat island mapping, flood risk scoring, and neighborhood-level vulnerability assessments to prioritize infrastructure investments.",
      features: [
        "Urban heat and flood early warning system",
        "Neighborhood-level climate vulnerability maps",
        "AI recommendations for cooling and drainage",
        "Real-time environmental data for any African area",
      ],
      color: "from-blue-500/20 to-blue-600/10",
      accent: "text-blue-400",
      border: "border-blue-500/30",
    },
    {
      icon: "🛡️",
      role: "Insurance Companies",
      title: "Climate Risk Underwriting",
      description:
        "Insurers access location-based climate risk scores for underwriting — AI-powered flood, heat, and drought risk analysis per area, with premium multiplier recommendations and portfolio risk analytics.",
      features: [
        "Flood and heat risk scoring per GPS location",
        "AI-generated risk reports for underwriting",
        "Premium multiplier recommendations",
        "Historical climate data and loss prediction",
      ],
      color: "from-purple-500/20 to-purple-600/10",
      accent: "text-purple-400",
      border: "border-purple-500/30",
    },
    {
      icon: "🇪🇺",
      role: "EU Compliance & Trade",
      title: "EUDR Supply Chain Verification",
      description:
        "Companies exporting to the EU verify deforestation-free sourcing with real environmental data. Search any area by name or coordinates, get AI compliance assessments, and generate documentation for EU market access.",
      features: [
        "Area search with interactive map and analysis",
        "AI-powered EUDR compliance risk scoring",
        "Commodity-level deforestation risk assessment",
        "Due diligence documentation generator",
      ],
      color: "from-indigo-500/20 to-indigo-600/10",
      accent: "text-indigo-400",
      border: "border-indigo-500/30",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Create Your Account",
      description: "Sign up and select your role — farmer, forestry, insurance, EU compliance, or general",
    },
    {
      step: "02",
      title: "Get Your Dashboard",
      description: "Access a personalized dashboard with tools tailored to your workflow",
    },
    {
      step: "03",
      title: "AI Analyzes Data",
      description: "Our AI processes real-time climate, soil, weather, and environmental data",
    },
    {
      step: "04",
      title: "Act on Insights",
      description: "Get actionable recommendations, alerts, and reports specific to your needs",
    },
  ];

  return (
    <section id="solution" className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1920&q=80')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f13]/85 via-[#0a1f13]/75 to-[#0a1f13]/90" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-16">
          <span className="inline-block text-[#4ade80] font-semibold text-xs sm:text-sm tracking-widest uppercase mb-3 sm:mb-4 font-[family-name:var(--font-body)]">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6">
            One Platform, <span className="text-[#4ade80]">Five Use Cases</span>
          </h2>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-body)]">
            KibiraAI gives every user a role-specific dashboard powered by real-time environmental
            data and AI — from smallholder farmers to EU compliance teams.
          </p>
        </div>

        {/* Use case cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-14 sm:mb-20">
          {useCases.map((uc, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${uc.color} backdrop-blur-md rounded-2xl p-5 sm:p-6 border ${uc.border} hover:bg-white/15 transition-all duration-300`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{uc.icon}</span>
                <div>
                  <p className={`text-xs font-semibold ${uc.accent} font-[family-name:var(--font-body)]`}>{uc.role}</p>
                  <h3 className="text-base sm:text-lg font-bold text-white font-[family-name:var(--font-display)] leading-tight">{uc.title}</h3>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-4 font-[family-name:var(--font-body)]">
                {uc.description}
              </p>
              <div className="space-y-1.5">
                {uc.features.map((feat, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <span className={`${uc.accent} text-xs mt-0.5`}>✓</span>
                    <p className="text-white/50 text-xs font-[family-name:var(--font-body)]">{feat}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* How it works steps */}
        <div className="text-center mb-8 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Getting Started
          </h3>
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
      </div>
    </section>
  );
}
