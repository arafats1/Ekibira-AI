/**
 * Open-Meteo fetch helpers for children's early warning (no API key).
 */

export async function fetchWeatherBundle(lat, lng) {
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,weather_code` +
    `&forecast_days=7&timezone=auto`;

  const aqUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}` +
    `&current=pm10,pm2_5,european_aqi,uv_index` +
    `&timezone=auto`;

  const floodUrl =
    `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lng}` +
    `&daily=river_discharge,river_discharge_mean&forecast_days=7`;

  const [weatherRes, aqRes, floodRes] = await Promise.all([
    fetch(weatherUrl, { signal: AbortSignal.timeout(8000) }).catch(() => null),
    fetch(aqUrl, { signal: AbortSignal.timeout(8000) }).catch(() => null),
    fetch(floodUrl, { signal: AbortSignal.timeout(8000) }).catch(() => null),
  ]);

  const weather = weatherRes?.ok ? await weatherRes.json().catch(() => null) : null;
  const air = aqRes?.ok ? await aqRes.json().catch(() => null) : null;
  const flood = floodRes?.ok ? await floodRes.json().catch(() => null) : null;

  return { weather, air, flood };
}

export function computeFloodRiskScore(weather, flood, drainageVulnerability = 0.5) {
  let score = 0;
  if (weather?.daily) {
    const precips = weather.daily.precipitation_sum || [];
    const maxPrecip = Math.max(...precips, 0);
    const totalPrecip = precips.reduce((a, b) => a + (b || 0), 0);
    score += Math.min(35, (maxPrecip / 60) * 35);
    score += Math.min(15, (totalPrecip / 150) * 15);
  }
  score += drainageVulnerability * 25;
  if (flood?.daily) {
    const discharges = (flood.daily.river_discharge || []).filter((d) => d != null);
    const means = (flood.daily.river_discharge_mean || []).filter((m) => m != null);
    const maxDischarge = discharges.length ? Math.max(...discharges) : 0;
    const avgMean = means.length ? means.reduce((a, b) => a + b, 0) / means.length : 0;
    if (avgMean > 0 && maxDischarge > 0) {
      score += Math.min(15, Math.max(0, (maxDischarge / avgMean - 1) * 15));
    }
  }
  score += drainageVulnerability * 10;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function liveSnapshot(weather, air) {
  return {
    temperature: weather?.current?.temperature_2m ?? null,
    humidity: weather?.current?.relative_humidity_2m ?? null,
    apparentTemperature: weather?.current?.apparent_temperature ?? null,
    precipitation: weather?.current?.precipitation ?? null,
    pm25: air?.current?.pm2_5 ?? null,
    pm10: air?.current?.pm10 ?? null,
    aqi: air?.current?.european_aqi ?? null,
    uvIndex: air?.current?.uv_index ?? weather?.daily?.uv_index_max?.[0] ?? null,
  };
}
