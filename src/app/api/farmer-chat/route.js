import { NextResponse } from "next/server";
import OpenAI from "openai";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getToken(request) {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
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

    // Build conversation history
    const messages = [
      {
        role: "system",
        content: `You are KibiraAI Farm Assistant — an expert agricultural advisor personalized for this specific farmer in Uganda/East Africa. You have access to all their farm data below.

TODAY: ${new Date().toISOString().split("T")[0]}

FARMER'S CROPS:
${cropSummary}

FARMER'S LOCATIONS: ${locations.join(", ") || "Unknown"}

YOUR ROLE:
- Answer questions about their specific crops, yields, timing, and practices
- Use their ACTUAL data (planting dates, harvest dates, actual yields vs expected) to give tailored advice
- If actual yield was below expected, analyze what likely went wrong (weather, timing, soil, seed quality, spacing) and recommend improvements
- Recommend optimal planting windows based on Uganda's two growing seasons (Mar-Jun Long Rains, Sep-Dec Short Rains)
- Consider local climate patterns and forecast conditions when advising
- Reference specific crops the farmer has grown when giving advice
- Be practical — assume a smallholder farmer with limited resources
- Keep responses concise but actionable (2-4 paragraphs max unless the user asks for detail)
- Use simple language. Avoid jargon unless explaining it.
- When asked about a crop the farmer hasn't grown, use your agricultural knowledge and relate it to their existing experience`,
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
