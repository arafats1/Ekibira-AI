import Link from "next/link";
import RainMap from "./home/RainMap";
import { DISTRICTS, LANGUAGES } from "../../lib/ews/regions";

// Faint contour lines, like a map of hills, drawn once as a tile.
const CONTOURS = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'><g fill='none' stroke='#4ade80' stroke-opacity='0.08' stroke-width='1.2'>${Array.from(
    { length: 9 },
    (_, i) => `<path d='M-20 ${60 + i * 62} C 120 ${20 + i * 62}, 220 ${110 + i * 62}, 330 ${60 + i * 62} S 520 ${10 + i * 62}, 620 ${70 + i * 62}'/>`
  ).join("")}<circle cx='430' cy='170' r='40'/><circle cx='430' cy='170' r='70'/><circle cx='430' cy='170' r='100'/><circle cx='140' cy='430' r='35'/><circle cx='140' cy='430' r='65'/></g></svg>`
)}")`;

const POINTS = [
  ["🌧️", "Heavy rain, floods, landslides and dry spells, before they arrive"],
  ["💬", "SMS, voice calls and the app, in your language"],
  ["👶", "Children's health alerts for parents"],
];

/**
 * Background for sign-in and sign-up: a deep green sky with soft moving light
 * and contour lines, and a panel with the rain map and what KibiraAI does:
 * beside the form on wide screens, below it on phones.
 */
export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#071a10]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,#1b4332_0%,transparent_55%),radial-gradient(ellipse_at_bottom_right,#0c4a6e_0%,transparent_50%),linear-gradient(160deg,#081c12_0%,#0d2a1c_50%,#08201a_100%)]" />
      <div className="absolute inset-0" style={{ backgroundImage: CONTOURS, backgroundSize: "600px 600px" }} />
      <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-[#4ade80]/15 blur-3xl animate-float" />
      <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full bg-[#1d91c0]/20 blur-3xl animate-float delay-300" />
      <div className="absolute -bottom-40 left-1/3 w-[26rem] h-[26rem] rounded-full bg-[#f59e0b]/10 blur-3xl animate-float delay-500" />

      <div className="relative z-10 min-h-screen max-w-[1300px] mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-2 gap-10 items-center">
        {/* On phones it comes after the form, so signing in stays first. */}
        <aside className="order-2 lg:order-1 text-white pb-6 lg:pb-0">
          <Link href="/" className="hidden lg:inline-flex items-center gap-2">
            <span className="text-3xl">🌿</span>
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#4ade80]">KibiraAI</span>
          </Link>
          <h2 className="lg:mt-8 text-3xl sm:text-4xl xl:text-5xl font-bold leading-tight">
            Know before the rain,
            <br />
            <span className="text-[#4ade80]">the flood and the fever</span>
          </h2>
          <ul className="mt-6 space-y-3">
            {POINTS.map(([icon, text]) => (
              <li key={text} className="flex items-start gap-3 text-white/80 font-[family-name:var(--font-body)]">
                <span className="w-9 h-9 shrink-0 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">{icon}</span>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-3xl bg-white/5 border border-white/10 p-3 backdrop-blur-sm">
            <RainMap className="h-[230px] sm:h-[260px] xl:h-[280px] w-full" />
          </div>
          <p className="mt-4 text-sm text-white/55">
            {DISTRICTS.length} districts · {LANGUAGES.length} languages · SMS, USSD, voice and app
          </p>
        </aside>

        <main className="order-1 lg:order-2 w-full max-w-lg mx-auto lg:mx-0 lg:justify-self-end pt-6 lg:pt-0">{children}</main>
      </div>
    </div>
  );
}
