import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Problem from "../components/Problem";
import RainMap from "../components/home/RainMap";

export const metadata = {
  title: "The Problem",
  description: "Why early warnings rarely reach last-mile communities in Uganda, and who pays the price.",
  alternates: { canonical: "/problem" },
};

const REGIONS = [
  { name: "Kigezi highlands", risks: "Landslides and hailstorms on steep, farmed slopes; heavy rain that cuts roads.", icon: "⛰️" },
  { name: "Ankole", risks: "Dry spells that dry up pasture and water for cattle, and late planting.", icon: "☀️" },
  { name: "Rwenzori", risks: "Rivers that rise fast from the mountains and flood valley towns and farms.", icon: "🌊" },
  { name: "Elgon", risks: "Landslides after long rains on Mount Elgon's slopes.", icon: "🌧️" },
];

const GAPS = [
  ["A warning is too general", "“Heavy rainfall expected in western Uganda” does not say which village, which day, or what to do."],
  ["It arrives the wrong way", "Bulletins go to email, websites and national radio; many households have a basic phone and listen to local stations."],
  ["It is in the wrong language", "Runyankore-Rukiga, Rufumbira, Lukonzo, Rutooro, Lugisu: people act on what they understand."],
  ["Nobody asks what happened", "Without replies from the ground, nobody learns whether a warning was right, so trust drops."],
  ["Health comes too late", "Malaria and diarrhoea rise weeks after the rain; clinics and parents hear when children are already sick."],
];

export default function ProblemPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#f6faf7]">
        <section className="pt-28 pb-14 bg-gradient-to-br from-[#0a1f13] via-[#0f2a1c] to-[#123524] text-white">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#4ade80]">The problem</p>
              <h1 className="mt-2 text-4xl sm:text-5xl font-bold">Danger is local. Warnings are not.</h1>
              <p className="mt-4 text-white/75 font-[family-name:var(--font-body)]">
                The weather that destroys a hillside garden or floods a valley often falls on a few villages. The people living there are the last to hear about it, and the warnings they do get rarely say what to do.
              </p>
            </div>
            <div className="rounded-3xl bg-white/5 border border-white/10 p-3">
              <RainMap className="h-[300px] sm:h-[360px] w-full" />
            </div>
          </div>
        </section>

        <Problem />

        <section className="pb-16 sm:pb-24">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2e1a] text-center">Different places, different dangers</h2>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {REGIONS.map((r) => (
                <div key={r.name} className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
                  <span className="text-3xl">{r.icon}</span>
                  <p className="mt-2 font-bold text-[#1a2e1a]">{r.name}</p>
                  <p className="mt-1 text-sm text-[#4a5c4a]">{r.risks}</p>
                </div>
              ))}
            </div>

            <h2 className="mt-14 text-2xl sm:text-3xl font-bold text-[#1a2e1a] text-center">Why today&apos;s warnings miss them</h2>
            <div className="mt-6 grid md:grid-cols-2 gap-3">
              {GAPS.map(([title, text], i) => (
                <div key={title} className="flex gap-4 bg-white rounded-2xl border border-[#e5e7eb] p-5">
                  <span className="w-9 h-9 shrink-0 rounded-full bg-[#fee2e2] text-[#991b1b] font-bold flex items-center justify-center">{i + 1}</span>
                  <div>
                    <p className="font-bold text-[#1a2e1a]">{title}</p>
                    <p className="text-sm text-[#4a5c4a] mt-1">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <a href="/solution" className="table mx-auto mt-10 bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold px-6 py-3 rounded-full">How KibiraAI closes the gap →</a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
