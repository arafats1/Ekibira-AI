import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Geocode any area name to coordinates ───
async function geocode(name) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data?.results?.[0]) {
      const r = data.results[0];
      return { lat: r.latitude, lng: r.longitude, country: r.country, admin1: r.admin1, name: r.name, elevation: r.elevation };
    }
    return null;
  } catch { return null; }
}

// ─── Fetch 14-day weather forecast from Open-Meteo ───
async function fetchWeather(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,precipitation&timezone=auto&forecast_days=14`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// ─── Fetch historical weather (last 30 days) for trend analysis ───
async function fetchHistoricalWeather(lat, lng) {
  try {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startStr}&end_date=${endStr}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// ─── Fetch flood forecast from GloFAS ───
async function fetchFloodData(lat, lng) {
  try {
    const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lng}&daily=river_discharge,river_discharge_mean,river_discharge_max&forecast_days=7`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.daily?.river_discharge) return null;
    return data;
  } catch { return null; }
}

// ─── Fetch air quality ───
async function fetchAirQuality(lat, lng) {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,dust,uv_index,european_aqi&forecast_days=1&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// ─── Fetch soil moisture ───
async function fetchSoilData(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,soil_temperature_0_to_7cm&forecast_days=1&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// ─── Summarize weather stats ───
function summarizeWeather(weather) {
  if (!weather?.daily) return null;
  const d = weather.daily;
  const totalRain14d = d.precipitation_sum?.reduce((a, b) => a + (b || 0), 0) || 0;
  const maxTemp = Math.max(...(d.temperature_2m_max || [0]));
  const minTemp = Math.min(...(d.temperature_2m_min || [100]));
  const avgTemp = d.temperature_2m_max ? d.temperature_2m_max.reduce((a, b) => a + b, 0) / d.temperature_2m_max.length : 0;
  const maxWind = Math.max(...(d.wind_speed_10m_max || [0]));
  const maxGusts = Math.max(...(d.wind_gusts_10m_max || [0]));
  const rainyDays = d.precipitation_sum?.filter(p => p > 1).length || 0;
  const heavyRainDays = d.precipitation_sum?.filter(p => p > 20).length || 0;
  const maxDailyRain = Math.max(...(d.precipitation_sum || [0]));
  return { totalRain14d: Math.round(totalRain14d), maxTemp, minTemp, avgTemp: Math.round(avgTemp * 10) / 10, maxWind, maxGusts, rainyDays, heavyRainDays, maxDailyRain, forecastDays: d.time?.length || 0 };
}

function summarizeHistorical(hist) {
  if (!hist?.daily) return null;
  const d = hist.daily;
  const totalRain30d = d.precipitation_sum?.reduce((a, b) => a + (b || 0), 0) || 0;
  const avgMaxTemp = d.temperature_2m_max ? Math.round(d.temperature_2m_max.reduce((a, b) => a + b, 0) / d.temperature_2m_max.length * 10) / 10 : 0;
  const avgMinTemp = d.temperature_2m_min ? Math.round(d.temperature_2m_min.reduce((a, b) => a + b, 0) / d.temperature_2m_min.length * 10) / 10 : 0;
  const maxRainDay = Math.max(...(d.precipitation_sum || [0]));
  const dryDays = d.precipitation_sum?.filter(p => (p || 0) < 1).length || 0;
  return { totalRain30d: Math.round(totalRain30d), avgMaxTemp, avgMinTemp, maxRainDay, dryDays, totalDays: d.time?.length || 0 };
}

function summarizeFlood(flood) {
  if (!flood?.daily?.river_discharge) return null;
  const d = flood.daily;
  const maxDischarge = Math.max(...(d.river_discharge || [0]));
  const maxMean = Math.max(...(d.river_discharge_mean || [0]));
  const maxMax = Math.max(...(d.river_discharge_max || [0]));
  const ratio = maxMean > 0 ? Math.round(maxDischarge / maxMean * 100) / 100 : 0;
  return { currentMax: Math.round(maxDischarge), historicMean: Math.round(maxMean), historicMax: Math.round(maxMax), dischargeRatio: ratio, floodAlert: ratio > 1.5 };
}

function summarizeSoil(soil) {
  if (!soil?.hourly?.soil_moisture_0_to_7cm) return null;
  const sm = soil.hourly.soil_moisture_0_to_7cm;
  const avgMoisture = sm.reduce((a, b) => a + (b || 0), 0) / sm.length;
  const soilTemp = soil.hourly.soil_temperature_0_to_7cm;
  const avgSoilTemp = soilTemp ? soilTemp.reduce((a, b) => a + (b || 0), 0) / soilTemp.length : null;
  return { avgMoisture: Math.round(avgMoisture * 1000) / 10, avgSoilTemp: avgSoilTemp ? Math.round(avgSoilTemp * 10) / 10 : null, saturationLevel: avgMoisture > 0.4 ? "saturated" : avgMoisture > 0.25 ? "moist" : avgMoisture > 0.1 ? "normal" : "dry" };
}

function summarizeAQ(aq) {
  if (!aq?.current) return null;
  const c = aq.current;
  return { aqi: c.european_aqi || 0, pm25: c.pm2_5 || 0, pm10: c.pm10 || 0, dust: c.dust || 0, uvIndex: c.uv_index || 0 };
}

// ─── Build AI prompt for insurance intelligence ───
function buildPrompt(area, geo, stats) {
  return `You are an expert insurance risk analyst specializing in climate and catastrophe modeling for African markets. Analyze the REAL climate data below for "${area}" and produce a comprehensive insurance risk intelligence report.

LOCATION:
- Area: ${area}
- Region: ${geo.admin1 || "Unknown"}, Country: ${geo.country || "Unknown"}
- Coordinates: ${geo.lat}, ${geo.lng}
- Elevation: ${geo.elevation || "Unknown"}m

14-DAY WEATHER FORECAST:
${stats.weather ? JSON.stringify(stats.weather, null, 1) : "No data available"}

30-DAY HISTORICAL WEATHER:
${stats.historical ? JSON.stringify(stats.historical, null, 1) : "No data available"}

FLOOD FORECAST (GloFAS 7-day):
${stats.flood ? JSON.stringify(stats.flood, null, 1) : "No data available (likely no major river basin nearby)"}

SOIL CONDITIONS:
${stats.soil ? JSON.stringify(stats.soil, null, 1) : "No data available"}

AIR QUALITY:
${stats.aq ? JSON.stringify(stats.aq, null, 1) : "No data available"}

CURRENT CONDITIONS:
${stats.current ? JSON.stringify(stats.current, null, 1) : "No data available"}

CONTEXT: Climate change is causing US$600B+ insured losses globally. African markets face rising flood/drought frequency, heat stress, and crop failure risks. The insurer needs forward-looking risk assessment, not just historical data.

Respond in this EXACT JSON format:
{
  "riskOverview": {
    "overallRiskScore": <0-100 integer, weighted composite of all hazards>,
    "riskLevel": "<Low|Moderate|High|Critical>",
    "summary": "<2-3 sentence executive summary of climate risk for this area>",
    "hazards": [
      {
        "type": "<Flood|Drought|Heat Stress|Windstorm|Hail|Wildfire|Soil Erosion|Air Quality>",
        "riskScore": <0-100>,
        "level": "<Low|Moderate|High|Critical>",
        "description": "<specific risk description citing actual data>",
        "trend": "<Increasing|Stable|Decreasing>",
        "dataPoints": "<key numbers from the real data that support this assessment>"
      }
    ],
    "climateTrend": "<short description of how climate is trending in this region based on the data>",
    "seasonalPattern": "<current season assessment and near-term outlook>"
  },
  "underwriting": {
    "premiumMultiplier": <number e.g. 1.0 to 3.5>,
    "premiumBasis": "<explanation of what drives the multiplier>",
    "coverageRecommendation": "<what types of coverage make sense here>",
    "exclusionsAdvised": ["<list of recommended policy exclusions>"],
    "maxExposureAdvice": "<recommended max exposure per policy in this area>",
    "cropInsurance": {
      "riskTier": "<Low|Moderate|High|Very High>",
      "recommendedCoverage": "<coverage type and level>",
      "primaryPerils": ["<top 3 crop perils>"],
      "expectedLossRatio": "<percentage range>"
    },
    "propertyInsurance": {
      "riskTier": "<Low|Moderate|High|Very High>",
      "floodZone": "<zone classification>",
      "windRisk": "<assessment>",
      "structuralRequirements": "<any building code requirements for insurability>"
    },
    "parametricOpportunity": {
      "viable": <true|false>,
      "triggerMetric": "<e.g. rainfall >50mm in 24h, river discharge >200% of mean>",
      "suggestedPayout": "<payout structure description>",
      "rationale": "<why parametric works or doesn't for this area>"
    }
  },
  "lossPrediction": {
    "annualExpectedLoss": "<estimated annual loss ratio based on current conditions>",
    "claimProbability12m": "<percentage probability of at least one major claim in 12 months>",
    "peakRiskMonths": ["<months with highest risk>"],
    "catastropheScenarios": [
      {
        "scenario": "<description>",
        "probability": "<annual probability>",
        "estimatedLoss": "<as % of sum insured>",
        "returnPeriod": "<e.g. 1-in-10 year event>"
      }
    ],
    "portfolioImpact": "<how including this area affects a regional portfolio>",
    "mitigationRecommendations": ["<actionable steps to reduce loss potential>"],
    "reinsuranceAdvice": "<recommendation on reinsurance needs for this area>"
  }
}

IMPORTANT:
- Base ALL assessments on the REAL data provided above, not generic assumptions
- If flood data shows elevated discharge ratios, flag flood risk accordingly
- If heavy rainfall is forecast, factor that into near-term risk
- Be specific with numbers — cite actual temperatures, rainfall totals, discharge ratios
- Differentiate between areas with negligible flood basins vs genuine flood risk
- For African tropical/equatorial areas, consider bimodal rainfall patterns
- Score conservatively — not every area is high risk
- Parametric insurance should only be recommended where clear trigger metrics exist`;
}

export async function POST(request) {
  try {
    const { areas } = await request.json();

    if (!areas || !Array.isArray(areas) || areas.length === 0) {
      return NextResponse.json({ error: "Provide an array of area names" }, { status: 400 });
    }

    if (areas.length > 10) {
      return NextResponse.json({ error: "Maximum 10 areas per request" }, { status: 400 });
    }

    const results = {};

    // Process each area
    for (const area of areas) {
      if (typeof area !== "string" || area.trim().length < 2) continue;
      const areaName = area.trim().slice(0, 100);

      // Geocode
      const geo = await geocode(areaName);
      if (!geo) {
        results[areaName] = { error: "Could not locate this area. Try a more specific name (e.g. 'Gulu, Uganda')." };
        continue;
      }

      // Fetch all data in parallel
      const [weather, historical, flood, soil, aq] = await Promise.all([
        fetchWeather(geo.lat, geo.lng),
        fetchHistoricalWeather(geo.lat, geo.lng),
        fetchFloodData(geo.lat, geo.lng),
        fetchSoilData(geo.lat, geo.lng),
        fetchAirQuality(geo.lat, geo.lng),
      ]);

      const stats = {
        weather: summarizeWeather(weather),
        historical: summarizeHistorical(historical),
        flood: summarizeFlood(flood),
        soil: summarizeSoil(soil),
        aq: summarizeAQ(aq),
        current: weather?.current || null,
      };

      // Call GPT-4o for insurance intelligence
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are an expert insurance risk analyst. Respond ONLY with valid JSON, no markdown." },
            { role: "user", content: buildPrompt(areaName, geo, stats) },
          ],
          temperature: 0.3,
          max_tokens: 3000,
        });

        const raw = completion.choices[0]?.message?.content || "";
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const analysis = JSON.parse(cleaned);

        results[areaName] = {
          geo: { lat: geo.lat, lng: geo.lng, country: geo.country, region: geo.admin1, elevation: geo.elevation },
          rawData: stats,
          analysis,
          generatedAt: new Date().toISOString(),
        };
      } catch (aiErr) {
        console.error(`AI analysis failed for ${areaName}:`, aiErr);
        results[areaName] = {
          geo: { lat: geo.lat, lng: geo.lng, country: geo.country, region: geo.admin1, elevation: geo.elevation },
          rawData: stats,
          analysis: null,
          error: "AI analysis failed — raw climate data is still available",
          generatedAt: new Date().toISOString(),
        };
      }
    }

    return NextResponse.json({ results, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Insurance risk API error:", error);
    return NextResponse.json({ error: "Failed to analyze insurance risk" }, { status: 500 });
  }
}
