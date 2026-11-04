"use client";
import { useCallback, useEffect, useState } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { describeWeather } from "../../../lib/ews/weather";

const KAMPALA = { lat: 0.3476, lng: 32.5825, name: "Kampala" };

/**
 * "Nakawa, Kampala" for a location: the neighbourhood or town and the district
 * (BigDataCloud's free browser lookup). Null when it cannot tell.
 */
async function placeName(lat, lng) {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    if (!res.ok) return null;
    const d = await res.json();
    const admin = d.localityInfo?.administrative || [];
    const clean = (n) => String(n || "").replace(/\s+(District|Municipality|City)$/i, "").trim();
    const district = clean(admin.find((a) => a.adminLevel === 4)?.name || d.city);
    const local = clean([...admin].reverse().find((a) => a.adminLevel >= 6 && clean(a.name) !== district)?.name || (clean(d.locality) !== district ? d.locality : ""));
    const name = [local, district].filter(Boolean).join(", ");
    return name || clean(d.countryName) || null;
  } catch {
    return null;
  }
}

const dayName = (date, i) =>
  i === 0 ? "Today" : new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short" });

function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl bg-white shadow-lg border border-[#e5e7eb] px-3 py-2 text-sm">
      <p className="font-bold text-[#1a2e1a]">{d.icon} {d.day}</p>
      <p className="text-[#1d4e89]">💧 {d.rain}mm{d.chance != null ? ` · ${d.chance}% chance` : ""}</p>
      <p className="text-[#b45309]">🌡️ {d.tMax}° / {d.tMin}°</p>
    </div>
  );
}

/**
 * The real 7-day forecast (Open-Meteo) for where the visitor is, or Kampala
 * until they share their location.
 */
