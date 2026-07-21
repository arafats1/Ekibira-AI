import Link from "next/link";

export default function WhoBenefits() {
  const activeRoles = [
    {
      id: "forestry",
      icon: "🌲",
      title: "Forestry & Conservation",
      desc: "Real-time forest acoustic monitoring, illegal logging detection, deforestation alerts, and AI-powered forest research and analysis tools.",
      color: "from-emerald-500 to-emerald-600",
      borderColor: "border-emerald-200 hover:border-emerald-400",
      href: "/signup?type=forestry",
      cta: "Protect Forests",
    },
    {
      id: "farmer",
      icon: "🌾",
      title: "Farmers & Agribusiness",
      desc: "Flood/heat risk predictions, seasonal weather forecasts, crop management, AI advisor for soil and pest guidance, and market price tracking.",
      color: "from-amber-500 to-amber-600",
      borderColor: "border-amber-200 hover:border-amber-400",
      href: "/signup?type=farmer",
      cta: "Get Started Free",
    },
    {
      id: "school_health",
      icon: "🏫",
      title: "Schools & Children's Health",
      desc: "Use climate data for child health early warning — heat, floods, air pollution, and humidity alerts so schools and clinics can act before hazards peak.",
      color: "from-rose-500 to-rose-600",
      borderColor: "border-rose-200 hover:border-rose-400",
      href: "/signup?type=school_health",
      cta: "Protect Children",
    },
    {
      id: "local_gov",
      icon: "🏛️",
      title: "Local Governments & Leaders",
      desc: "Ward-level flood, heat, and air-quality early warning with anticipatory action playbooks for community leaders and disaster response teams.",
      color: "from-sky-500 to-sky-600",
      borderColor: "border-sky-200 hover:border-sky-400",
      href: "/signup?type=local_gov",
      cta: "Get Early Warning",
    },
    {
      id: "insurance",
      icon: "🛡️",
      title: "Insurance Companies",
      desc: "Climate risk underwriting data, flood/heat risk scoring per location, premium multiplier recommendations, and portfolio risk analytics.",
      color: "from-blue-500 to-blue-600",
      borderColor: "border-blue-200 hover:border-blue-400",
      href: "/signup?type=insurance",
      cta: "Access Risk Data",
    },
    {
      id: "general",
      icon: "🔬",
      title: "Researchers & General",
      desc: "Full access to Dr. Kibira AI for climate research, deforestation analysis, urban early warning, and reforestation strategy planning.",
      color: "from-teal-500 to-teal-600",
      borderColor: "border-teal-200 hover:border-teal-400",
      href: "/signup?type=general",
      cta: "Start Researching",
    },
  ];

  return (
    <section id="who-benefits" className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-gradient-to-b from-white via-[#f7faf6] to-white overflow-hidden">
      <div className="absolute top-20 right-0 w-72 h-72 bg-[#4ade80]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-72 h-72 bg-[#d4a843]/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-10 sm:mb-16">
          <span className="inline-block text-[#2d6a4f] font-semibold text-xs sm:text-sm tracking-widest uppercase mb-3 sm:mb-4 font-[family-name:var(--font-body)]">
            Who Benefits
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a2e1a] leading-tight mb-4 sm:mb-6">
            Built for <span className="gradient-text">Every Sector</span>
          </h2>
          <p className="text-[#6b7c6b] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-body)]">
            Forests, farms, cities, schools, and health facilities — KibiraAI provides climate intelligence dashboards tailored to your workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {activeRoles.map((role) => (
            <div
              key={role.id}
              className={`bg-white rounded-2xl border-2 ${role.borderColor} p-6 sm:p-8 transition-all hover:shadow-xl hover:shadow-black/5 group`}
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <div className="text-4xl mb-4">{role.icon}</div>
              <h3 className="text-lg sm:text-xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-3">
                {role.title}
              </h3>
              <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] leading-relaxed mb-6">
                {role.desc}
              </p>
              <Link
                href={role.href}
                className={`inline-block w-full text-center py-3 rounded-xl bg-gradient-to-r ${role.color} text-white font-semibold text-sm transition-all hover:scale-[1.02] hover:shadow-lg font-[family-name:var(--font-body)]`}
              >
                {role.cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
