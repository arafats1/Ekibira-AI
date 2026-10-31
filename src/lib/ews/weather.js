/**
 * Everyday weather for the last-mile console and app: current conditions,
 * a 7-day forecast and the last 30 days, from Open-Meteo (free, no key).
 * The probabilistic rainfall used for warnings lives in forecast.js.
 */

const DAILY = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "relative_humidity_2m_mean",
].join(",");

export const PAST_DAYS = 30;

// WMO weather interpretation codes.
const CONDITIONS = [
  [[0], "Clear", "☀️"],
  [[1], "Mostly sunny", "🌤️"],
  [[2], "Partly cloudy", "⛅"],
  [[3], "Cloudy", "☁️"],
  [[45, 48], "Fog", "🌫️"],
  [[51, 53, 55, 56, 57], "Drizzle", "🌦️"],
  [[61, 66, 80], "Light rain", "🌦️"],
  [[63, 81], "Rain", "🌧️"],
  [[65, 67, 82], "Heavy rain", "🌧️"],
  [[71, 73, 75, 77, 85, 86], "Snow", "❄️"],
  [[95], "Thunderstorms", "⛈️"],
  [[96, 99], "Storms with hail", "⛈️"],
];

export function describeWeather(code) {
  const hit = CONDITIONS.find(([codes]) => codes.includes(Number(code)));
  return hit ? { label: hit[1], icon: hit[2] } : { label: "—", icon: "🌡️" };
}

function round(n, digits = 1) {
  if (n == null || Number.isNaN(n)) return null;
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function coords(points) {
  return `latitude=${points.map((p) => p.lat).join(",")}&longitude=${points.map((p) => p.lng).join(",")}`;
}

async function fetchJson(url, revalidate, timeoutMs = 20000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), next: { revalidate } });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return res.json();
}

function todayKampala() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Kampala" });
}

function summarizePast(past) {
  const rain = past.reduce((n, d) => n + (d.rain || 0), 0);
  const last14 = past.slice(-14);
  const temps = past.filter((d) => d.tMax != null && d.tMin != null).map((d) => (d.tMax + d.tMin) / 2);
  return {
    days: past.length,
    rainTotal: round(rain),
    rain14: round(last14.reduce((n, d) => n + (d.rain || 0), 0)),
    rainyDays: past.filter((d) => (d.rain || 0) >= 1).length,
    heavyRainDays: past.filter((d) => (d.rain || 0) >= 20).length,
    meanTemp: temps.length ? round(temps.reduce((a, b) => a + b, 0) / temps.length) : null,
    meanTemp14: last14.length
      ? round(last14.reduce((n, d) => n + ((d.tMax ?? 0) + (d.tMin ?? 0)) / 2, 0) / last14.length)
      : null,
    meanHumidity: past.length ? round(past.reduce((n, d) => n + (d.humidity || 0), 0) / past.length, 0) : null,
  };
}

/** Weather for several points in one request. A failed point gets null. */
export async function getDailyWeather(points) {
  const url =
    `https://api.open-meteo.com/v1/forecast?${coords(points)}` +
    `&current=temperature_2m,weather_code,relative_humidity_2m&daily=${DAILY}` +
    `&past_days=${PAST_DAYS}&forecast_days=7&timezone=Africa%2FKampala`;
  let data;
  try {
    data = await fetchJson(url, 3600);
  } catch {
    return points.map(() => null);
  }
  const list = Array.isArray(data) ? data : [data];
  const today = todayKampala();
  return points.map((_, i) => {
    const d = list[i]?.daily;
    if (!d?.time?.length) return null;
    const rows = d.time.map((date, j) => ({
      date,
      code: d.weather_code?.[j],
      ...describeWeather(d.weather_code?.[j]),
      tMax: round(d.temperature_2m_max?.[j]),
      tMin: round(d.temperature_2m_min?.[j]),
      rain: round(d.precipitation_sum?.[j]),
      rainChance: d.precipitation_probability_max?.[j] ?? null,
      wind: round(d.wind_speed_10m_max?.[j], 0),
      humidity: round(d.relative_humidity_2m_mean?.[j], 0),
    }));
    const past = rows.filter((r) => r.date < today);
    const c = list[i].current;
    return {
      current: c
        ? { temp: round(c.temperature_2m, 0), humidity: c.relative_humidity_2m, code: c.weather_code, ...describeWeather(c.weather_code) }
        : null,
      days: rows.filter((r) => r.date >= today),
      past,
      pastSummary: summarizePast(past),
    };
  });
}

/**
 * Long-term normal for this time of year, from the same calendar window in
 * each of the last few years (ERA5 reanalysis via the Open-Meteo archive).
 * Lets rules and the AI say "wetter than usual" instead of using fixed
 * thresholds that fire every rainy season. One request per year, all
 * points at once, cached for a day.
 *
 * Returns per point: { years, past14, past30, next7 } with meanRain/meanTemp,
 * or null when the archive is unavailable.
 */
export async function getClimateNormals(points, years = 5) {
  const today = new Date(`${todayKampala()}T12:00:00Z`);
  const shift = (date, days) => new Date(date.getTime() + days * 86400000).toISOString().slice(0, 10);
  const windows = { past14: [-14, -1], past30: [-PAST_DAYS, -1], next7: [0, 6] };

  const perYear = await Promise.all(
    Array.from({ length: years }, async (_, k) => {
      const anchor = new Date(today);
      anchor.setUTCFullYear(today.getUTCFullYear() - (k + 1));
      const url =
        `https://archive-api.open-meteo.com/v1/archive?${coords(points)}` +
        `&start_date=${shift(anchor, -PAST_DAYS)}&end_date=${shift(anchor, 6)}` +
        `&daily=precipitation_sum,temperature_2m_mean&timezone=Africa%2FKampala`;
      try {
        const data = await fetchJson(url, 86400, 30000);
        const list = Array.isArray(data) ? data : [data];
        return list.map((p) => {
          const d = p?.daily;
          if (!d?.time?.length) return null;
          const out = {};
          for (const [key, [from, to]] of Object.entries(windows)) {
            const idx = d.time
              .map((date, i) => [Math.round((new Date(`${date}T12:00:00Z`) - anchor) / 86400000), i])
              .filter(([offset]) => offset >= from && offset <= to)
              .map(([, i]) => i);
            if (idx.length < to - from + 1) return null;
            out[key] = {
              rain: idx.reduce((n, i) => n + (d.precipitation_sum[i] || 0), 0),
              temp: idx.reduce((n, i) => n + (d.temperature_2m_mean[i] || 0), 0) / idx.length,
            };
          }
          return out;
        });
      } catch {
        return null;
      }
    })
  );

  const usable = perYear.filter(Boolean);
  if (!usable.length) return points.map(() => null);
  return points.map((_, i) => {
    const rows = usable.map((y) => y[i]).filter(Boolean);
    if (!rows.length) return null;
    const result = { years: rows.length, source: `ERA5 reanalysis, same dates in the last ${rows.length} years` };
    for (const key of Object.keys(windows)) {
      const rains = rows.map((r) => r[key].rain).sort((a, b) => a - b);
      result[key] = {
        meanRain: round(rains.reduce((a, b) => a + b, 0) / rains.length),
        wettestRain: round(rains[rains.length - 1]),
        driestRain: round(rains[0]),
        meanTemp: round(rows.reduce((n, r) => n + r[key].temp, 0) / rows.length),
      };
    }
    return result;
  });
}
