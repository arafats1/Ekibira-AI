import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  try {
    const { cropName, location, area, areaUnit, harvestDate, expectedYieldLow, expectedYieldHigh } =
      await request.json();

    if (!cropName || !location) {
      return NextResponse.json(
        { error: "cropName and location are required" },
        { status: 400 }
      );
    }

    const safeCrop = String(cropName).trim().slice(0, 100);
    const safeLoc = String(location).trim().slice(0, 200);
    const safeArea = area
      ? `${parseFloat(area) || 0} ${String(areaUnit || "acres").slice(0, 20)}`
      : "unknown area";
    const today = new Date().toISOString().split("T")[0];

    const yieldLow = parseFloat(expectedYieldLow) || 0;
    const yieldHigh = parseFloat(expectedYieldHigh) || 0;
    const hasYield = yieldLow > 0 && yieldHigh > 0;

    const prompt = `You are an expert agricultural market analyst for Uganda and East Africa. A smallholder farmer just harvested their crop and needs market intelligence to sell at the best price.

CROP: ${safeCrop}
LOCATION: ${safeLoc}
FARM SIZE: ${safeArea}
HARVEST DATE: ${harvestDate || "today"}
TODAY: ${today}
${hasYield ? `EXPECTED YIELD: ${yieldLow} — ${yieldHigh} kg` : ""}

Provide REAL, practical market intelligence for this specific crop in Uganda. Use your knowledge of actual current Ugandan market prices, trading hubs, and seasonal patterns.

Respond with ONLY valid JSON:
{
  "currentPrice": {
    "low": 0,
    "mid": 0,
    "high": 0,
    "unit": "UGX/kg",
    "trend": "rising|stable|falling",
    "trendReason": "Brief reason for the price trend"
  },
  "bestMarkets": [
    {
      "name": "Market/trading hub name",
      "location": "Town/city",
      "distance": "Approximate distance from farmer's location",
      "priceRange": "e.g., 2,500-3,200 UGX/kg",
      "tip": "Best day/time to sell, buyer contacts, etc."
    }
  ],
  "sellStrategy": {
    "recommendation": "sell_now|store_and_wait|process_first",
    "reasoning": "2-3 sentences explaining the best strategy",
    "optimalSellWindow": "e.g., Within 2 weeks, or Store until July"
  },
  "valueAddition": [
    {
      "method": "e.g., Drying, Milling, Sorting/grading",
      "priceIncrease": "e.g., +40% price premium",
      "effort": "low|medium|high",
      "description": "Brief how-to and expected benefit"
    }
  ],
  "seasonalInsight": "2-3 sentences about the seasonal price pattern for this crop — when prices peak, when they dip, and how the farmer can benefit from timing.",
  "buyerTips": "Practical tips on negotiating with middlemen, avoiding exploitation, and getting fair prices. Include any cooperative or organization the farmer could join."
}

RULES:
- Prices must be in Ugandan Shillings (UGX) and realistic for the current season.
- bestMarkets: 3-4 markets, closest first. Include major regional markets and Kampala if relevant.
- Do NOT include estimatedRevenue in sellStrategy — it will be calculated separately.
- valueAddition: 2-3 practical options appropriate for a smallholder with limited equipment.
- Be specific to the crop and location — different crops have vastly different market dynamics.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 1500,
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const jsonStr = raw.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      // GPT JSON parse failed, raw response logged silently
      throw parseErr;
    }

    // Calculate estimated revenue from expected yield × market price
    if (hasYield && parsed.currentPrice) {
      const priceLow = parsed.currentPrice.low || 0;
      const priceHigh = parsed.currentPrice.high || 0;
      const priceMid = parsed.currentPrice.mid || 0;
      parsed.sellStrategy = parsed.sellStrategy || {};
      parsed.sellStrategy.estimatedRevenue = {
        low: Math.round(yieldLow * priceLow),
        high: Math.round(yieldHigh * priceHigh),
        currency: "UGX",
      };
    }

    return NextResponse.json({ prices: parsed });
  } catch (error) {
    // Market prices error silently handled
    return NextResponse.json(
      { error: "Failed to fetch market intelligence" },
      { status: 500 }
    );
  }
}
