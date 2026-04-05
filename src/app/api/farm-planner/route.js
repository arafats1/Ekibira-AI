import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── WMO Code → Condition ───
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

// ─── Fetch weather + soil from Open-Meteo ───
async function fetchWeather(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,relative_humidity_2m_max,et0_fao_evapotranspiration` +
      `&current=temperature_2m,relative_humidity_2m,soil_moisture_0_to_1cm,soil_temperature_0cm` +
      `&timezone=auto&forecast_days=7`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// ─── Geocode location ───
async function geocode(location) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data?.results?.[0]) {
      return { lat: data.results[0].latitude, lng: data.results[0].longitude, name: data.results[0].name };
    }
    return null;
  } catch { return null; }
}

// ─── Build forecast summary for AI ───
function buildForecastSummary(weather) {
  if (!weather?.daily?.time) return "Weather forecast: unavailable";
  const d = weather.daily;
  const lines = d.time.map((date, i) => {
    const cond = mapWeatherCode(d.weather_code?.[i] || 0);
    return `${date}: ${cond}, ${Math.round(d.temperature_2m_max?.[i] || 0)}/${Math.round(d.temperature_2m_min?.[i] || 0)}°C, ${Math.round(d.precipitation_sum?.[i] || 0)}mm rain, ET0 ${(d.et0_fao_evapotranspiration?.[i] || 0).toFixed(1)}mm`;
  });
  const currentTemp = weather.current?.temperature_2m || "?";
  const humidity = weather.current?.relative_humidity_2m || "?";
  const soilMoisture = weather.current?.soil_moisture_0_to_1cm;
  const soilTemp = weather.current?.soil_temperature_0cm;
  return `CURRENT: ${currentTemp}°C, ${humidity}% humidity` +
    (soilMoisture != null ? `, soil moisture ${(soilMoisture * 100).toFixed(1)}%` : "") +
    (soilTemp != null ? `, soil temp ${soilTemp.toFixed(1)}°C` : "") +
    `\n7-DAY FORECAST:\n${lines.join("\n")}`;
}

// ─── AI System Prompt ───
function buildSystemPrompt(weatherContext, cropDetails) {
  return `You are an expert agricultural advisor for African smallholder farmers. Given a farmer's current crops and REAL weather data, provide personalized daily action items, growth stage analysis, and risk alerts.

REAL WEATHER DATA (use this — do NOT make up data):
${weatherContext}

FARMER'S CROPS:
${cropDetails}

Today's date: ${new Date().toISOString().split("T")[0]}

Respond with ONLY valid JSON:
{
  "dailyActions": [
    {
      "priority": "urgent|important|routine",
      "crop": "Crop name this action is for",
      "action": "Specific action to take TODAY based on real weather",
      "reason": "Why — reference actual weather data (e.g., '15mm rain expected tomorrow')"
    }
  ],
  "cropStatus": [
    {
      "cropName": "Crop name",
      "variety": "Variety if known",
      "daysSincePlanting": 0,
      "growthStage": "e.g., Germination, Vegetative, Flowering, Fruiting, Maturity",
      "daysToNextStage": 0,
      "nextStage": "Next growth stage",
      "estimatedHarvestDate": "YYYY-MM-DD",
      "healthScore": 85,
      "healthNotes": "Assessment based on weather conditions",
      "waterNeed": "high|medium|low",
      "waterAdvice": "Specific irrigation advice based on real soil moisture and ET0 data"
    }
  ],
  "riskAlerts": [
    {
      "severity": "critical|warning|info",
      "crop": "Affected crop(s)",
      "risk": "e.g., Late blight risk, Heat stress, Waterlogging",
      "trigger": "What weather condition triggers this (reference real forecast data)",
      "action": "What to do to prevent/mitigate"
    }
  ],
  "weekOutlook": "2-3 sentence summary of what the coming week looks like for the farmer's crops based on the real 7-day forecast"
}

RULES:
- dailyActions: 3-6 actions, ordered by priority. Must reference real weather conditions.
- cropStatus: One entry per crop. Calculate growth stage from planting date to today.
- riskAlerts: Only include REAL risks based on actual forecast data. If no rain is coming, do NOT warn about waterlogging. If temps are moderate, do NOT warn about heat stress.
- Use actual crop growth timelines (e.g., maize: 90-120 days, beans: 60-90 days, cassava: 9-18 months)
- Be specific about quantities: "apply 50kg/acre DAP", not just "fertilize"
- Reference specific forecast days: "Rain expected Wednesday (15mm) — spray before Tuesday evening"`;
}

export async function POST(request) {
  try {
    const { crops, location } = await request.json();

    if (!crops || !Array.isArray(crops) || crops.length === 0) {
      return NextResponse.json({ error: "No crops provided" }, { status: 400 });
    }

    if (!location || typeof location !== "string") {
      return NextResponse.json({ error: "Location is required" }, { status: 400 });
    }

    // Geocode and fetch weather
    const geo = await geocode(location.trim().slice(0, 200));
    const lat = geo?.lat || 0.35;
    const lng = geo?.lng || 32.6;

    const weather = geo ? await fetchWeather(lat, lng) : null;
    const weatherContext = buildForecastSummary(weather);

    // Build crop details for AI
    const today = new Date();
    const cropDetails = crops.slice(0, 10).map((c, i) => {
      const planted = new Date(c.plantingDate);
      const daysSince = Math.max(0, Math.floor((today - planted) / (1000 * 60 * 60 * 24)));
      return `${i + 1}. ${c.cropName}${c.variety ? ` (${c.variety})` : ""} — planted ${c.plantingDate} (${daysSince} days ago), ${c.area || "?"} ${c.areaUnit || "acres"}, status: ${c.status || "growing"}${c.notes ? `, notes: ${c.notes}` : ""}`;
    }).join("\n");

    // Ask AI for personalized farm plan
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: buildSystemPrompt(weatherContext, cropDetails) },
        { role: "user", content: `Generate today's farm plan for a farmer in ${location.trim()} with the crops listed above.` },
      ],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "AI did not respond" }, { status: 500 });
    }

    const plan = JSON.parse(content);

    // Build 7-day forecast for the frontend
    let forecast = [];
    if (weather?.daily?.time) {
      forecast = weather.daily.time.map((date, i) => ({
        date: new Date(date + "T12:00:00").toLocaleDateString("en-UG", { weekday: "short", month: "short", day: "numeric" }),
        condition: mapWeatherCode(weather.daily.weather_code?.[i] || 0),
        tempHigh: Math.round(weather.daily.temperature_2m_max?.[i] || 0),
        tempLow: Math.round(weather.daily.temperature_2m_min?.[i] || 0),
        rainfall: Math.round(weather.daily.precipitation_sum?.[i] || 0),
        et0: Math.round((weather.daily.et0_fao_evapotranspiration?.[i] || 0) * 10) / 10,
      }));
    }

    return NextResponse.json({
      plan: {
        ...plan,
        forecast,
        location: geo?.name || location.trim(),
        generatedAt: new Date().toISOString(),
        currentWeather: weather?.current ? {
          temp: weather.current.temperature_2m,
          humidity: weather.current.relative_humidity_2m,
          soilMoisture: weather.current.soil_moisture_0_to_1cm,
          soilTemp: weather.current.soil_temperature_0cm,
        } : null,
      },
    });
  } catch (error) {
    console.error("Farm planner error:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "AI returned invalid data. Try again." }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to generate farm plan" }, { status: 500 });
  }
}
