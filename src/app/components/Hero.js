export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background gradient — light & airy */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#e8f5e9] via-[#f1f8e9] to-[#fff8e1]" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#a5d6a7]/30 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#c8e6c9]/30 rounded-full blur-3xl animate-float delay-300" />

      {/* Leaf pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="leafPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.5" fill="white" />
          </pattern>
          <rect width="100" height="100" fill="url(#leafPattern)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center">
        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 bg-[#2d6a4f]/10 backdrop-blur-sm border border-[#2d6a4f]/20 rounded-full px-5 py-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-[#d4a843] animate-pulse-soft" />
          <span className="text-[#1b4332] text-sm font-medium tracking-wide">
            AI-Powered Climate Action for Africa
          </span>
        </div>

        {/* Main headline */}
        <h1 className="animate-fade-in-up delay-100 text-5xl md:text-7xl lg:text-8xl font-bold text-[#1b4332] leading-[1.05] tracking-tight mb-8">
          Restoring Africa&rsquo;s Forests
          <br />
          <span className="gradient-text">with Intelligence</span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-in-up delay-200 text-lg md:text-xl text-[#4a6741] max-w-2xl mx-auto leading-relaxed mb-12 font-[family-name:var(--font-body)]">
          KijaniAI uses artificial intelligence to analyze deforestation patterns,
          recommend native reforestation strategies, and track carbon sequestration
          — empowering communities across Africa to fight climate change.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#demo"
            className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-bold px-8 py-4 rounded-full text-lg transition-all hover:scale-105 shadow-lg"
          >
            Try the AI Advisor →
          </a>
          <a
            href="#problem"
            className="border-2 border-[#2d6a4f]/30 text-[#2d6a4f] hover:bg-[#2d6a4f]/10 font-semibold px-8 py-4 rounded-full text-lg transition-all"
          >
            Learn More
          </a>
        </div>

        {/* Stats bar */}
        <div className="animate-fade-in-up delay-500 mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { value: "3.9M", label: "Hectares lost yearly in Africa" },
            { value: "15-20%", label: "Global emissions from deforestation" },
            { value: "600M+", label: "Africans affected by climate change" },
            { value: "~$82B", label: "Carbon credit market potential" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-[#2d6a4f]/10 shadow-sm"
            >
              <div className="text-2xl md:text-3xl font-bold gradient-text font-[family-name:var(--font-display)]">
                {stat.value}
              </div>
              <div className="text-[#4a6741] text-xs md:text-sm mt-1 font-[family-name:var(--font-body)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg width="24" height="24" fill="none" stroke="#2d6a4f" strokeWidth="2" className="opacity-50">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
