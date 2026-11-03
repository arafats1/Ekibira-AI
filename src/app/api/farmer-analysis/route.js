import { NextResponse } from "next/server";
import OpenAI from "openai";
import { placeWarnings, withHeatWarning } from "@/lib/ews/place";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── WMO Weather Code → Condition ───
function mapWeatherCode(code) {
  if (code <= 1) return "Sunny";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code >= 45 && code <= 48) return "Foggy";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 63) return "Light Rain";
  if (code >= 64 && code <= 67) return "Heavy Rain";
  if (code >= 71 && code <= 77) return "Overcast";
  if (code >= 80 && code <= 81) return "Showers";
  if (code === 82) return "Heavy Rain";
  if (code >= 95) return "Thunderstorm";
  return "Partly Cloudy";
}

// ─── Fetch weather + soil data from Open-Meteo (FREE) ───
async function fetchWeatherAndSoil(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max,et0_fao_evapotranspiration,uv_index_max` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,soil_temperature_0cm,soil_moisture_0_to_1cm` +
      `&hourly=soil_moisture_0_to_1cm,soil_temperature_0cm,evapotranspiration` +
      `&timezone=auto&forecast_days=7`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Fetch historical climate normals (last 30 days of past year) for seasonal context ───
async function fetchClimateHistory(lat, lng) {
  try {
    // Get last 365 days monthly aggregates to understand annual rainfall pattern
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
      `&start_date=${startStr}&end_date=${endStr}&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.daily?.time) return null;

    // Aggregate by month
    const monthly = {};
    data.daily.time.forEach((dateStr, i) => {
      const m = dateStr.substring(5, 7); // "01" to "12"
      if (!monthly[m]) monthly[m] = { precip: [], tMax: [], tMin: [] };
      monthly[m].precip.push(data.daily.precipitation_sum?.[i] || 0);
      monthly[m].tMax.push(data.daily.temperature_2m_max?.[i] || 0);
      monthly[m].tMin.push(data.daily.temperature_2m_min?.[i] || 0);
    });

    const result = {};
    for (const [m, vals] of Object.entries(monthly)) {
      const avgPrecip = vals.precip.reduce((a, b) => a + b, 0);
      const avgTMax = vals.tMax.length ? (vals.tMax.reduce((a, b) => a + b, 0) / vals.tMax.length) : 0;
      const avgTMin = vals.tMin.length ? (vals.tMin.reduce((a, b) => a + b, 0) / vals.tMin.length) : 0;
      result[m] = {
        totalPrecipMm: Math.round(avgPrecip),
        avgMaxTemp: Math.round(avgTMax * 10) / 10,
        avgMinTemp: Math.round(avgTMin * 10) / 10,
      };
    }
    return result;
  } catch {
    return null;
  }
}

// ─── Fetch flood / river discharge from GloFAS ───
async function fetchFloodData(lat, lng) {
  try {
    const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lng}&daily=river_discharge,river_discharge_mean,river_discharge_max&forecast_days=7`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.daily?.river_discharge) return null;
    return data;
  } catch {
    return null;
  }
}

