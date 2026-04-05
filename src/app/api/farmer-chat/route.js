import { NextResponse } from "next/server";
import OpenAI from "openai";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getToken(request) {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
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
  let text = `📊 **${cropName} Market Prices (${new Date().toLocaleDateString("en-GB")})**\n\n`;
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

    // Build crop summary
    let cropSummary = "No crops recorded yet.";
    if (farmerCrops.length > 0) {
      const lines = farmerCrops.map((c, i) => {
        let line = `${i + 1}. ${c.cropName}${c.variety ? ` (${c.variety})` : ""} — ${c.status}`;
        line += `\n   Location: ${c.location}, Area: ${c.area || "?"} ${c.areaUnit || "acres"}`;
        line += `\n   Planted: ${c.plantingDate || "?"}`;
        if (c.seedQuantity) line += `, Seed: ${c.seedQuantity} ${c.seedUnit || "kg"}`;
        if (c.spacing) line += `, Spacing: ${c.spacing}`;
        if (c.harvestDate) line += `\n   Harvested: ${c.harvestDate}`;
        if (c.harvestYield > 0)
          line += `, Actual yield: ${c.harvestYield} ${c.yieldUnit || "kg"}`;
        if (c.expectedYieldLow > 0)
          line += `, Expected: ${c.expectedYieldLow}–${c.expectedYieldHigh} kg`;
        if (c.harvestYield > 0 && c.expectedYieldLow > 0) {
          const pct = Math.round(
            (c.harvestYield /
              ((c.expectedYieldLow + c.expectedYieldHigh) / 2)) *
              100
          );
          line += ` (${pct}% of expected)`;
        }
        return line;
      });
      cropSummary = lines.join("\n");
    }

    // Locations summary for weather context
    const locations = [
      ...new Set(farmerCrops.map((c) => c.location).filter(Boolean)),
    ];

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

    // Build conversation history
    const messages = [
      {
        role: "system",
        content: `You are KibiraAI Farm Assistant — an expert agricultural advisor personalized for this specific farmer in Uganda/East Africa. You have access to all their farm data below.

TODAY: ${new Date().toISOString().split("T")[0]}

FARMER'S CROPS:
${cropSummary}

FARMER'S LOCATIONS: ${locations.join(", ") || "Unknown"}${marketContext}

YOUR ROLE:
- Answer questions about their specific crops, yields, timing, and practices
- Use their ACTUAL data (planting dates, harvest dates, actual yields vs expected) to give tailored advice
- When asked about MARKET PRICES: If market price data was provided above, present it clearly with the specific prices, markets, and advice. Format with bullet points or numbered lists. Always show at least 3 markets with their prices.
- If actual yield was below expected, analyze what likely went wrong (weather, timing, soil, seed quality, spacing) and recommend improvements
- Recommend optimal planting windows based on Uganda's two growing seasons (Mar-Jun Long Rains, Sep-Dec Short Rains)
- Consider local climate patterns and forecast conditions when advising
- Reference specific crops the farmer has grown when giving advice
- Be practical — assume a smallholder farmer with limited resources
- Keep responses concise but actionable (2-4 paragraphs max unless the user asks for detail)
- Use simple language. Avoid jargon unless explaining it.
- When asked about a crop the farmer hasn't grown, use your agricultural knowledge and relate it to their existing experience
- Format prices clearly: always include UGX amounts and the unit (per kg, per bag, etc.)`,
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

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Farmer chat error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
