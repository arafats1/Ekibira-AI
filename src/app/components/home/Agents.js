import { PLAY_STORE_URL } from "../../../lib/ews/account";

const JOBS = [
  {
    icon: "📝",
    title: "Register neighbours",
    text: "Sign up people with basic phones, or no phone at all, with their consent, language and kind of work, so warnings reach the whole village.",
  },
  {
    icon: "🔎",
    title: "Check when asked",
    text: "When the forecast or satellites hint at trouble, agents look: is the river rising, are there cracks on the slope, is the pasture drying?",
  },
  {
    icon: "📸",
    title: "Report what happened",
    text: "Heavy rain, floods, landslides, sick crops or animals, with a photo, the exact place and a rain gauge reading, even offline.",
  },
  {
    icon: "📣",
    title: "Pass warnings on",
    text: "At church, the market, the borehole and school, agents explain each warning and what to do to people who did not get the SMS.",
  },
];

const WHY = [
  ["Ground truth", "Reports confirm or correct what the forecast said, area by area."],
  ["Sharper thresholds", "Every “Did it happen?” teaches the rules what really leads to floods and slides here."],
  ["Nobody left out", "Agents carry warnings to people without phones, in their own words."],
];

// Points on the loop: forecast → check → warn → report, around a circle.
const LOOP = [
  { label: "Forecast", icon: "🛰️", x: 160, y: 30 },
  { label: "Agent checks", icon: "🔎", x: 290, y: 160 },
  { label: "Warning sent", icon: "📲", x: 160, y: 290 },
  { label: "Agent reports", icon: "📸", x: 30, y: 160 },
];

function Loop() {
  return (
    <svg viewBox="-50 -5 420 335" className="w-full max-w-[440px] mx-auto" role="img" aria-label="Forecast, agent checks, warning sent, agent reports, and back to the forecast">
      <defs>
        <linearGradient id="kbLoop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="160" r="130" fill="none" stroke="#d8e9dd" strokeWidth="10" />
      <circle cx="160" cy="160" r="130" fill="none" stroke="url(#kbLoop)" strokeWidth="4" strokeDasharray="10 12">
        <animateTransform attributeName="transform" type="rotate" from="0 160 160" to="360 160 160" dur="40s" repeatCount="indefinite" />
      </circle>
      <path id="kbLoopPath" d="M160 30 A130 130 0 1 1 159.9 30" fill="none" />
      <circle r="8" fill="#2d6a4f">
        <animateMotion dur="8s" repeatCount="indefinite" rotate="auto">
          <mpath href="#kbLoopPath" />
        </animateMotion>
      </circle>
      <circle cx="160" cy="160" r="70" fill="#ffffff" stroke="#e5efe8" />
      <text x="160" y="152" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a2e1a">Better warnings</text>
      <text x="160" y="171" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2d6a4f">every season</text>
      {LOOP.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="26" fill="#ffffff" stroke="#2d6a4f" strokeWidth="2" />
          <text x={p.x} y={p.y + 7} textAnchor="middle" fontSize="20">{p.icon}</text>
          <text x={p.x} y={p.y + (p.y > 200 ? -36 : 44)} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1a2e1a">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

function ReportPhone() {
  return (
    <div className="relative mx-auto w-[260px] rounded-[2.2rem] bg-[#0f2a1c] p-3 shadow-2xl shadow-[#0f2a1c]/30 rotate-2">
      <div className="rounded-[1.7rem] bg-[#f6faf7] overflow-hidden">
        <div className="bg-[#2d6a4f] text-white px-4 py-3">
          <p className="text-[11px] opacity-80">Field report · example</p>
          <p className="font-bold">River rising near Kihihi</p>
        </div>
        <div className="p-4 space-y-3 text-[12px] text-[#1a2e1a]">
          <div className="h-24 rounded-xl bg-gradient-to-br from-[#7fcdbb] via-[#1d91c0] to-[#253494] relative overflow-hidden">
            <span className="absolute bottom-2 left-2 text-[10px] bg-black/40 text-white rounded px-1.5 py-0.5">📷 photo attached</span>
          </div>
          <p>🌊 <strong>Flooding</strong> · water over the footpath</p>
          <p>🌧️ Rain gauge: <strong>38 mm</strong> since morning</p>
          <p>📍 Near Kihihi, Kanungu · within 20 m</p>
          <div className="rounded-lg bg-[#d8f3dc] text-[#1b4332] px-3 py-2 font-semibold">✓ Sent to the KibiraAI team</div>
        </div>
      </div>
    </div>
  );
}

/** Who KibiraAI agents are and how their work makes warnings earlier and more accurate. */
export default function Agents() {
  return (
    <section id="agents" className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-[#fffaf0] via-[#f4faf5] to-[#f6faf7]">
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#f59e0b]/10 blur-3xl" />
      <div className="absolute bottom-0 -left-24 w-96 h-96 rounded-full bg-[#4ade80]/15 blur-3xl" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#b45309]">KibiraAI agents</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-[#1a2e1a]">Eyes and voices on the ground</h2>
          <p className="mt-3 text-[#4a5c4a] font-[family-name:var(--font-body)]">
            Forecasts see the sky. Our agents see the village. They are trusted local people who check, report and pass on warnings, and every report they send makes the next warning earlier and more accurate.
          </p>
        </div>

        <div className="mt-12 grid lg:grid-cols-[1fr_1.2fr] gap-10 items-center">
          <Loop />
          <div className="grid sm:grid-cols-2 gap-4">
            {JOBS.map((j, i) => (
              <div
                key={j.title}
                className="group rounded-2xl bg-white/90 backdrop-blur border border-[#e5efe8] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#d8f3dc] to-[#fef3c7] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">{j.icon}</span>
                  <span className="text-xs font-bold text-[#b45309]">0{i + 1}</span>
                </div>
                <h3 className="mt-3 font-bold text-[#1a2e1a]">{j.title}</h3>
                <p className="mt-1 text-sm text-[#4a5c4a] leading-relaxed font-[family-name:var(--font-body)]">{j.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-3xl bg-[#0f2a1c] text-white p-6 sm:p-10 grid md:grid-cols-[1fr_auto] gap-10 items-center">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold">Why agents make warnings more accurate</h3>
            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              {WHY.map(([t, d]) => (
                <div key={t} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <p className="font-bold text-[#4ade80]">{t}</p>
                  <p className="mt-1 text-sm text-white/75">{d}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="/signup?type=agent" className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0a1f13] font-bold px-6 py-3 rounded-full text-center transition-transform hover:scale-105">
                Become a KibiraAI agent
              </a>
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="border-2 border-white/30 hover:bg-white/10 font-semibold px-6 py-3 rounded-full text-center">
                Agent tools are in the app
              </a>
            </div>
          </div>
          <ReportPhone />
        </div>
      </div>
    </section>
  );
}
