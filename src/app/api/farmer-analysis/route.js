import { NextResponse } from "next/server";
import OpenAI from "openai";

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

// ─── Compute heat/drought stress from real data ───
function computeHeatStress(weatherData) {
  let score = 0;

  if (weatherData?.daily) {
    const maxTemps = weatherData.daily.temperature_2m_max || [];
    const peakTemp = maxTemps.length > 0 ? Math.max(...maxTemps) : 25;
    const avgMaxTemp = maxTemps.length > 0 ? maxTemps.reduce((a, b) => a + b, 0) / maxTemps.length : 25;

    // Peak temperature factor: 0-30pts (above 32°C gets risky for crops)
    score += Math.min(30, Math.max(0, (peakTemp - 28) * 6));

    // Sustained heat: if average max > 30°C for the week
    score += Math.min(15, Math.max(0, (avgMaxTemp - 28) * 5));

    // High evapotranspiration = water deficit
    const et = weatherData.daily.et0_fao_evapotranspiration || [];
    const avgET = et.length > 0 ? et.reduce((a, b) => a + (b || 0), 0) / et.length : 0;
    score += Math.min(15, Math.max(0, (avgET - 4) * 5)); // ET0 > 4mm/day is high

    // Low precipitation during forecast = drought stress
    const precips = weatherData.daily.precipitation_sum || [];
    const totalPrecip = precips.reduce((a, b) => a + (b || 0), 0);
    if (totalPrecip < 5) score += 20; // Almost no rain in 7 days
    else if (totalPrecip < 15) score += 10;
  }

  // Low humidity
  if (weatherData?.current) {
    const humidity = weatherData.current.relative_humidity_2m || 50;
    if (humidity < 40) score += 15;
    else if (humidity < 55) score += 5;
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

// ─── AI System Prompt for Farmer Analysis ───
function buildFarmerPrompt(weatherSummary, soilSummary, rainfallProfile, forecastSummary) {
  return `You are an expert agricultural climate advisor for African farmers. Given a location name and REAL climate data, provide location-specific farming guidance.

REAL-TIME DATA (use this — do NOT make up weather data):
${weatherSummary}
${soilSummary}
${rainfallProfile}
${forecastSummary}

Respond with ONLY valid JSON:
{
  "locationName": "Full area name",
  "district": "District/County",
  "country": "Country",
  "lat": 0.0000,
  "lng": 0.0000,
  "elevation": "1,200m",
  "climateZone": "e.g. Tropical Highland, Semi-Arid, Equatorial, etc.",
  "annualRainfallMm": 1200,
  "rainySeasons": "Describe the specific rainfall pattern — bimodal (March-May & Sept-Nov), unimodal, etc. Be SPECIFIC to this location.",
  "cropCalendar": [
    {
      "months": "Jan-Feb",
      "season": "Dry/Rainy/etc",
      "activity": "Specific farming activity for THIS area based on its real climate",
      "crops": "Specific crops suitable for this area and season"
    }
  ],
  "agroforestrySpecies": [
    {
      "name": "Scientific name (Common name)",
      "use": "Primary use (timber, fodder, shade, nitrogen-fixing, etc.)",
      "co2PerHaPerYear": "X tCO₂/ha/yr",
      "suitability": "Why this species works in THIS specific area (altitude, rainfall, soil)"
    }
  ],
  "climateAdvice": [
    "Specific advice based on the REAL current weather data — reference actual temperatures, rainfall amounts",
    "Advice about soil moisture based on real readings",
    "Advice about upcoming weather based on the real 7-day forecast",
    "Long-term climate adaptation advice specific to this area's rainfall pattern"
  ],
  "soilType": "Likely dominant soil type for this area",
  "majorCrops": ["List", "of", "main", "crops", "grown", "here"],
  "waterHarvestingAdvice": "Specific water management advice based on rainfall pattern"
}

RULES:
- The cropCalendar MUST have 5-6 entries covering the full year, specific to THIS location's rainfall pattern
  * Karamoja (semi-arid, unimodal) should look COMPLETELY DIFFERENT from Kabale (highland, bimodal)
  * A dry area should recommend drought-tolerant crops (sorghum, millet, cassava)
  * A wet highland should recommend different crops (Irish potatoes, wheat, pyrethrum)
- agroforestrySpecies: Provide exactly 5 species that genuinely grow well in this specific climate/altitude/rainfall zone
- climateAdvice: Provide exactly 4 pieces of advice. Reference the REAL data above — actual temperatures, rainfall amounts, soil moisture
- lat/lng: Must be accurate coordinates for the location
- Be geographically honest. Karamoja is semi-arid with ~600mm annual rainfall. Kabale is highland with ~1200mm. Jinja is lakeside equatorial. Do not give generic answers.
- cropCalendar must reflect the ACTUAL rainy/dry season pattern from the historical rainfall data provided`;
}

export async function POST(request) {
  try {
    const { location } = await request.json();

    if (!location || typeof location !== "string" || location.trim().length < 2) {
      return NextResponse.json({ error: "Please provide a valid location name" }, { status: 400 });
    }

    const sanitizedLocation = location.trim().slice(0, 200);

    // Step 1: Geocode via Open-Meteo (free)
    let geoLat = null, geoLng = null, geoName = null;
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(sanitizedLocation)}&count=1&language=en`;
      const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(5000) });
      const geoData = await geoRes.json();
      if (geoData?.results?.[0]) {
        geoLat = geoData.results[0].latitude;
        geoLng = geoData.results[0].longitude;
        geoName = geoData.results[0].name;
      }
    } catch {}

    const lat = geoLat || 0.35;
    const lng = geoLng || 32.6;
    const hasGeo = geoLat != null;

    // Step 2: Fetch ALL real data in parallel
    const [weatherData, floodData, climateHistory] = await Promise.all([
      hasGeo ? fetchWeatherAndSoil(lat, lng) : Promise.resolve(null),
      hasGeo ? fetchFloodData(lat, lng) : Promise.resolve(null),
      hasGeo ? fetchClimateHistory(lat, lng) : Promise.resolve(null),
    ]);

    // Step 3: Compute risk scores from real data
    const floodRisk = computeFloodRisk(weatherData, floodData);
    const heatStress = computeHeatStress(weatherData);
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
        { role: "system", content: buildFarmerPrompt(weatherSummary, soilSummary, rainfallSummaryText, forecastText) },
        { role: "user", content: `Analyze farming conditions for: ${sanitizedLocation}` },
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
      const [w, f] = await Promise.all([
        fetchWeatherAndSoil(finalLat, finalLng),
        fetchFloodData(finalLat, finalLng),
      ]);
      if (w) {
        finalWeather = w;
        // Recompute with corrected data
        const newFlood = computeFloodRisk(w, f || finalFlood);
        const newHeat = computeHeatStress(w);
        return NextResponse.json({
          analysis: buildResponse(aiData, newFlood, newHeat, buildSoilData(w), buildForecast(w), rainfallProfile, finalLat, finalLng, w, f),
        });
      }
    }

    return NextResponse.json({
      analysis: buildResponse(aiData, floodRisk, heatStress, soilData, forecast, rainfallProfile, finalLat, finalLng, finalWeather, finalFlood),
    });

  } catch (error) {
    // Farmer analysis error silently handled
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "AI returned invalid data. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to analyze location. Please try again." }, { status: 500 });
  }
}

function buildResponse(aiData, floodRisk, heatStress, soilData, forecast, rainfallProfile, lat, lng, weatherData, floodData) {
  return {
    locationName: aiData.locationName || aiData.location || "Unknown",
    district: aiData.district || "",
    country: aiData.country || "",
    lat, lng,
    elevation: aiData.elevation || "Unknown",
    climateZone: aiData.climateZone || "Tropical",
    annualRainfallMm: aiData.annualRainfallMm || 0,
    rainySeasons: aiData.rainySeasons || "",

    // Real computed scores
    floodRisk,
    heatStress,

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
      analysis: "Kibira AI (GPT-4o)",
    },
  };
}