// ─── Compute flood risk score from real data ───
function computeFloodRisk(weatherData, floodData) {
  let score = 0;

  if (weatherData?.daily) {
    const precips = weatherData.daily.precipitation_sum || [];
    const maxPrecip = Math.max(...precips, 0);
    const totalPrecip = precips.reduce((a, b) => a + (b || 0), 0);

    // Daily intensity: 0-35pts (60mm+ daily = max)
    score += Math.min(35, (maxPrecip / 60) * 35);
    // Cumulative 7-day: 0-20pts (200mm+ = max)
    score += Math.min(20, (totalPrecip / 200) * 20);
  }

  // Soil saturation proxy: if soil moisture is very high -> more flood risk
  if (weatherData?.current?.soil_moisture_0_to_1cm != null) {
    const sm = weatherData.current.soil_moisture_0_to_1cm;
    // Soil moisture typically 0.1 to 0.5 m³/m³
    score += Math.min(20, Math.max(0, (sm - 0.2) / 0.3) * 20);
  }

  // River discharge anomaly: 0-25pts
  if (floodData?.daily) {
    const discharges = (floodData.daily.river_discharge || []).filter((d) => d != null);
    const means = (floodData.daily.river_discharge_mean || []).filter((m) => m != null);
    const maxDischarge = discharges.length > 0 ? Math.max(...discharges) : 0;
    const avgMean = means.length > 0 ? means.reduce((a, b) => a + b, 0) / means.length : 0;

    if (avgMean > 0 && maxDischarge > 0) {
      const anomaly = maxDischarge / avgMean;
      score += Math.min(25, Math.max(0, (anomaly - 1) * 20));
    }
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── Usual daytime highs here at this time of year ───
// Daily highs within 10 days either side of today's date in each of the last
// 5 years (ERA5 via the Open-Meteo archive). 30°C is ordinary in Lira but
// rare in Kabale, so heat is scored against what is normal for the place.
async function fetchUsualHighs(lat, lng, years = 5) {
  try {
    const today = new Date();
    const end = new Date(today.getTime() - 7 * 86400000); // the archive lags a few days
    const start = new Date(today);
    start.setFullYear(today.getFullYear() - years);
    start.setDate(start.getDate() - 10);
    const day = (d) => d.toISOString().split("T")[0];
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
      `&daily=temperature_2m_max&start_date=${day(start)}&end_date=${day(end)}&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000), next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    const times = data?.daily?.time || [];
    const highs = data?.daily?.temperature_2m_max || [];

    // Days of the year within 10 days of today's date, across the year end too.
    const doy = (d) => Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000);
    const target = doy(today);
    const near = times
      .map((t, i) => [doy(new Date(`${t}T12:00:00Z`)), highs[i]])
      .filter(([d, v]) => v != null && Math.min(Math.abs(d - target), 365 - Math.abs(d - target)) <= 10)
      .map(([, v]) => v)
      .sort((a, b) => a - b);
    if (near.length < 30) return null;
    return {
      mean: Math.round((near.reduce((a, b) => a + b, 0) / near.length) * 10) / 10,
      // 1 day in 10 at this time of year is hotter than this.
      hot: Math.round(near[Math.floor(near.length * 0.9)] * 10) / 10,
      years,
    };
  } catch {
    return null;
  }
}

// ─── Heat stress (0–100): hot for crops, people and animals, and hot for here ───
function computeHeatStress(weatherData, usual) {
  const maxTemps = (weatherData?.daily?.temperature_2m_max || []).filter((t) => t != null);
  if (!maxTemps.length) return { score: 0, detail: null };
  const peak = Math.max(...maxTemps);
  const weekHigh = maxTemps.reduce((a, b) => a + b, 0) / maxTemps.length;

  // Hot anywhere in Uganda: from 26°C, 30°C already counts, full at 33.5°C
  // (maize and bean flowers suffer above ~32°C; outdoor work gets hard).
  const absolute = Math.min(60, Math.max(0, (peak - 26) * 8));

  let local = 0;
  if (usual) {
    // Warmer than usual here: 10 points per °C the week's highs are above
    // normal, plus up to 10 when the hottest day beats the 1-in-10 hot day.
    local = Math.min(30, Math.max(0, (weekHigh - usual.mean) * 10)) + Math.min(10, Math.max(0, (peak - usual.hot) * 5));
  }
  // Without the usual highs, lean on the fixed limits alone.
  const score = usual ? absolute + local : absolute * 1.4;

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    detail: {
      peak: Math.round(peak * 10) / 10,
      weekHigh: Math.round(weekHigh * 10) / 10,
      usualHigh: usual?.mean ?? null,
      hotDay: usual?.hot ?? null,
      aboveUsual: usual ? Math.round((weekHigh - usual.mean) * 10) / 10 : null,
      years: usual?.years ?? null,
    },
  };
}

// ─── Dry stress (0–100): crops and pasture short of water ───
function computeDryStress(weatherData) {
  let score = 0;
  if (weatherData?.daily) {
    // High evapotranspiration = water deficit (ET0 above 4mm/day is high)
    const et = weatherData.daily.et0_fao_evapotranspiration || [];
    const avgET = et.length > 0 ? et.reduce((a, b) => a + (b || 0), 0) / et.length : 0;
    score += Math.min(30, Math.max(0, (avgET - 4) * 10));

    // Little rain in the next 7 days
    const totalPrecip = (weatherData.daily.precipitation_sum || []).reduce((a, b) => a + (b || 0), 0);
    if (totalPrecip < 5) score += 40;
    else if (totalPrecip < 15) score += 20;
  }
  // Dry air
  const humidity = weatherData?.current?.relative_humidity_2m;
  if (humidity != null) {
    if (humidity < 40) score += 30;
    else if (humidity < 55) score += 10;
  }
  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── Build soil moisture assessment ───
function buildSoilData(weatherData) {
  if (!weatherData) return null;

  const currentMoisture = weatherData.current?.soil_moisture_0_to_1cm;
  const soilTemp = weatherData.current?.soil_temperature_0cm;

  let moistureLevel = "Moderate";
  let moistureScore = 50;
  if (currentMoisture != null) {
    if (currentMoisture > 0.4) { moistureLevel = "Saturated"; moistureScore = 90; }
    else if (currentMoisture > 0.3) { moistureLevel = "High"; moistureScore = 75; }
    else if (currentMoisture > 0.2) { moistureLevel = "Adequate"; moistureScore = 55; }
    else if (currentMoisture > 0.1) { moistureLevel = "Low"; moistureScore = 30; }
    else { moistureLevel = "Very Low"; moistureScore = 15; }
  }

  // Hourly soil moisture trend (next 24h)
  let trend = [];
  if (weatherData.hourly?.soil_moisture_0_to_1cm && weatherData.hourly?.time) {
    trend = weatherData.hourly.time.slice(0, 48).map((t, i) => ({
      time: new Date(t).toLocaleTimeString("en-UG", { hour: "2-digit", hour12: true }),
      moisture: Math.round((weatherData.hourly.soil_moisture_0_to_1cm[i] || 0) * 1000) / 10,
      soilTemp: Math.round((weatherData.hourly.soil_temperature_0cm?.[i] || 0) * 10) / 10,
    }));
  }

  return {
    currentMoisture: currentMoisture != null ? Math.round(currentMoisture * 1000) / 10 : null,
    soilTemp: soilTemp != null ? Math.round(soilTemp * 10) / 10 : null,
    level: moistureLevel,
    score: moistureScore,
    trend,
  };
}

// ─── Build 7-day forecast ───
function buildForecast(weatherData) {
  if (!weatherData?.daily?.time) return [];

  const { time, temperature_2m_max, temperature_2m_min, precipitation_sum, weather_code, wind_speed_10m_max, et0_fao_evapotranspiration, uv_index_max } = weatherData.daily;

  return time.map((dateStr, i) => {
    const d = new Date(dateStr + "T12:00:00");
    return {
      date: d.toLocaleDateString("en-UG", { weekday: "short", month: "short", day: "numeric" }),
      condition: mapWeatherCode(weather_code?.[i] || 0),
      tempHigh: Math.round(temperature_2m_max?.[i] || 0),
      tempLow: Math.round(temperature_2m_min?.[i] || 0),
      rainfall: Math.round(precipitation_sum?.[i] || 0),
      wind: Math.round(wind_speed_10m_max?.[i] || 0),
      et0: Math.round((et0_fao_evapotranspiration?.[i] || 0) * 10) / 10,
      uvIndex: Math.round((uv_index_max?.[i] || 0) * 10) / 10,
    };
  });
}

// ─── Build monthly rainfall summary from historical data ───
function buildRainfallProfile(climateHistory) {
  if (!climateHistory) return null;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return monthNames.map((name, i) => {
    const key = String(i + 1).padStart(2, "0");
    const data = climateHistory[key];
    return {
      month: name,
      rainfallMm: data?.totalPrecipMm || 0,
      avgMaxTemp: data?.avgMaxTemp || 0,
      avgMinTemp: data?.avgMinTemp || 0,
    };
  });
}

// ─── AI prompt: early warning first, farming second ───
function buildAreaPrompt(warningsSummary, weatherSummary, soilSummary, rainfallProfile, forecastSummary) {
  return `You are KibiraAI's early warning advisor for last-mile communities in Uganda and East Africa. People look up an area to know what weather danger is coming and what to do. Farming and soil come second.

EARLY WARNING ENGINE (rule-based, from forecasts and observations — treat as the truth; do not add hazards it did not find, and do not drop any):
${warningsSummary}

OTHER REAL DATA (do NOT make up weather data):
${weatherSummary}
${forecastSummary}
${soilSummary}
${rainfallProfile}

Respond with ONLY valid JSON:
{
  "locationName": "Full area name",
  "district": "District/County",
  "country": "Country",
  "lat": 0.0000,
  "lng": 0.0000,
  "elevation": "1,200m",
  "climateZone": "e.g. Tropical Highland, Semi-Arid",
  "annualRainfallMm": 1200,
  "rainySeasons": "The rainfall pattern here, e.g. bimodal (March-May & Sept-Nov)",
  "situation": "3-4 short, plain sentences a villager understands: how the last 30 days were, what it is like now, what the next 7 days bring, each compared with usual. Use the real numbers. Name any warning from the engine.",
  "communityActions": ["4 practical things households should do now, matched to the engine's warnings (or to staying ready when there are none). Short and concrete."],
  "watchFor": ["3 danger signs people in THIS area should watch for and report, e.g. cracks on slopes, rivers rising fast, many mosquitoes, wilting crops, sick animals"],
  "climateAdvice": ["2 farming tips for the coming 7 days based on the real forecast"],
  "cropCalendar": [
    { "months": "Mar-May", "season": "Rainy/Dry", "activity": "Farming activity for THIS area", "crops": "Crops suited to this area and season" }
  ],
  "soilType": "Likely dominant soil type",
  "majorCrops": ["main", "crops", "grown", "here"],
  "waterHarvestingAdvice": "One or two sentences on keeping water for dry spells or handling heavy rain, for this rainfall pattern"
}

RULES:
- Lead with safety. If the engine found warnings, "situation" and "communityActions" must be about them first.
- Never invent hazards, probabilities or numbers. If the engine found none, say no raised danger is expected for the next 7 days, and give actions that keep people ready.
- Plain words; no jargon like "ensemble", "ET0" or "exceedance".
- cropCalendar: exactly 4 entries covering the year, matching THIS area's real rainy and dry seasons.
- lat/lng: accurate coordinates for the location.
- Be geographically honest: Karamoja is semi-arid (~600mm/yr), Kabale is highland (~1200mm), Jinja is lakeside.`;
}

/** The engine's findings as plain lines for the AI. */
function summarizeWarnings(w) {
  if (!w) return "Early warning engine: unavailable for this place";
  const lines = [`Place: ${w.place}${w.covered ? " (covered district)" : ""}`];
  if (w.past30) lines.push(`Last 30 days: ${w.past30.rain}mm of rain${w.past30.usual != null ? `, usually ${w.past30.usual}mm (${w.past30.vsUsual})` : ""}${w.past30.heavyRainDays ? `, ${w.past30.heavyRainDays} heavy-rain days` : ""}`);
  if (w.now) lines.push(`Now: ${w.now.temp}°C, ${w.now.label}, humidity ${w.now.humidity}%`);
  if (w.next7) lines.push(`Next 7 days: about ${w.next7.rain}mm of rain expected${w.next7.usual != null ? `, usually ${w.next7.usual}mm (${w.next7.vsUsual})` : ""}`);
  if (!w.hazards.length) lines.push("Warnings: none raised for the next 7 days");
  for (const h of w.hazards) lines.push(`Warning: ${h.label} (${h.severity}) — ${h.reason}`);
  return lines.join("\n");
}

export async function POST(request) {
  try {
    const { location } = await request.json();

    if (!location || typeof location !== "string" || location.trim().length < 2) {
      return NextResponse.json({ error: "Please provide a valid location name" }, { status: 400 });
    }

    const sanitizedLocation = location.trim().slice(0, 200);

    // Step 1: Geocode via Open-Meteo (free)
    let geoLat = null, geoLng = null, geoName = null, geoElevation = null;
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(sanitizedLocation)}&count=1&language=en`;
      const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(5000) });
      const geoData = await geoRes.json();
      if (geoData?.results?.[0]) {
        geoLat = geoData.results[0].latitude;
        geoLng = geoData.results[0].longitude;
        geoName = geoData.results[0].name;
        geoElevation = geoData.results[0].elevation ?? null;
      }
    } catch {}

    const lat = geoLat || 0.35;
    const lng = geoLng || 32.6;
    const hasGeo = geoLat != null;

    // Step 2: Fetch ALL real data in parallel
    const [weatherData, floodData, climateHistory, usualHighs, placeEws] = await Promise.all([
      hasGeo ? fetchWeatherAndSoil(lat, lng) : Promise.resolve(null),
      hasGeo ? fetchFloodData(lat, lng) : Promise.resolve(null),
      hasGeo ? fetchClimateHistory(lat, lng) : Promise.resolve(null),
      hasGeo ? fetchUsualHighs(lat, lng) : Promise.resolve(null),
      // Early warnings for this place: the same rules as the district outlook
      hasGeo
        ? placeWarnings({ name: geoName || sanitizedLocation, lat, lng, elevation: geoElevation }).catch((err) => {
            console.error("[farmer-analysis] warnings:", err.message);
            return null;
          })
        : Promise.resolve(null),
    ]);

    // Step 3: Compute risk scores from real data
    const floodRisk = computeFloodRisk(weatherData, floodData);
    const heat = computeHeatStress(weatherData, usualHighs);
    const dryStress = computeDryStress(weatherData);
    const warnings = withHeatWarning(placeEws, heat);
    const soilData = buildSoilData(weatherData);
    const forecast = buildForecast(weatherData);
    const rainfallProfile = buildRainfallProfile(climateHistory);

    // Step 4: Build context summaries for AI
    let weatherSummary = "Weather data: unavailable";
    if (weatherData?.daily) {
      const d = weatherData.daily;
      const maxTemp = Math.max(...(d.temperature_2m_max || []));
      const minTemp = Math.min(...(d.temperature_2m_min || []));
      const totalPrecip = (d.precipitation_sum || []).reduce((a, b) => a + (b || 0), 0);
      const maxPrecip = Math.max(...(d.precipitation_sum || []), 0);
      const avgET = d.et0_fao_evapotranspiration 
        ? (d.et0_fao_evapotranspiration.reduce((a, b) => a + (b || 0), 0) / d.et0_fao_evapotranspiration.length).toFixed(1) 
        : "?";
      weatherSummary = `REAL 7-DAY FORECAST: Peak temp ${maxTemp}°C, low ${minTemp}°C, total rainfall ${Math.round(totalPrecip)}mm (max daily ${Math.round(maxPrecip)}mm), avg ET0 ${avgET}mm/day, current humidity ${weatherData.current?.relative_humidity_2m || "?"}%, current temp ${weatherData.current?.temperature_2m || "?"}°C`;
    }

    let soilSummary = "Soil data: unavailable";
    if (soilData) {
      soilSummary = `REAL SOIL: Moisture ${soilData.currentMoisture}% (${soilData.level}), soil temperature ${soilData.soilTemp}°C`;
    }

    let rainfallSummaryText = "Historical rainfall: unavailable";
    if (rainfallProfile) {
      const entries = rainfallProfile.map(r => `${r.month}:${r.rainfallMm}mm`).join(", ");
      const totalAnnual = rainfallProfile.reduce((s, r) => s + r.rainfallMm, 0);
      rainfallSummaryText = `HISTORICAL MONTHLY RAINFALL (past year): ${entries}. Annual total: ~${totalAnnual}mm`;
    }

    let forecastText = "Forecast: unavailable";
    if (forecast.length > 0) {
      forecastText = `7-DAY FORECAST: ` + forecast.map(f => `${f.date}: ${f.condition}, ${f.tempHigh}/${f.tempLow}°C, ${f.rainfall}mm rain`).join(" | ");
    }

    // Step 5: Ask AI for location-specific agricultural guidance
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: buildAreaPrompt(summarizeWarnings(warnings), weatherSummary, soilSummary, rainfallSummaryText, forecastText) },
        { role: "user", content: `Early warnings and conditions for: ${sanitizedLocation}` },
      ],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "AI did not return a response" }, { status: 500 });
    }

    const aiData = JSON.parse(content);

    // Step 6: If AI coordinates differ, re-fetch weather at AI coords
    const finalLat = typeof aiData.lat === "number" ? aiData.lat : lat;
    const finalLng = typeof aiData.lng === "number" ? aiData.lng : lng;
    let finalWeather = weatherData;
    let finalFlood = floodData;

    if (hasGeo && (Math.abs(finalLat - lat) > 0.5 || Math.abs(finalLng - lng) > 0.5)) {
      const [w, f, u] = await Promise.all([
        fetchWeatherAndSoil(finalLat, finalLng),
        fetchFloodData(finalLat, finalLng),
        fetchUsualHighs(finalLat, finalLng),
      ]);
      if (w) {
        finalWeather = w;
        // Recompute with corrected data
        const newFlood = computeFloodRisk(w, f || finalFlood);
        const newHeat = computeHeatStress(w, u);
        return NextResponse.json({
          analysis: buildResponse(aiData, warnings, newFlood, newHeat, computeDryStress(w), buildSoilData(w), buildForecast(w), rainfallProfile, finalLat, finalLng, w, f),
        });
      }
    }

    return NextResponse.json({
      analysis: buildResponse(aiData, warnings, floodRisk, heat, dryStress, soilData, forecast, rainfallProfile, finalLat, finalLng, finalWeather, finalFlood),
    });

  } catch (error) {
    // Farmer analysis error silently handled
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "AI returned invalid data. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to analyze location. Please try again." }, { status: 500 });
  }
}