export default function LocalForecast() {
  const [place, setPlace] = useState(KAMPALA);
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");
  const [note, setNote] = useState("");

  const load = useCallback(async (p) => {
    setState("loading");
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lng}` +
        `&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max` +
        `&forecast_days=7&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Forecast unavailable");
      setData(await res.json());
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    load(KAMPALA);
  }, [load]);

  const useMine = () => {
    setNote("");
    if (!navigator.geolocation) {
      setNote("This browser cannot share your location.");
      return;
    }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: Math.round(pos.coords.latitude * 100) / 100, lng: Math.round(pos.coords.longitude * 100) / 100, name: "Your area" };
        setPlace(p);
        load(p);
        // The forecast does not wait for the name; it replaces "Your area" when it arrives.
        placeName(p.lat, p.lng).then((name) => name && setPlace((cur) => (cur.lat === p.lat && cur.lng === p.lng ? { ...cur, name } : cur)));
      },
      (err) => {
        setState(data ? "ready" : "error");
        setNote(
          err.code === 1
            ? "Location is blocked. Allow location for this site in your browser settings, then try again."
            : "We could not find your location. Try again in a moment."
        );
      },
      { timeout: 15000, maximumAge: 30 * 60 * 1000, enableHighAccuracy: false }
    );
  };

  const d = data?.daily;
  const days =
    d?.time?.map((date, i) => ({
      day: dayName(date, i),
      tMax: Math.round(d.temperature_2m_max[i]),
      tMin: Math.round(d.temperature_2m_min[i]),
      range: [Math.round(d.temperature_2m_min[i]), Math.round(d.temperature_2m_max[i])],
      rain: Math.round((d.precipitation_sum[i] || 0) * 10) / 10,
      chance: d.precipitation_probability_max?.[i] ?? null,
      ...describeWeather(d.weather_code[i]),
    })) || [];
  const now = data?.current;
  const total = Math.round(days.reduce((n, x) => n + x.rain, 0));
  const wettest = days.reduce((a, x) => (x.rain > (a?.rain ?? -1) ? x : a), null);

  return (
    <div className="bg-white rounded-3xl border border-[#e5e7eb] shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#0f2a1c] to-[#1b4332] text-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4ade80]">Live forecast</p>
            <h3 className="text-2xl sm:text-3xl font-bold">{place.name}: the next 7 days</h3>
          </div>
          <button
            onClick={useMine}
            disabled={state === "locating"}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/30 hover:bg-white hover:text-[#1b4332] px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            📍 {state === "locating" ? "Finding you…" : place === KAMPALA ? "Use my location" : "Update my location"}
          </button>
        </div>
        {note && <p className="mt-3 text-sm text-amber-200">{note}</p>}
        {now && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2 sm:col-span-1 flex items-center gap-3">
              <span className="text-5xl sm:text-6xl">{describeWeather(now.weather_code).icon}</span>
              <div>
                <p className="text-4xl sm:text-5xl font-bold">{Math.round(now.temperature_2m)}°</p>
                <p className="text-sm text-white/75">{describeWeather(now.weather_code).label}</p>
              </div>
            </div>
            {[
              ["💧 Rain this week", `${total}mm`],
              ["🌧️ Wettest day", wettest ? `${wettest.day} · ${wettest.rain}mm` : "—"],
              ["💨 Wind · humidity", `${Math.round(now.wind_speed_10m)} km/h · ${now.relative_humidity_2m}%`],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-white/10 border border-white/10 p-3">
                <p className="text-[11px] text-white/65">{l}</p>
                <p className="text-lg font-bold mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {state === "error" && <p className="p-6 text-sm text-[#6b7c6b]">The forecast is not available right now. Please try again later.</p>}
      {state === "loading" && !days.length && <div className="m-6 h-72 rounded-2xl bg-[#f3f6f4] animate-pulse" />}

      {days.length > 0 && (
        <div className={`p-4 sm:p-7 transition-opacity ${state === "loading" ? "opacity-40" : ""}`}>
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={days} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="kbRain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1d91c0" />
                    <stop offset="100%" stopColor="#7fcdbb" />
                  </linearGradient>
                  <linearGradient id="kbTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef2ee" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 13, fill: "#4a5c4a", fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="rain" tick={{ fontSize: 12, fill: "#6b7c6b" }} axisLine={false} tickLine={false} unit="mm" width={48} />
                <YAxis yAxisId="temp" orientation="right" tick={{ fontSize: 12, fill: "#b45309" }} axisLine={false} tickLine={false} unit="°" width={36} domain={["dataMin - 4", "dataMax + 2"]} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(45,106,79,0.06)" }} />
                <Area yAxisId="temp" dataKey="range" stroke="none" fill="url(#kbTemp)" animationDuration={1200} />
                <Bar yAxisId="rain" dataKey="rain" fill="url(#kbRain)" radius={[8, 8, 0, 0]} maxBarSize={56} animationDuration={1000}>
                  <LabelList dataKey="rain" position="top" formatter={(v) => `${v}mm`} style={{ fontSize: 12, fill: "#1d4e89", fontWeight: 700 }} />
                </Bar>
                <Line yAxisId="temp" dataKey="tMax" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#f59e0b" }} animationDuration={1400} />
                <Line yAxisId="temp" dataKey="tMin" stroke="#fcd34d" strokeWidth={2} strokeDasharray="5 4" dot={false} animationDuration={1400} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-3">
            {days.map((x, i) => (
              <div key={x.day} className={`rounded-2xl text-center py-3 ${i === 0 ? "bg-[#d8f3dc]" : "bg-[#f6faf7]"}`}>
                <p className="text-xs font-bold text-[#1a2e1a]">{x.day}</p>
                <p className="text-2xl sm:text-3xl my-1">{x.icon}</p>
                <p className="text-xs sm:text-sm font-bold text-[#1a2e1a]">{x.tMax}° <span className="text-[#8a9a8a] font-normal">{x.tMin}°</span></p>
                {x.chance != null && <p className="text-[10px] sm:text-xs text-[#1d4e89] mt-0.5">{x.chance}%</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
