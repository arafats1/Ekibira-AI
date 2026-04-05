import { NextResponse } from "next/server";
import OpenAI from "openai";
import { checkUsageLimit, incrementUsage } from "../lib/usage";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getToken(request) {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

// ─── Weather helpers (Open-Meteo) ───
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

function mapWeatherCode(code) {
  if (code <= 1) return "Sunny";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code >= 45 && code <= 48) return "Foggy";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 63) return "Light Rain";
  if (code >= 64 && code <= 67) return "Heavy Rain";
  if (code >= 80 && code <= 81) return "Showers";
  if (code === 82) return "Heavy Rain";
  if (code >= 95) return "Thunderstorm";
  return "Partly Cloudy";
}

function buildWeatherSummary(weather, locationName) {
  if (!weather?.daily?.time) return null;
  const d = weather.daily;
  const lines = d.time.map((date, i) => {
    const cond = mapWeatherCode(d.weather_code?.[i] || 0);
    const parts = date.split("-");
    const fmtDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    return `${fmtDate}: ${cond}, ${Math.round(d.temperature_2m_max?.[i] || 0)}/${Math.round(d.temperature_2m_min?.[i] || 0)}°C, ${Math.round(d.precipitation_sum?.[i] || 0)}mm rain, ET0 ${(d.et0_fao_evapotranspiration?.[i] || 0).toFixed(1)}mm`;
  });
  const currentTemp = weather.current?.temperature_2m || "?";
  const humidity = weather.current?.relative_humidity_2m || "?";
  const soilMoisture = weather.current?.soil_moisture_0_to_1cm;
  const soilTemp = weather.current?.soil_temperature_0cm;
  return `REAL-TIME WEATHER for ${locationName} (from Open-Meteo API):\nCURRENT: ${currentTemp}°C, ${humidity}% humidity` +
    (soilMoisture != null ? `, soil moisture ${(soilMoisture * 100).toFixed(1)}%` : "") +
    (soilTemp != null ? `, soil temp ${soilTemp.toFixed(1)}°C` : "") +
    `\n7-DAY FORECAST:\n${lines.join("\n")}`;
}

function detectWeatherQuery(message) {
  return /\b(weather|forecast|rain|rainfall|temperature|temp|humid|drought|flood|storm|heat|cold|dry season|rainy season|precipitation|tomorrow|next week|this week)\b/i.test(message);
}

// Detect if the user is asking about market prices
function detectPriceQuery(message) {
  const lower = message.toLowerCase();
  const priceKeywords = [
    "price", "how much", "cost", "market", "sell", "selling",
    "buy", "buying", "worth", "value", "ugx", "shilling",
    "per kg", "per ton", "per bag",
  ];
  return priceKeywords.some((k) => lower.includes(k));
}

// Extract crop name from message using known crops
function extractCropFromMessage(message, farmerCrops) {
  const lower = message.toLowerCase();
  // First check farmer's own crops
  for (const crop of farmerCrops) {
    if (lower.includes(crop.cropName.toLowerCase())) {
      return crop;
    }
  }
  // Check common crops
  const commonCrops = [
    "maize", "beans", "cassava", "sweet potatoes", "rice", "sorghum", "millet",
    "groundnuts", "soybeans", "coffee", "bananas", "irish potatoes", "tomatoes",
    "onions", "cabbage", "sunflower", "sesame", "cotton", "wheat", "peas",
    "matooke", "vanilla", "tea", "cocoa", "sugarcane", "simsim",
  ];
  for (const crop of commonCrops) {
    if (lower.includes(crop)) {
      return { cropName: crop.charAt(0).toUpperCase() + crop.slice(1), location: farmerCrops[0]?.location || "Uganda" };
    }
  }
  return null;
}

