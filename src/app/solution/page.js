import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WarningStory from "../components/home/WarningStory";
import LastMile from "../components/home/LastMile";
import ChildrenTeaser from "../components/home/ChildrenTeaser";
import LocalForecast from "../components/home/LocalForecast";
import AppCTA from "../components/home/AppCTA";

export const metadata = {
  title: "Our Solution",
  description: "How KibiraAI turns forecasts and community reports into early warnings that reach last-mile communities by SMS, voice and app.",
  alternates: { canonical: "/solution" },
};

const PARTS = [
  { icon: "📅", title: "Past 30 days", text: "How much rain has fallen against what is usual: wet ground slides and floods sooner, dry ground means dry spells." },
  { icon: "🌤️", title: "Today", text: "Current weather and reports from agents and community members, with photos and location." },
  { icon: "🔭", title: "Next 7–10 days", text: "51 ECMWF forecast runs give the chance of heavy rain; GloFAS forecasts how rivers rise." },
  { icon: "🧭", title: "What to do", text: "Advice written for farmers, vendors, families on slopes, livestock keepers, fishers and parents." },
];

const HONEST = [
  "Thresholds are starting points, reviewed with district teams; every SMS is checked by a person first.",
  "Each warning asks “Did it happen?”, and replies show how often warnings were right.",
  "Children's health scores come from weather and air quality, not case counts; confirmed outbreaks come from health officials.",
];

export default function SolutionPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#f6faf7]">
        <section className="pt-28 pb-12 bg-gradient-to-br from-[#0a1f13] via-[#0f2a1c] to-[#123524] text-white">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#4ade80]">Our solution</p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-bold max-w-3xl">Early warnings people can act on, where they live</h1>
            <p className="mt-4 text-white/75 max-w-2xl font-[family-name:var(--font-body)]">
              KibiraAI looks at the past, the present and the coming week for each district, decides what danger is coming, and tells people in their language what to do.
            </p>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PARTS.map((p) => (
                <div key={p.title} className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <span className="text-3xl">{p.icon}</span>
                  <p className="mt-2 font-bold">{p.title}</p>
                  <p className="mt-1 text-sm text-white/70">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2e1a] text-center mb-8">How a warning is made</h2>
            <WarningStory />
          </div>
        </section>

        <LastMile />

        <section className="py-16">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <LocalForecast />
          </div>
        </section>

        <ChildrenTeaser />

        <section className="py-16">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2e1a] text-center">What we are careful about</h2>
            <ul className="mt-6 grid md:grid-cols-3 gap-3">
              {HONEST.map((h) => (
                <li key={h} className="bg-white rounded-2xl border border-[#e5e7eb] p-5 text-sm text-[#4a5c4a]">✓ {h}</li>
              ))}
            </ul>
          </div>
        </section>

        <AppCTA />
      </main>
      <Footer />
    </>
  );
}
