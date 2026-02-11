export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20">
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80"
      >
        <source
          src="https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f13]/70 via-[#0a1f13]/50 to-[#0a1f13]/80" />

      {/* Colored accent overlays */}
      <div className="absolute top-20 left-10 w-40 sm:w-72 h-40 sm:h-72 bg-[#2d6a4f]/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-52 sm:w-96 h-52 sm:h-96 bg-[#d4a843]/10 rounded-full blur-3xl animate-float delay-300" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-24 text-center">
        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 sm:px-5 py-2 mb-6 sm:mb-8">
          <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse-soft" />
          <span className="text-white text-xs sm:text-sm font-medium tracking-wide">
            AI-Powered Climate Action for Africa
          </span>
        </div>

        {/* Main headline */}
        <h1 className="animate-fade-in-up delay-100 text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.08] tracking-tight mb-6 sm:mb-8 drop-shadow-lg">
          Restoring Africa’s Climate
          <br />
          <span className="text-[#4ade80]">with Intelligence</span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-in-up delay-200 text-base sm:text-lg md:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-12 font-[family-name:var(--font-body)]">
         KibiraAI uses artificial intelligence to analyze deforestation patterns,  emerging urban climate challenges, recommend native reforestation strategies, and track carbon sequestration — empowering communities across Africa to fight climate change
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/advisor"
            className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0a1f13] font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg transition-all hover:scale-105 shadow-lg shadow-[#4ade80]/25 w-full sm:w-auto text-center"
          >
            Try the AI Advisor →
          </a>
          <a
            href="#problem"
            className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg transition-all backdrop-blur-sm w-full sm:w-auto text-center"
          >
            Learn More
          </a>
        </div>

        {/* Stats bar */}
        <div className="animate-fade-in-up delay-500 mt-12 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto">
          {[
            { value: "3.9M", label: "Hectares lost yearly in Africa", icon: "🌳" },
            { value: "15-20%", label: "Global emissions from deforestation", icon: "💨" },
            { value: "600M+", label: "Africans affected by climate change", icon: "👥" },
            { value: "~$82B", label: "Carbon credit market potential", icon: "💰" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-5 border border-white/15 hover:bg-white/15 transition-colors"
            >
              <div className="text-base sm:text-lg mb-1">{stat.icon}</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#4ade80] font-[family-name:var(--font-display)]">
                {stat.value}
              </div>
              <div className="text-white/60 text-xs md:text-sm mt-1 font-[family-name:var(--font-body)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" className="opacity-60">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