function buildResponse(aiData, warnings, floodRisk, heat, dryStress, soilData, forecast, rainfallProfile, lat, lng, weatherData, floodData) {
  return {
    locationName: aiData.locationName || aiData.location || "Unknown",
    district: aiData.district || "",
    country: aiData.country || "",
    lat, lng,
    elevation: aiData.elevation || "Unknown",
    climateZone: aiData.climateZone || "Tropical",
    annualRainfallMm: aiData.annualRainfallMm || 0,
    rainySeasons: aiData.rainySeasons || "",

    // Early warnings first: engine findings (past 30 days, now, next 7 days,
    // hazards with what to do) and the AI's plain summary and actions
    warnings,
    situation: aiData.situation || "",
    communityActions: Array.isArray(aiData.communityActions) ? aiData.communityActions : [],
    watchFor: Array.isArray(aiData.watchFor) ? aiData.watchFor : [],

    // Real computed scores
    floodRisk,
    // Heat for crops, people and animals, weighed against the usual highs here
    heatStress: heat.score,
    heat: heat.detail,
    // Short of water: little rain ahead, fast drying, dry air
    dryStress,

    // Real soil data
    soil: soilData,

    // Real 7-day forecast
    forecast,

    // Historical rainfall profile (12 months)
    rainfallProfile,

    // AI-generated location-specific data
    cropCalendar: Array.isArray(aiData.cropCalendar) ? aiData.cropCalendar : [],
    agroforestrySpecies: Array.isArray(aiData.agroforestrySpecies) ? aiData.agroforestrySpecies : [],
    climateAdvice: Array.isArray(aiData.climateAdvice) ? aiData.climateAdvice : [],
    soilType: aiData.soilType || "Unknown",
    majorCrops: Array.isArray(aiData.majorCrops) ? aiData.majorCrops : [],
    waterHarvestingAdvice: aiData.waterHarvestingAdvice || "",

    dataSources: {
      weather: weatherData ? "Open-Meteo (real-time)" : "Unavailable",
      flood: floodData ? "GloFAS via Open-Meteo" : "Unavailable",
      climate: rainfallProfile ? "Open-Meteo Historical Archive" : "Unavailable",
      warnings: warnings?.sources?.length ? warnings.sources.join(" · ") : "Unavailable",
      analysis: "Kibira AI (GPT-4o)",
    },
  };
}
