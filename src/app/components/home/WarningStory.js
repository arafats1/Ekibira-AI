"use client";
import { useEffect, useRef, useState } from "react";

// A SIMULATED 10-day forecast: the middle forecast and a wet case (1 in 10
// forecast runs), in mm per day. Day 6 crosses the heavy-rain line.
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"];
const MIDDLE = [3, 6, 4, 9, 14, 26, 19, 8, 5, 3];
const WET = [7, 11, 9, 17, 25, 44, 33, 15, 10, 6];
const LINE = 30;

const STEPS = [
  { icon: "🛰️", title: "Forecast", text: "51 forecast runs and river models are checked every day for each district." },
  { icon: "⚖️", title: "Rules", text: "Heavy rain, floods, landslides, dry spells and disease risk are weighed against what is usual here." },
  { icon: "👀", title: "Review", text: "The KibiraAI team checks the draft and the advice before anything is sent." },
  { icon: "📲", title: "Warning", text: "SMS, voice calls and the app, in local languages, with what to do." },
  { icon: "💬", title: "Did it happen?", text: "People reply with what they saw, and the warnings learn from it." },
];

/** "How a warning is made", with a simulated chart that animates into view. */
export default function WarningStory() {
  const ref = useRef(null);
  const [step, setStep] = useState(-1);

  useEffect(() => {
    const el = ref.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        if (reduce) return setStep(STEPS.length);
        let i = 0;
        setStep(0);
        timer = setInterval(() => {
          i += 1;
          setStep(i);
          if (i >= STEPS.length) clearInterval(timer);
        }, 900);
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(timer);
    };
  }, []);

  const top = 50;
  const x = (i) => 6 + (i / (DAYS.length - 1)) * 88;
  const y = (mm) => 54 - (mm / top) * 46;
  const wetPath = WET.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const shown = step >= 0;

  return (
    <div ref={ref} className="grid lg:grid-cols-2 gap-8 items-center">
      <div className="bg-[#0f2a1c] rounded-3xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex items-center justify-between text-xs text-white/70 mb-2">
          <span>Rain forecast, one district (mm per day)</span>
          <span className="bg-white/10 rounded px-1.5 py-0.5">KibiraAI Sample Data</span>
        </div>
        <svg viewBox="0 0 100 62" className="w-full h-auto" role="img" aria-label="Simulated forecast crossing the heavy rain line on Saturday">
          {/* Heavy-rain line */}
          <line x1="4" x2="96" y1={y(LINE)} y2={y(LINE)} stroke="#f87171" strokeWidth="0.4" strokeDasharray="1.5 1" />
          <text x="96" y={y(LINE) - 1.2} textAnchor="end" fontSize="2.6" fill="#fca5a5">heavy rain {LINE}mm</text>
          {/* Middle forecast bars */}
          {MIDDLE.map((v, i) => (
            <rect
              key={i}
              x={x(i) - 2.4}
              width="4.8"
              y={shown ? y(v) : 54}
              height={shown ? 54 - y(v) : 0}
              rx="0.8"
              fill={WET[i] >= LINE ? "#60a5fa" : "#2d6a4f"}
              style={{ transition: `all 0.8s cubic-bezier(.2,.8,.2,1) ${i * 70}ms` }}
            />
          ))}
          {/* Wet case line */}
          <path
            d={wetPath}
            fill="none"
            stroke="#93c5fd"
            strokeWidth="0.6"
            strokeDasharray="200"
            strokeDashoffset={shown ? 0 : 200}
            style={{ transition: "stroke-dashoffset 1.6s ease 0.5s" }}
          />
          {WET.map((v, i) =>
            v >= LINE ? (
              <circle key={i} cx={x(i)} cy={y(v)} r={step >= 1 ? 1.6 : 0} fill="#f87171" style={{ transition: "r 0.4s ease" }}>
                {step >= 1 && <animate attributeName="r" values="1.6;2.6;1.6" dur="1.6s" repeatCount="indefinite" />}
              </circle>
            ) : null
          )}
          {DAYS.map((d, i) => (
            <text key={i} x={x(i)} y="60" textAnchor="middle" fontSize="2.6" fill="rgba(255,255,255,0.6)">{d}</text>
          ))}
        </svg>
        <div className="flex flex-wrap gap-4 text-[11px] text-white/70 mt-1">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#2d6a4f]" /> middle forecast</span>
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-[#93c5fd]" /> wet case (1 in 10 runs)</span>
        </div>
        <div
          className={`mt-4 rounded-2xl border border-orange-300/40 bg-orange-400/15 p-3 transition-all duration-700 ${step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
          <p className="text-[11px] font-bold text-orange-200 tracking-wide">BE READY · SMS</p>
          <p className="text-sm text-white mt-0.5">
            Heavy rain on Sat in Kabale (4 in 10 chance). Clear trenches, harvest mature crops early. Reply 1234 1=Heavy rain 5=No rain.
          </p>
        </div>
      </div>

      <ol className="space-y-3">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className={`flex gap-4 rounded-2xl border p-4 transition-all duration-500 ${
              step >= i ? "border-[#2d6a4f]/40 bg-white shadow-sm" : "border-transparent bg-white/40 opacity-50"
            }`}
          >
            <span className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-xl ${step >= i ? "bg-[#d8f3dc]" : "bg-gray-100"}`}>{s.icon}</span>
            <div>
              <p className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
                {i + 1}. {s.title}
              </p>
              <p className="text-sm text-[#4a5c4a] font-[family-name:var(--font-body)]">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
