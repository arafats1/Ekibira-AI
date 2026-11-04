import { DISTRICTS, LANGUAGES } from "../../lib/ews/regions";
import { PLAY_STORE_URL } from "../../lib/ews/account";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80"
      >
        <source src="https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f13]/70 via-[#0a1f13]/50 to-[#0a1f13]/80" />

      <div className="absolute top-20 left-10 w-40 sm:w-72 h-40 sm:h-72 bg-[#2d6a4f]/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-52 sm:w-96 h-52 sm:h-96 bg-[#d4a843]/10 rounded-full blur-3xl animate-float delay-300" />

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center">
        <div className="animate-fade-in-up inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 sm:px-5 py-2 mb-6 sm:mb-8">
          <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse-soft" />
          <span className="text-white text-xs sm:text-sm font-medium tracking-wide">Early warning for last-mile communities</span>
        </div>

        <h1 className="animate-fade-in-up delay-100 text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.08] tracking-tight mb-6 sm:mb-8 drop-shadow-lg">
          Restoring Africa&rsquo;s Climate
          <br />
          <span className="text-[#4ade80]">with Intelligence</span>
        </h1>

        <p className="animate-fade-in-up delay-200 text-base sm:text-lg md:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 font-[family-name:var(--font-body)]">
          KibiraAI turns weather forecasts and what communities see on the ground into early warnings for heavy rain, floods, landslides, dry spells and disease, sent by SMS, voice call and app in local languages, with what to do.
        </p>

        <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0a1f13] font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg transition-all hover:scale-105 shadow-lg shadow-[#4ade80]/25 w-full sm:w-auto text-center">
            Get the app on Google Play
          </a>
          <a href="/last-mile" className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg transition-all backdrop-blur-sm w-full sm:w-auto text-center">
            See today&apos;s warnings →
          </a>
        </div>

        <div className="animate-fade-in-up delay-300 mt-8 sm:mt-10 grid grid-cols-3 gap-3 max-w-xl mx-auto text-left">
          {[
            [DISTRICTS.length, "districts covered"],
            [LANGUAGES.length, "languages"],
            ["4", "ways to reach people: SMS, USSD, voice, app"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-3 sm:p-4">
              <p className="text-2xl sm:text-3xl font-bold text-[#4ade80] font-[family-name:var(--font-display)]">{v}</p>
              <p className="text-[11px] sm:text-xs text-white/70 leading-snug font-[family-name:var(--font-body)]">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
