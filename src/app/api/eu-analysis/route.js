import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Geocode by name
async function geocode(location) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data?.results?.[0]) {
      const r = data.results[0];
      return { lat: r.latitude, lng: r.longitude, name: r.name, country: r.country, admin1: r.admin1 || "" };
    }
    return null;
  } catch { return null; }
}

// Reverse geocode coordinates to place name via Nominatim (OpenStreetMap)
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&addressdetails=1`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "KibiraAI/1.0" },
    });
    const data = await res.json();
    if (data?.address) {
      const a = data.address;
      const name = a.city || a.town || a.village || a.hamlet || a.suburb || a.county || data.name || "";
      const country = a.country || "";
      const admin1 = a.state || a.region || a.county || "";
      return { name, country, admin1 };
    }
    return null;
  } catch { return null; }
}

// Historical weather (past 90 days for seasonal data)
async function fetchHistoricalWeather(lat, lng) {
  try {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 90);
    const fmt = (d) => d.toISOString().slice(0, 10);
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
      `&start_date=${fmt(start)}&end_date=${fmt(end)}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration` +
      `&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// Soil moisture & vegetation proxy
async function fetchSoilData(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&hourly=soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm` +
      `&daily=et0_fao_evapotranspiration,precipitation_sum,temperature_2m_max` +
      `&forecast_days=7&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// Air quality (vegetation-relevant)
async function fetchAirQuality(lat, lng) {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}` +
      `&current=pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,alder_pollen,grass_pollen` +
      `&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

function summarizeHistorical(data) {
  if (!data?.daily) return "No historical data available";
  const d = data.daily;
  const totalRain = d.precipitation_sum?.reduce((a, b) => a + (b || 0), 0) || 0;
  const avgTemp = d.temperature_2m_max?.length
    ? (d.temperature_2m_max.reduce((a, b) => a + (b || 0), 0) / d.temperature_2m_max.length).toFixed(1)
    : "N/A";
  const avgET = d.et0_fao_evapotranspiration?.length
    ? (d.et0_fao_evapotranspiration.reduce((a, b) => a + (b || 0), 0) / d.et0_fao_evapotranspiration.length).toFixed(1)
    : "N/A";
  const rainyDays = d.precipitation_sum?.filter((v) => v > 1).length || 0;
  return `Past 90 days: Total rainfall ${totalRain.toFixed(0)}mm, ${rainyDays} rainy days, Avg max temp ${avgTemp}°C, Avg ET₀ ${avgET}mm/day`;
}

function summarizeSoil(data) {
  if (!data?.hourly) return "No soil data available";
  const sm = data.hourly.soil_moisture_0_to_1cm?.filter(Boolean) || [];
  const avg = sm.length ? (sm.reduce((a, b) => a + b, 0) / sm.length).toFixed(3) : "N/A";
  return `Current soil moisture (0-1cm avg): ${avg} m³/m³`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { area, lat: inputLat, lng: inputLng } = body;

    if (!area && (inputLat == null || inputLng == null)) {
      return Response.json({ error: "Provide an area name or coordinates (lat, lng)" }, { status: 400 });
    }

    // Resolve location
    let lat, lng, locationName, country, admin1;
    if (inputLat != null && inputLng != null) {
      lat = parseFloat(inputLat);
      lng = parseFloat(inputLng);
      locationName = `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
      country = "";
      admin1 = "";
      // Reverse geocode to get the actual place name at these coordinates
      const geo = await reverseGeocode(lat, lng);
      if (geo) { locationName = geo.name; country = geo.country; admin1 = geo.admin1; }
    } else {
      const geo = await geocode(area);
      if (!geo) {
        return Response.json({ error: `Could not find location: "${area}". Try a different name or use coordinates.` }, { status: 404 });
      }
      lat = geo.lat;
      lng = geo.lng;
      locationName = geo.name;
      country = geo.country;
      admin1 = geo.admin1;
    }

    // Fetch environmental data in parallel
    const [historical, soil, airQuality] = await Promise.all([
      fetchHistoricalWeather(lat, lng),
      fetchSoilData(lat, lng),
      fetchAirQuality(lat, lng),
    ]);

    const historicalSummary = summarizeHistorical(historical);
    const soilSummary = summarizeSoil(soil);
    const aqSummary = airQuality?.current
      ? `PM2.5: ${airQuality.current.pm2_5 || "N/A"}, PM10: ${airQuality.current.pm10 || "N/A"}, CO: ${airQuality.current.carbon_monoxide || "N/A"}`
      : "No air quality data";

    // Evapotranspiration trend (proxy for vegetation health)
    const etValues = soil?.daily?.et0_fao_evapotranspiration?.filter(Boolean) || [];
    const avgET = etValues.length ? (etValues.reduce((a, b) => a + b, 0) / etValues.length).toFixed(1) : "N/A";

    const prompt = `You are an EUDR (EU Deforestation Regulation 2023/1115) compliance analysis expert for the KibiraAI platform.

LOCATION: ${locationName}, ${admin1}, ${country}
COORDINATES: ${lat}°N, ${lng}°E

ENVIRONMENTAL DATA:
- ${historicalSummary}
- ${soilSummary}
- Air Quality: ${aqSummary}
- Average Evapotranspiration (7-day): ${avgET} mm/day
- Soil moisture forecast data available: ${soil?.hourly ? "Yes" : "No"}

Based on this real environmental data and your knowledge of deforestation patterns in this region, provide a comprehensive EUDR compliance analysis.

RESPOND IN STRICT JSON (no markdown, no code fences):
{
  "areaInfo": {
    "name": "string",
    "country": "string",
    "region": "string",
    "estimatedArea": "string (e.g. '~25,000 ha')",
    "ecosystem": "string (e.g. 'Tropical moist forest', 'Savanna woodland')",
    "elevation": "string"
  },
  "complianceAssessment": {
    "overallRisk": "low|standard|high",
    "riskScore": number (0-100),
    "complianceStatus": "Likely Compliant|Needs Verification|Non-Compliant|At Risk",
    "post2020Deforestation": "string (assessment of deforestation since Dec 31 2020)",
    "keyFindings": ["string", "string", "string"],
    "dataConfidence": "Low|Medium|High"
  },
  "vegetationHealth": {
    "canopyCoverEstimate": "string (e.g. '65-75%')",
    "vegetationTrend": "Stable|Declining|Improving|Severely Degraded",
    "soilMoistureStatus": "Healthy|Stressed|Saturated",
    "evapotranspirationNote": "string"
  },
  "commodityAnalysis": [
    {
      "commodity": "string",
      "riskLevel": "Low|Moderate|High|Critical",
      "producedInArea": true/false,
      "eudrImplication": "string",
      "verificationNeeded": "string"
    }
  ],
  "threats": [
    {
      "type": "string (e.g. 'Agricultural Expansion')",
      "severity": "Low|Medium|High|Critical",
      "description": "string"
    }
  ],
  "requiredDocumentation": ["string", "string", "string"],
  "recommendations": ["string", "string", "string"],
  "dueDiligenceSteps": ["string", "string", "string"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2500,
    });

    const raw = completion.choices[0]?.message?.content || "";
    let analysis;
    try {
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch {
      return Response.json({ error: "AI response parsing failed. Please try again." }, { status: 500 });
    }

    return Response.json({
      location: { name: locationName, country, admin1, lat, lng },
      analysis,
      dataSources: {
        weather: !!historical,
        soil: !!soil,
        airQuality: !!airQuality,
      },
    });
  } catch (err) {
    // EU analysis error silently handled
    return Response.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
