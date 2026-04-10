import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── WMO Weather Code → Condition ───
function mapWeatherCode(code) {
  if (code <= 1) return "Sunny";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code >= 45 && code <= 48) return "Overcast";
  if (code >= 51 && code <= 57) return "Light Rain";
  if (code >= 61 && code <= 63) return "Light Rain";
  if (code >= 64 && code <= 67) return "Heavy Rain";
  if (code >= 71 && code <= 77) return "Overcast";
  if (code >= 80 && code <= 81) return "Light Rain";
  if (code === 82) return "Heavy Rain";
  if (code >= 95) return "Thunderstorm";
  return "Partly Cloudy";
}

// ─── Fetch REAL weather from Open-Meteo (FREE, no API key) ───
async function fetchWeatherForecast(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max,uv_index_max&current=relative_humidity_2m,apparent_temperature,temperature_2m&timezone=auto&forecast_days=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Fetch flood data from Open-Meteo GloFAS (FREE) ───
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

// ─── Fetch Air Quality from Open-Meteo (FREE, no API key) ───
async function fetchAirQuality(lat, lng) {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index,european_aqi&hourly=pm2_5,pm10,nitrogen_dioxide,ozone,european_aqi&forecast_days=3&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── AQI level classification ───
function classifyAQI(aqi) {
  if (aqi <= 20) return { level: "Good", color: "green", desc: "Air quality is satisfactory" };
  if (aqi <= 40) return { level: "Fair", color: "yellow", desc: "Acceptable for most people" };
  if (aqi <= 60) return { level: "Moderate", color: "orange", desc: "Sensitive groups may experience effects" };
  if (aqi <= 80) return { level: "Poor", color: "red", desc: "Health effects possible for everyone" };
  if (aqi <= 100) return { level: "Very Poor", color: "purple", desc: "Serious health effects likely" };
  return { level: "Hazardous", color: "maroon", desc: "Emergency conditions" };
}

// ─── Build air quality summary from real data ───
function buildAirQuality(aqData) {
  if (!aqData?.current) return null;

  const c = aqData.current;
  const aqi = c.european_aqi || 0;
  const classification = classifyAQI(aqi);

  // Build 24h trend from hourly data
  let trend = null;
  if (aqData.hourly?.european_aqi) {
    const hourlyAqi = aqData.hourly.european_aqi.slice(0, 72).filter((v) => v != null);
    if (hourlyAqi.length > 24) {
      const first24 = hourlyAqi.slice(0, 24);
      const next24 = hourlyAqi.slice(24, 48);
      const avg1 = first24.reduce((a, b) => a + b, 0) / first24.length;
      const avg2 = next24.reduce((a, b) => a + b, 0) / next24.length;
      trend = avg2 > avg1 + 5 ? "worsening" : avg2 < avg1 - 5 ? "improving" : "stable";
    }
  }

  // Build pollutant breakdown
  const pollutants = [
    { name: "PM2.5", value: Math.round(c.pm2_5 || 0), unit: "µg/m³", safe: 15, desc: "Fine particulate matter (combustion, dust)" },
    { name: "PM10", value: Math.round(c.pm10 || 0), unit: "µg/m³", safe: 45, desc: "Coarse particles (dust, construction)" },
    { name: "NO₂", value: Math.round(c.nitrogen_dioxide || 0), unit: "µg/m³", safe: 25, desc: "Vehicle exhaust, industrial emissions" },
    { name: "O₃", value: Math.round(c.ozone || 0), unit: "µg/m³", safe: 60, desc: "Ground-level ozone (heat + traffic)" },
    { name: "SO₂", value: Math.round(c.sulphur_dioxide || 0), unit: "µg/m³", safe: 40, desc: "Industrial processes, fuel burning" },
    { name: "CO", value: Math.round(c.carbon_monoxide || 0), unit: "µg/m³", safe: 4000, desc: "Incomplete combustion, vehicles" },
  ];

  // Build hourly chart data (next 24h)
  let hourlyChart = [];
  if (aqData.hourly?.time && aqData.hourly?.pm2_5) {
    hourlyChart = aqData.hourly.time.slice(0, 24).map((t, i) => ({
      hour: new Date(t).toLocaleTimeString("en-UG", { hour: "2-digit", hour12: true }),
      pm25: Math.round(aqData.hourly.pm2_5[i] || 0),
      no2: Math.round((aqData.hourly.nitrogen_dioxide?.[i]) || 0),
      aqi: Math.round((aqData.hourly.european_aqi?.[i]) || 0),
    }));
  }

  return {
    aqi,
    ...classification,
    trend,
    pollutants,
    hourlyChart,
    uvIndex: Math.round((c.uv_index || 0) * 10) / 10,
    dust: Math.round(c.dust || 0),
  };
}

// ─── Compute flood risk from REAL weather + terrain vulnerability ───
function computeFloodRisk(weatherData, floodData, drainageVulnerability) {
  let score = 0;

  if (weatherData?.daily) {
    const precips = weatherData.daily.precipitation_sum || [];
    const maxPrecip = Math.max(...precips, 0);
    const totalPrecip = precips.reduce((a, b) => a + (b || 0), 0);

    // Precipitation intensity: 0–35 pts (60mm+ daily = max)
    score += Math.min(35, (maxPrecip / 60) * 35);
    // Cumulative 5-day rainfall: 0–15 pts (150mm+ = max)
    score += Math.min(15, (totalPrecip / 150) * 15);
  }

  // Drainage vulnerability: 0–25 pts
  score += drainageVulnerability * 25;

  // River discharge anomaly: 0–15 pts
  if (floodData?.daily) {
    const discharges = (floodData.daily.river_discharge || []).filter((d) => d != null);
    const means = (floodData.daily.river_discharge_mean || []).filter((m) => m != null);
    const maxDischarge = discharges.length > 0 ? Math.max(...discharges) : 0;
    const avgMean = means.length > 0 ? means.reduce((a, b) => a + b, 0) / means.length : 0;

    if (avgMean > 0 && maxDischarge > 0) {
      const anomaly = maxDischarge / avgMean;
      score += Math.min(15, Math.max(0, (anomaly - 1) * 15));
    }
  }

  // Base terrain risk: 0–10 pts
  score += drainageVulnerability * 10;

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── Compute heat risk from REAL temperature + urban characteristics ───
function computeHeatRisk(weatherData, urbanHeatIslandDelta, treeCanopy, imperviousSurface) {
  let score = 0;

  if (weatherData?.daily) {
    const maxTemps = weatherData.daily.temperature_2m_max || [];
    const peakTemp = maxTemps.length > 0 ? Math.max(...maxTemps) : 25;
    const effectiveTemp = peakTemp + urbanHeatIslandDelta;

    // Temperature factor: 0–35 pts (starts above 28°C)
    score += Math.min(35, Math.max(0, (effectiveTemp - 28) * 5));
  }

  // Humidity factor: 0–15 pts
  if (weatherData?.current) {
    const humidity = weatherData.current.relative_humidity_2m || 50;
    score += Math.min(15, Math.max(0, ((humidity - 50) / 50) * 15));
  }

  // Canopy deficit: 0–20 pts (less trees = more heat)
  score += (1 - treeCanopy) * 20;

  // Impervious surface: 0–15 pts
  score += imperviousSurface * 15;

  // UHI base: 0–15 pts
  score += Math.min(15, urbanHeatIslandDelta * 2.5);

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── Compute projected impact from REAL data ───
function computeProjectedImpact(params) {
  const { treeRecs, heatRisk, floodRisk, population, urbanHeatIslandDelta, treeCanopyCoverage, imperviousSurface, airQuality } = params;
  
  const totalTrees = treeRecs.reduce((s, t) => s + (typeof t.count === "number" ? t.count : 50), 0);
  
  // Temperature reduction: based on actual UHI delta and planned canopy increase
  // Each 100 trees provides ~0.3°C cooling for a neighborhood
  const treeCooling = Math.min(urbanHeatIslandDelta * 0.6, (totalTrees / 100) * 0.3);
  // Cool roofs reduce by ~1-2°C if impervious surface is high
  const roofCooling = imperviousSurface > 0.6 ? 1.2 : 0.5;
  const tempReduction = Math.round((treeCooling + roofCooling) * 10) / 10;

  // Flood damage reduction: based on current risk and drainage improvement potential
  const floodReduction = floodRisk > 70
    ? Math.round(Math.min(45, floodRisk * 0.35))   // high-risk areas: up to 45%
    : floodRisk > 40
    ? Math.round(Math.min(30, floodRisk * 0.4))    // moderate: up to 30%
    : Math.round(Math.min(15, floodRisk * 0.3));   // low: modest gains

  // Carbon sequestration: ~22kg CO₂/tree/year for tropical species
  const carbonTonnes = Math.round(totalTrees * 0.022 * 10) / 10;

  // Green space increase: trees planted vs area
  const canopyIncrease = Math.round(Math.min(25, (totalTrees / 2000) * 100 + treeCanopyCoverage * 10));
  const newCanopy = Math.round((treeCanopyCoverage * 100) + canopyIncrease);

  // Air quality improvement estimate: trees + reduced emissions
  let pm25Reduction = 0;
  if (airQuality) {
    // Trees can reduce PM2.5 by 7–15% in urban areas
    pm25Reduction = Math.round(Math.min(20, (totalTrees / 500) * 10 + (treeCanopyCoverage < 0.1 ? 8 : 3)));
  }

  const popNum = parseInt(String(population).replace(/[^0-9]/g, "")) || 10000;

  return {
    tempReduction,
    floodReduction,
    carbonTonnes,
    canopyIncrease: `${Math.round(treeCanopyCoverage * 100)}% → ${Math.min(newCanopy, 40)}%`,
    pm25Reduction,
    peopleProtected: population,
    totalTrees,
    // Raw values for frontend calculations
    currentCanopy: Math.round(treeCanopyCoverage * 100),
    targetCanopy: Math.min(newCanopy, 40),
    uhiDelta: urbanHeatIslandDelta,
    popNum,
  };
}

// ─── Build 5-day forecast from real Open-Meteo data ───
function buildForecast(weatherData, currentHumidity) {
  if (!weatherData?.daily?.time) return null;

  const { time, temperature_2m_max, temperature_2m_min, precipitation_sum, weather_code, uv_index_max } = weatherData.daily;

  return time.map((dateStr, i) => {
    const d = new Date(dateStr + "T12:00:00");
    const precip = Math.round(precipitation_sum?.[i] || 0);
    const code = weather_code?.[i] || 0;
    const condition = mapWeatherCode(code);

    let humidity;
    if (precip > 20) humidity = 80 + Math.min(15, Math.round(precip / 5));
    else if (precip > 5) humidity = 70 + Math.round(precip / 2);
    else if (code >= 3 && code < 50) humidity = 60 + Math.round(Math.random() * 10);
    else humidity = Math.max(35, Math.min(80, (currentHumidity || 55) + (Math.random() * 10 - 5)));

    return {
      date: d.toLocaleDateString("en-UG", { weekday: "short", month: "short", day: "numeric" }),
      condition,
      tempHigh: Math.round(temperature_2m_max?.[i] || 28),
      tempLow: Math.round(temperature_2m_min?.[i] || 18),
      rainfall: precip,
      humidity: Math.round(humidity),
      uvIndex: Math.round((uv_index_max?.[i] || 0) * 10) / 10,
      floodTrigger: precip > 30 || (condition === "Thunderstorm" && precip > 20),
    };
  });
}

// ─── AI System Prompt ───
function buildSystemPrompt(weatherSummary, aqSummary) {
  return `You are an expert urban climate risk analyst. When given a location, provide qualitative urban climate analysis and vulnerability parameters.

REAL-TIME CONTEXT (use this to make interventions specific):
${weatherSummary}
${aqSummary}

Respond with ONLY valid JSON:
{
  "name": "Area Name",
  "city": "City Name",
  "country": "Country",
  "division": "District or Division",
  "lat": 0.0000,
  "lng": 0.0000,
  "population": "~XX,000",
  "elevation": "1,140m (terrain description)",
  "drainage": "Quality description with specific local context",
  "drainageVulnerability": 0.7,
  "floodHistory": "Known historical flood events or patterns",
  "heatDrivers": "Specific heat island drivers",
  "urbanHeatIslandDelta": 4.5,
  "treeCanopyCoverage": 0.05,
  "imperviousSurface": 0.80,
  "pollutionDrivers": "Specific pollution sources — vehicle types, industry, charcoal, waste burning, dust roads, etc.",
  "interventions": [
    "Specific intervention referencing the REAL weather/air data above, with species names, quantities, locations",
    "Intervention addressing the SPECIFIC pollution sources identified",
    "Intervention 3",
    "Intervention 4",
    "Intervention 5",
    "Intervention 6"
  ],
  "treeRecommendations": [
    { "name": "Scientific name (Common name)", "count": 200, "purpose": "Purpose referencing actual conditions" },
    { "name": "Species 2", "count": 100, "purpose": "Purpose" },
    { "name": "Species 3", "count": 50, "purpose": "Purpose" }
  ]
}

PARAMETER CALIBRATION (be accurate and honest):
- lat/lng: REAL, ACCURATE coordinates. Do NOT guess.
- drainageVulnerability: 0.0 (excellent) to 1.0 (no drainage).
  * Highland city (Kabale, Kigali): 0.1–0.25 | Valley with drainage: 0.45–0.65 | Wetland slum: 0.7–0.9
- urbanHeatIslandDelta: °C above rural. Rural town: 0.5–1.5 | Medium urban: 3.0–5.0 | Dense slum: 5.0–8.0
- treeCanopyCoverage: 0.0–1.0. Slum: 0.01–0.05 | Moderate: 0.08–0.15 | Suburb: 0.20–0.40
- imperviousSurface: 0.0–1.0. Urban core: 0.80–0.95 | Moderate: 0.55–0.75 | Rural: 0.10–0.30

INTERVENTION RULES:
- Reference the REAL weather and air quality data provided above in your interventions
- If current PM2.5 is high, include specific pollution-reduction interventions (e.g., "ban charcoal burning within 500m of schools")
- If actual rainfall is low, don't recommend flood-focused interventions — focus on heat/drought instead
- If UV is high, recommend shade infrastructure specific to the location
- Include exactly 6 interventions and 3 tree recommendations
- Interventions must mention specific species, quantities, and locations within the area
- NOT every location has high risk. Be geographically honest.`;
}

export async function POST(request) {
  try {
    const { location } = await request.json();

    if (!location || typeof location !== "string" || location.trim().length < 2) {
      return NextResponse.json({ error: "Please provide a valid location name" }, { status: 400 });
    }

    const sanitizedLocation = location.trim().slice(0, 200);

    // Step 1: Quick geocode via Open-Meteo geocoding (free)
    let geoLat = null, geoLng = null;
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(sanitizedLocation)}&count=1&language=en`;
      const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(5000) });
      const geoData = await geoRes.json();
      if (geoData?.results?.[0]) {
        geoLat = geoData.results[0].latitude;
        geoLng = geoData.results[0].longitude;
      }
    } catch {}

    // Step 2: Fetch real data in parallel (if we have coordinates, use them; AI will finalize)
    const fetchLat = geoLat || 0.3;
    const fetchLng = geoLng || 32.6;
    const hasGeo = geoLat != null;

    const [weatherData, floodData, aqData] = await Promise.all([
      hasGeo ? fetchWeatherForecast(fetchLat, fetchLng) : Promise.resolve(null),
      hasGeo ? fetchFloodData(fetchLat, fetchLng) : Promise.resolve(null),
      hasGeo ? fetchAirQuality(fetchLat, fetchLng) : Promise.resolve(null),
    ]);

    // Step 3: Build real-time context for AI
    let weatherSummary = "Weather data: unavailable (will be fetched after coordinates are confirmed)";
    if (weatherData?.daily) {
      const d = weatherData.daily;
      const maxTemp = Math.max(...(d.temperature_2m_max || []));
      const totalPrecip = (d.precipitation_sum || []).reduce((a, b) => a + (b || 0), 0);
      const maxPrecip = Math.max(...(d.precipitation_sum || []), 0);
      const maxUV = Math.max(...(d.uv_index_max || []), 0);
      weatherSummary = `REAL WEATHER (5-day): Peak temp ${maxTemp}°C, total rainfall ${Math.round(totalPrecip)}mm (max daily ${Math.round(maxPrecip)}mm), max UV index ${maxUV}, current humidity ${weatherData.current?.relative_humidity_2m || "?"}%, current temp ${weatherData.current?.temperature_2m || "?"}°C`;
    }

    let aqSummary = "Air quality data: unavailable";
    if (aqData?.current) {
      const c = aqData.current;
      aqSummary = `REAL AIR QUALITY: AQI ${c.european_aqi || "?"} (European), PM2.5 ${c.pm2_5 || 0}µg/m³, PM10 ${c.pm10 || 0}µg/m³, NO₂ ${c.nitrogen_dioxide || 0}µg/m³, O₃ ${c.ozone || 0}µg/m³, SO₂ ${c.sulphur_dioxide || 0}µg/m³, CO ${c.carbon_monoxide || 0}µg/m³, dust ${c.dust || 0}µg/m³`;
    }

    // Step 4: AI with real-time context
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: buildSystemPrompt(weatherSummary, aqSummary) },
        { role: "user", content: `Analyze: ${sanitizedLocation}` },
      ],
      max_tokens: 1800,
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "AI did not return a response" }, { status: 500 });
    }

    const aiData = JSON.parse(content);

    if (!aiData.name || typeof aiData.lat !== "number" || typeof aiData.lng !== "number") {
      return NextResponse.json({ error: "AI returned incomplete data. Please try again." }, { status: 500 });
    }

    // If AI coordinates differ significantly from geocode, refetch weather at AI coords
    const lat = aiData.lat;
    const lng = aiData.lng;
    let finalWeather = weatherData;
    let finalFlood = floodData;
    let finalAQ = aqData;

    if (!hasGeo || (Math.abs(lat - fetchLat) > 0.5 || Math.abs(lng - fetchLng) > 0.5)) {
      const [w, f, a] = await Promise.all([
        fetchWeatherForecast(lat, lng),
        fetchFloodData(lat, lng),
        fetchAirQuality(lat, lng),
      ]);
      finalWeather = w || finalWeather;
      finalFlood = f || finalFlood;
      finalAQ = a || finalAQ;
    }

    // Clamp vulnerability parameters
    const drainageVulnerability = Math.max(0, Math.min(1, aiData.drainageVulnerability ?? 0.5));
    const urbanHeatIslandDelta = Math.max(0, Math.min(10, aiData.urbanHeatIslandDelta ?? 3));
    const treeCanopyCoverage = Math.max(0, Math.min(1, aiData.treeCanopyCoverage ?? 0.1));
    const imperviousSurface = Math.max(0, Math.min(1, aiData.imperviousSurface ?? 0.6));

    // Compute risk scores from real data
    const floodRisk = computeFloodRisk(finalWeather, finalFlood, drainageVulnerability);
    const heatRisk = computeHeatRisk(finalWeather, urbanHeatIslandDelta, treeCanopyCoverage, imperviousSurface);

    // Build forecast from real weather
    const currentHumidity = finalWeather?.current?.relative_humidity_2m;
    const forecast = buildForecast(finalWeather, currentHumidity) || [];

    // Build air quality analysis
    const airQuality = buildAirQuality(finalAQ);

    // Ensure tree counts are numbers
    const treeRecs = (Array.isArray(aiData.treeRecommendations) ? aiData.treeRecommendations : []).map((t) => ({
      ...t,
      count: typeof t.count === "number" ? t.count : parseInt(String(t.count).replace(/[^0-9]/g, "")) || 50,
    }));

    // Compute projected impact from real data
    const projectedImpact = computeProjectedImpact({
      treeRecs,
      heatRisk,
      floodRisk,
      population: aiData.population || "~10,000",
      urbanHeatIslandDelta,
      treeCanopyCoverage,
      imperviousSurface,
      airQuality,
    });

    const analysis = {
      name: aiData.name,
      city: aiData.city || "",
      country: aiData.country || "",
      division: aiData.division || "",
      lat, lng,
      population: aiData.population || "Unknown",
      floodRisk,
      heatRisk,
      elevation: aiData.elevation || "Unknown",
      drainage: aiData.drainage || "Unknown",
      floodHistory: aiData.floodHistory || "No data available",
      heatDrivers: aiData.heatDrivers || "No data available",
      pollutionDrivers: aiData.pollutionDrivers || "No data available",
      urbanHeatIslandDelta,
      treeCanopyCoverage,
      imperviousSurface,
      interventions: Array.isArray(aiData.interventions) ? aiData.interventions : [],
      treeRecommendations: treeRecs,
      forecast,
      airQuality,
      projectedImpact,
      dataSources: {
        weather: finalWeather ? "Open-Meteo (real-time)" : "Unavailable",
        flood: finalFlood ? "GloFAS via Open-Meteo" : "Terrain analysis only",
        airQuality: finalAQ ? "Open-Meteo Air Quality" : "Unavailable",
        analysis: "Kibira AI",
      },
    };

    return NextResponse.json({ analysis });
  } catch (error) {
    // Urban analysis error silently handled
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "AI returned invalid data. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to analyze location. Please try again." }, { status: 500 });
  }
}
