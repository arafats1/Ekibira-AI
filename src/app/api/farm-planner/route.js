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
      "variety": "Variety if farmer specified, otherwise empty string",
      "daysSincePlanting": 0,
      "growthStage": "e.g., Germination, Vegetative, Flowering, Fruiting, Maturity",
      "daysToNextStage": 0,
      "nextStage": "Next growth stage",
      "estimatedHarvestDate": "DD-MM-YYYY",
      "healthScore": 0,
      "healthReason": "2-3 sentence explanation of WHY this specific score was given, referencing actual weather data and crop conditions",
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
- cropStatus variety: If the farmer did not specify a variety, use empty string "". NEVER write "Unknown" or "N/A".
- healthScore: CRITICAL — this is the MOST IMPORTANT field. You MUST calculate a UNIQUE, justified score (0-100) for EACH crop. The score MUST reflect REAL conditions:
  * 90-100: Perfect conditions — ideal temps, good soil moisture, no weather risks
  * 70-89: Good but with minor concerns — slight temp deviation, some rain risk
  * 50-69: Moderate stress — drought, excessive rain, suboptimal temps for this crop
  * 30-49: Significant stress — extreme weather, disease risk, poor soil conditions
  * 0-29: Critical — crop may fail without intervention
  SCORING FORMULA: Start at 100, then SUBTRACT points for each real problem:
  -5 to -15 for each weather risk (heavy rain during germination, heat stress, etc.)
  -5 to -10 if soil moisture is too high or too low for the growth stage
  -5 to -10 if temperature is outside the crop's ideal range
  -5 for each upcoming severe weather event in the 7-day forecast
  NEVER give 85 to all crops. NEVER give the same score to multiple crops unless you explicitly justify why in healthReason. If you have 3 crops, I expect 3 DIFFERENT scores (e.g., 72, 88, 61).
- healthReason: MANDATORY — explain the score calculation: "Score: 72/100. Started at 100, -10 for heavy rain forecast during germination (21mm on Wed), -8 for soil moisture at 42% (ideal for maize germination is 50-70%), -10 for thunderstorm risk on Friday." This field MUST reference specific weather data numbers.
- GROWTH-STAGE AWARENESS: Tailor ALL advice to the actual growth stage. During germination (days 0-7), focus on soil moisture for seed emergence — do NOT warn about foliar diseases, pest sprays, or fertilizer top-dressing since there are no leaves yet. During vegetative phase, focus on weeding, nitrogen needs, and leaf pests. During flowering/fruiting, focus on phosphorus/potassium, pollination, and fruit pests.
- riskAlerts: Only include REAL risks based on actual forecast data AND the current growth stage. If no rain is coming, do NOT warn about waterlogging. If temps are moderate, do NOT warn about heat stress. If crops are in germination, do NOT warn about foliar fungal diseases (late blight, rust, etc.) since no foliage exists yet.
- Use actual crop growth timelines (e.g., maize: 90-120 days, beans: 60-90 days, cassava: 9-18 months)
- Be specific about quantities: "apply 50kg/acre DAP", not just "fertilize"
- Reference specific forecast days: "Rain expected Wednesday (15mm) — spray before Tuesday evening"
- ALL dates in the response MUST use DD-MM-YYYY format (e.g., "06-04-2026"), never YYYY-MM-DD
- IRRIGATION: When soil moisture is low (<30%) or high temperatures (>30°C) are forecast, recommend specific irrigation — liters per plant or mm per acre, best time (early morning or late evening). If rain is coming within 24-48h, advise skipping irrigation to save water.
- PEST & DISEASE SPRAYING: Only recommend when crops have foliage (past germination). When humidity >80% with warm temps (>25°C), warn about fungal risk (late blight, rust, powdery mildew). Recommend specific sprays (e.g., "spray copper fungicide", "apply neem oil for aphids"). Always recommend spraying BEFORE rain, not after.
- FERTILIZER: Recommend specific fertilizer types and quantities per growth stage (e.g., "Side-dress 50kg/acre Urea at knee-height for maize", "Apply 25kg/acre TSP at flowering for beans"). Warn about fertilizer burn risk in dry/hot conditions — advise watering before applying.`;
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
      return `${i + 1}. ${c.cropName}${c.variety ? ` (${c.variety})` : ""} — planted ${c.plantingDate} (${daysSince} days ago), ${c.area || "?"} ${c.areaUnit || "acres"}${c.seedQuantity ? `, seed: ${c.seedQuantity} ${c.seedUnit || "kg"}` : ""}${c.spacing ? `, spacing: ${c.spacing}` : ""}, status: ${c.status || "growing"}${c.notes ? `, notes: ${c.notes}` : ""}`;
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
    // Farm planner error silently handled
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "AI returned invalid data. Try again." }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to generate farm plan" }, { status: 500 });
  }
}
