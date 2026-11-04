import { DISTRICTS, REGIONS } from "../../../lib/ews/regions";
import RainMap from "./RainMap";

const CHANNELS = [
  { icon: "💬", title: "SMS", text: "Short warnings with what to do, on any phone. People reply 1–8 to say what really happened." },
  { icon: "#️⃣", title: "USSD", text: "Dial a code to register, choose a language and kind of work. No data, no smartphone." },
  { icon: "📞", title: "Voice calls", text: "Recorded warnings in local languages for people who cannot read." },
  { icon: "📱", title: "Mobile app", text: "Today's weather, rain ahead, risks and alerts, and reports with photos and location." },
  { icon: "📣", title: "Community agents", text: "Trusted local people who register neighbours, check conditions and pass warnings on." },
];

const PEOPLE = ["🌾 Farmers", "🛒 Market vendors", "🏠 Families on slopes and flood land", "🐄 Livestock keepers", "🎣 Fishers", "👶 Parents of young children"];

/** Where KibiraAI works and how warnings reach people there. */
export default function LastMile() {
  const byRegion = Object.entries(REGIONS).map(([key, label]) => [label, DISTRICTS.filter((d) => d.region === key).map((d) => d.name)]);
  return (
    <section id="last-mile" className="py-16 sm:py-24 bg-[#0f2a1c] text-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#4ade80]">Last-mile areas</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold max-w-3xl mx-auto">Built for villages the warnings never reached</h2>
        </div>
        <p className="mt-3 text-white/75 max-w-2xl mx-auto text-center font-[family-name:var(--font-body)]">
          Warnings are worked out for each district and for high-risk spots inside it, then sent the way people there already communicate, with advice written for their work.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {PEOPLE.map((p) => (
            <span key={p} className="rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-sm">{p}</span>
          ))}
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {CHANNELS.map((c) => (
            <div key={c.title} className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors">
              <span className="text-3xl">{c.icon}</span>
              <h3 className="mt-3 font-bold">{c.title}</h3>
              <p className="mt-1 text-sm text-white/70 leading-relaxed font-[family-name:var(--font-body)]">{c.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-6 items-center">
          <div className="rounded-3xl bg-white/5 border border-white/10 p-3">
            <RainMap className="h-[320px] sm:h-[420px] w-full" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {byRegion.map(([label, names]) => (
              <div key={label} className="rounded-2xl border border-[#4ade80]/25 p-5">
                <p className="font-bold text-[#4ade80]">{label}</p>
                <p className="mt-2 text-sm text-white/75 leading-relaxed">{names.join(" · ")}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center mt-8">
          <a href="/last-mile" className="text-[#4ade80] font-semibold hover:underline">See today&apos;s warnings for every district →</a>
        </p>
      </div>
    </section>
  );
}