// Fetch market prices for a crop
async function fetchMarketPrices(cropName, location, farmerCrop) {
  try {
    const prompt = `You are an expert agricultural market analyst for Uganda and East Africa. Provide current real market prices for this crop.

CROP: ${cropName}
LOCATION: ${location}
TODAY: ${new Date().toISOString().split("T")[0]}

Provide realistic, current market intelligence with prices in Ugandan Shillings. You MUST include at least 3-4 specific markets.

Respond with ONLY valid JSON:
{
  "currentPrice": {
    "low": 0,
    "mid": 0,
    "high": 0,
    "unit": "UGX/kg",
    "trend": "rising|stable|falling",
    "trendReason": "Brief reason"
  },
  "markets": [
    {
      "name": "Market name",
      "location": "Town/city",
      "price": "e.g., 2,500-3,200 UGX/kg",
      "tip": "Best day/time to sell"
    }
  ],
  "sellAdvice": "2-3 sentences: best time to sell, store or sell now, seasonal insight"
}

RULES:
- Prices must be realistic Ugandan Shillings for current season
- Include at least 3-4 real Ugandan markets (local + regional + Kampala where relevant)
- Markets should be ordered by proximity to the farmer's location`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 800,
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const jsonStr = raw.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// Format market price data into a readable message
function formatPriceResponse(data, cropName) {
  if (!data) return null;
  const p = data.currentPrice;
  let text = `📊 **${cropName} Market Prices (${(() => { const d = new Date(); return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`; })()})**\n\n`;
  text += `💰 Current Price: ${p.low?.toLocaleString()} – ${p.high?.toLocaleString()} ${p.unit} (avg ${p.mid?.toLocaleString()})\n`;
  text += `📈 Trend: ${p.trend} — ${p.trendReason}\n\n`;
  text += `🏪 **Markets:**\n`;
  if (data.markets && data.markets.length > 0) {
    data.markets.forEach((m, i) => {
      text += `${i + 1}. **${m.name}** (${m.location}) — ${m.price}\n   💡 ${m.tip}\n`;
    });
  }
  if (data.sellAdvice) {
    text += `\n🧠 **Advice:** ${data.sellAdvice}`;
  }
  return text;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, cropContext, history } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const safeMessage = message.trim().slice(0, 2000);
    const token = getToken(request);

    // Check usage limits
    if (token) {
      try {
        const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          const limit = await checkUsageLimit(me.id, "farmerChatCount", token);
          if (!limit.allowed) {
            return NextResponse.json({
              error: "limit_reached",
              reply: "🔒 You've used all 5 free Farm AI messages for today. Upgrade to the Annual Plan (80,000 UGX/year) for unlimited messages, or come back tomorrow!",
              remaining: 0,
              tier: limit.tier,
            }, { status: 429 });
          }
        }
      } catch {}
    }

    // Fetch farmer's crops if token is available
    let farmerCrops = cropContext || [];
    if (token && !cropContext) {
      try {
        const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          const cropsRes = await fetch(
            `${STRAPI_URL}/api/farm-crops?filters[userId][$eq]=${me.id}&sort=plantingDate:desc&pagination[limit]=50`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (cropsRes.ok) {
            const cropsData = await cropsRes.json();
            farmerCrops = (cropsData.data || []).map((c) => ({
              cropName: c.cropName,
              variety: c.variety,
              area: c.area,
              areaUnit: c.areaUnit,
              plantingDate: c.plantingDate,
              harvestDate: c.harvestDate,
              location: c.location,
              status: c.status,
              seedQuantity: c.seedQuantity,
              seedUnit: c.seedUnit,
              spacing: c.spacing,
              harvestYield: c.harvestYield,
              yieldUnit: c.yieldUnit,
              expectedYieldLow: c.expectedYieldLow,
              expectedYieldHigh: c.expectedYieldHigh,
            }));
          }
        }
      } catch {
        // proceed without crop data
      }
    }

    // Build crop summary — separate growing crops from harvest logs
    const today = new Date();
    const growingCrops = farmerCrops.filter(c => c.status !== "harvested");
    const harvestedCrops = farmerCrops.filter(c => c.status === "harvested");

    let cropSummary = "";
    if (growingCrops.length > 0) {
      cropSummary += "CURRENTLY GROWING:\n";
      cropSummary += growingCrops.map((c, i) => {
        const daysSince = c.plantingDate ? Math.max(0, Math.floor((today - new Date(c.plantingDate)) / (1000 * 60 * 60 * 24))) : "?";
        let line = `${i + 1}. ${c.cropName}${c.variety ? ` (${c.variety})` : ""} — ${c.status || "growing"}, ${daysSince} days since planting`;
        line += `\n   Location: ${c.location || "?"}, Area: ${c.area || "?"} ${c.areaUnit || "acres"}`;
        line += `\n   Planted: ${c.plantingDate || "?"}`;
        if (c.seedQuantity) line += `, Seed: ${c.seedQuantity} ${c.seedUnit || "kg"}`;
        if (c.spacing) line += `, Spacing: ${c.spacing}`;
        if (c.expectedYieldLow > 0) line += `\n   Expected yield: ${c.expectedYieldLow}–${c.expectedYieldHigh} kg`;
        return line;
      }).join("\n");
    }

    if (harvestedCrops.length > 0) {
      cropSummary += "\n\nHARVEST LOG:\n";
      cropSummary += harvestedCrops.map((c, i) => {
        let line = `${i + 1}. ${c.cropName}${c.variety ? ` (${c.variety})` : ""}`;
        line += `\n   Location: ${c.location || "?"}, Area: ${c.area || "?"} ${c.areaUnit || "acres"}`;
        line += `\n   Planted: ${c.plantingDate || "?"}, Harvested: ${c.harvestDate || "?"}`;
        if (c.harvestYield > 0) line += `, Actual yield: ${c.harvestYield} ${c.yieldUnit || "kg"}`;
        if (c.expectedYieldLow > 0) line += `, Expected: ${c.expectedYieldLow}–${c.expectedYieldHigh} kg`;
        if (c.harvestYield > 0 && c.expectedYieldLow > 0) {
          const pct = Math.round((c.harvestYield / ((c.expectedYieldLow + c.expectedYieldHigh) / 2)) * 100);
          line += ` (${pct}% of expected)`;
        }
        return line;
      }).join("\n");
    }

    if (!cropSummary) cropSummary = "No crops recorded yet.";

    // Locations summary for weather context
    const locations = [
      ...new Set(farmerCrops.map((c) => c.location).filter(Boolean)),
    ];

    // Fetch real weather data for the farmer's location
    let weatherContext = "";
    const primaryLocation = locations[0] || null;
    if (primaryLocation) {
      const geo = await geocode(primaryLocation);
      if (geo) {
        const weather = await fetchWeather(geo.lat, geo.lng);
        const summary = buildWeatherSummary(weather, geo.name || primaryLocation);
        if (summary) {
          weatherContext = `\n\n${summary}`;
        }
      }
    }

    // Detect price queries — fetch real market data if asking about prices
    let marketContext = "";
    if (detectPriceQuery(safeMessage)) {
      const cropMatch = extractCropFromMessage(safeMessage, farmerCrops);
      if (cropMatch) {
        const priceData = await fetchMarketPrices(
          cropMatch.cropName,
          cropMatch.location || locations[0] || "Uganda",
          cropMatch
        );
        if (priceData) {
          const formatted = formatPriceResponse(priceData, cropMatch.cropName);
          if (formatted) {
            marketContext = `\n\nMARKET PRICE DATA (just fetched — use this to answer the farmer's price question):\n${formatted}`;
          }
        }
      }
    }

    // Detect weather queries — add extra instruction
    const isWeatherQuery = detectWeatherQuery(safeMessage);

    // Build conversation history
    const todayStr = (() => { const d = new Date(); return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`; })();
    const messages = [
      {
        role: "system",
        content: `You are KibiraAI Farm Assistant — an expert agricultural advisor personalized for this specific farmer in Uganda/East Africa. You have access to all their farm data and REAL weather data below.

TODAY: ${todayStr}

FARMER'S CROPS:
${cropSummary}

FARMER'S LOCATIONS: ${locations.join(", ") || "Unknown"}${weatherContext}${marketContext}

YOUR ROLE:
- Answer questions about their specific crops, yields, timing, and practices
- Use their ACTUAL data (planting dates, harvest dates, actual yields vs expected) to give tailored advice
- **WEATHER**: You have REAL weather data above from Open-Meteo API. When the farmer asks about weather, forecast, rain, temperature, or "what's the weather tomorrow", use the REAL forecast data to answer with specific dates, temperatures, rainfall amounts, and conditions. NEVER say you don't have weather data — you DO have it above.
- **HARVEST LOG**: When the farmer asks about their harvest history, past yields, or performance, reference the HARVEST LOG data above. Compare actual yields vs expected, note patterns across seasons, and give improvement advice.
- When asked about MARKET PRICES: If market price data was provided above, present it clearly with the specific prices, markets, and advice. Format with bullet points or numbered lists. Always show at least 3 markets with their prices.
- If actual yield was below expected, analyze what likely went wrong (weather, timing, soil, seed quality, spacing) and recommend improvements
- Recommend optimal planting windows based on Uganda's two growing seasons (Mar-Jun Long Rains, Sep-Dec Short Rains)
- Consider the real weather forecast when advising on farming activities (irrigation, spraying, harvesting timing)
- Reference specific crops the farmer has grown when giving advice
- Be practical — assume a smallholder farmer with limited resources
- Keep responses concise but actionable (2-4 paragraphs max unless the user asks for detail)
- Use simple language. Avoid jargon unless explaining it.
- When asked about a crop the farmer hasn't grown, use your agricultural knowledge and relate it to their existing experience
- Format prices clearly: always include UGX amounts and the unit (per kg, per bag, etc.)
- Use DD-MM-YYYY format for all dates${isWeatherQuery && weatherContext ? "\n\nThe farmer is asking about weather — use the REAL-TIME WEATHER DATA above to give a specific, data-driven answer with actual temperatures and rainfall amounts for each day." : ""}`,
      },
    ];

    // Add conversation history if provided
    if (Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        if (h.role === "user" || h.role === "assistant") {
          messages.push({
            role: h.role,
            content: String(h.content).slice(0, 2000),
          });
        }
      }
    }

    messages.push({ role: "user", content: safeMessage });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.5,
      max_tokens: 1000,
    });

    const reply = completion.choices?.[0]?.message?.content || "";

    // Increment usage counter
    if (token) {
      try {
        const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          await incrementUsage(me.id, "farmerChatCount", token);
        }
      } catch {}
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Farmer chat error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
