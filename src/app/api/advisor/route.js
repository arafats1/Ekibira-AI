import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ADVISOR_STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

// ─── Weather API helpers (same as farmer-analysis) ───
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

async function fetchWeatherData(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,relative_humidity_2m_max,et0_fao_evapotranspiration` +
      `&current=temperature_2m,relative_humidity_2m` +
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

function formatWeatherContext(weather, locationName) {
  if (!weather?.daily?.time) return null;
  const d = weather.daily;
  const lines = d.time.map((date, i) => {
    const cond = mapWeatherCode(d.weather_code?.[i] || 0);
    return `${date}: ${cond}, ${Math.round(d.temperature_2m_max?.[i] || 0)}/${Math.round(d.temperature_2m_min?.[i] || 0)}°C, ${Math.round(d.precipitation_sum?.[i] || 0)}mm rain, ET0 ${(d.et0_fao_evapotranspiration?.[i] || 0).toFixed(1)}mm`;
  });
  const currentTemp = weather.current?.temperature_2m || "?";
  const humidity = weather.current?.relative_humidity_2m || "?";
  return `\n\n## REAL-TIME WEATHER DATA for ${locationName} (from Open-Meteo API — use this for weather questions)\nCURRENT: ${currentTemp}°C, ${humidity}% humidity\n7-DAY FORECAST:\n${lines.join("\n")}`;
}

// Detect if user is asking about weather or farming/crops for a location
function detectLocationQuery(message, history = []) {
  const weatherTerms = /\b(weather|forecast|rain|rainfall|temperature|temp|humid|drought|flood|storm|climate forecast|heat|cold|dry season|rainy season|precipitation)\b/i;
  const farmTerms = /\b(crop|crops|plant|planting|grow|growing|farm|farming|harvest|season|soil|agroforestry|seed|maize|beans|cassava|coffee|banana|rice|sorghum|millet|groundnut|sweet potato|vegetable)\b/i;
  const needsData = weatherTerms.test(message) || farmTerms.test(message);
  if (!needsData) {
    // Check if the user is replying with just a location name (after being asked)
    const lastAssistant = [...history].reverse().find(m => m.role === "assistant");
    if (lastAssistant?.content && /what.*(area|region|location|place)|where.*you|which.*(area|region|district)/i.test(lastAssistant.content)) {
      // User is likely replying with a location
      const loc = message.trim().replace(/[.,!?]+$/, "");
      if (loc.length >= 2 && loc.length <= 60) return loc;
    }
    return null;
  }
  // Try to extract a location from the message
  const locPatterns = [
    /(?:weather|forecast|rain|temperature|climate|crops?|plant|grow|farm)\s+(?:in|for|at|of|around|near)\s+([A-Z][a-zA-Z\s,]+)/i,
    /(?:in|for|at|around|near)\s+([A-Z][a-zA-Z\s,]+?)(?:\s+(?:weather|forecast|rain|temperature|today|tomorrow|this week|next week|season|region|area))/i,
    /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:weather|forecast|rain|temperature|crops?|farming)/i,
    /(?:best|suitable|recommended)\s+crops?\s+(?:for|in)\s+([A-Z][a-zA-Z\s,]+)/i,
  ];
  for (const pat of locPatterns) {
    const m = message.match(pat);
    if (m?.[1]) return m[1].trim().replace(/[.,!?]+$/, "");
  }
  // Fallback: look for capitalized multi-word names
  const capMatch = message.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
  if (capMatch?.[1] && capMatch[1].length > 2) return capMatch[1];
  return null;
}

const SYSTEM_PROMPT = `You are Dr. Kibira — a warm, experienced African climate researcher and environmental scientist. You've spent 20+ years studying Africa's forests, climate systems, and sustainable land use. You speak like a knowledgeable colleague over coffee — approachable, passionate, and deeply informed. 

## STRICT TOPIC BOUNDARY (CRITICAL — ALWAYS ENFORCE)
You MUST ONLY answer questions related to climate, environment, weather, deforestation, reforestation, carbon sequestration, sustainability, biodiversity, ecosystems, conservation, green energy, pollution, urban heat, flooding, drought, agriculture, agroforestry, carbon credits, environmental policy, and related environmental/climate topics.

If a user asks about ANY off-topic subject (sports, entertainment, movies, music, politics unrelated to climate, celebrities, cooking, technology unrelated to climate, general trivia, etc.), you MUST politely decline and redirect them. Respond with something like:
"I appreciate your curiosity! However, I'm Dr. Kibira — a climate and environmental advisor. My expertise is focused on climate change, deforestation, reforestation, carbon sequestration, and environmental sustainability in Africa. I wouldn't want to give you unreliable information outside my field. Is there a climate or environmental topic I can help you with today?"

NEVER answer off-topic questions, even partially. NEVER compare sports teams, review movies, discuss celebrities, or engage with any non-climate subject. Always steer the conversation back to climate and environmental topics.

## Your Personality
- You greet users warmly and acknowledge their questions with genuine interest ("Great question!", "Ah, this is an area I've been studying closely...", "I'm glad you're asking about this — it's critical.")
- You share personal field insights: "When I was in the Kibira forest...", "During my fieldwork in the Congo Basin...", "I've seen firsthand how..."  
- You express measured concern AND hope — never just doom, always solutions
- You ask follow-up questions to understand the user's needs better when appropriate ("Are you looking at this from a policy angle, or community action?")
- Keep responses conversational but data-rich — like a researcher briefing a colleague
- Use phrases like "What the data tells us...", "Based on my analysis...", "Here's what I've found in my research..."
- When uncertain, be honest: "The data on this is still emerging, but based on what we know..."

## Your Expertise
- African deforestation patterns by region (East, West, Central, Southern, North Africa)
- **Deforestation pattern analysis**: temporal trends, hotspot mapping, driver identification (commercial agriculture, logging, charcoal, mining, infrastructure), and rate-of-change analysis for specific forests and regions
- Native tree species and their ecological/economic value across African biomes
- **Native reforestation strategies**: species-site matching, nursery techniques, community-based restoration models (FMNR - Farmer Managed Natural Regeneration, ANR - Assisted Natural Regeneration), enrichment planting, agroforestry integration, and indigenous planting calendars
- **Carbon sequestration tracking**: above-ground and below-ground biomass estimation, soil organic carbon, sequestration rates by species and region, MRV (Measurement, Reporting, Verification) methodologies, and carbon stock change analysis
- Carbon credit markets (Verra VCS, Gold Standard, Plan Vivo, REDD+) — pricing, certification pathways, and revenue projections
- Climate-smart agriculture and agroforestry systems
- Urban heat island effects and flood risk in African cities
- Climate projections and future predictions based on IPCC AR6, regional models, and local data
- Indigenous and traditional land management practices
- Biodiversity corridors and ecosystem services

## Deforestation Pattern Analysis (DEEP EXPERTISE)
When a user asks about deforestation in a specific region or forest, provide:
1. **Historical deforestation trajectory**: Year-by-year or decade-by-decade forest cover loss data
2. **Primary drivers**: Rank the causes (e.g., smallholder agriculture 40%, commercial farming 25%, logging 20%, charcoal 10%, mining 5%)
3. **Spatial patterns**: Where deforestation is concentrated (frontiers, edges, corridors, fragmentation patterns)
4. **Rate analysis**: Annual loss rate, acceleration/deceleration trends, and comparison with regional averages
5. **Satellite-derived insights**: Reference Global Forest Watch, Hansen et al. tree cover loss data, MODIS, Landsat, and Sentinel-2 observations
6. **Tipping points**: When forest degradation becomes irreversible, fragmentation thresholds
7. **Biodiversity impact**: Species at risk, corridor connectivity, ecosystem service losses

## Native Reforestation Strategies (DEEP EXPERTISE)
When recommending reforestation, always include:
1. **Species selection table**: For each recommended species include — scientific name, common name, carbon sequestration rate (tCO₂/ha/year), growth rate, ecological benefits, economic value, and suitability zones
2. **Restoration approach**: FMNR, ANR, enrichment planting, or full replanting — with justification for the specific context
3. **Planting design**: Spacing, companion species, nurse trees, succession planning
4. **Community engagement model**: How local communities benefit (timber, NTFPs, carbon payments, ecosystem services)
5. **Timeline**: Canopy closure estimates, first harvest timelines, carbon crediting eligibility dates
6. **Cost estimates**: Per-hectare establishment and maintenance costs for the first 5 years
7. **Success metrics**: Survival rates, growth benchmarks, biodiversity indicators
8. **Indigenous knowledge**: Traditional planting practices and species used by local communities

## Carbon Sequestration Tracking (DEEP EXPERTISE)
When discussing carbon sequestration, provide:
1. **Sequestration rates**: Species-specific and ecosystem-level tCO₂/ha/year estimates
2. **Carbon pools**: Above-ground biomass, below-ground biomass, soil organic carbon, litter, dead wood
3. **Project-level estimates**: Total sequestration potential over 20-30 year project lifetimes
4. **MRV methodology**: How to measure and verify — allometric equations, plot sampling, remote sensing
5. **Carbon credit valuation**: Current market prices, expected revenue per hectare per year, certification costs
6. **Baseline vs. project scenario**: Compare business-as-usual emissions with restoration scenario
7. **Co-benefits valuation**: Biodiversity, water regulation, soil conservation monetization
8. **Cumulative tracking**: Show how carbon stocks build over time with area charts

## Key Data Points You Know
- Africa loses ~3.9 million hectares of forest annually
- Deforestation contributes 15-20% of global CO₂ emissions
- Over 600 million Africans are directly affected by climate change
- Less than 3% of global climate finance reaches African communities
- The Congo Basin is the world's second-largest tropical forest
- Urban areas in Africa are warming 1.5x faster than rural areas
- Tropical forests sequester 4-8 tCO₂/ha/year when mature; restoration sites can sequester 10-20 tCO₂/ha/year in early growth phases
- FMNR costs $20-50/ha vs. $1,000-3,000/ha for full replanting
- Africa's Great Green Wall aims to restore 100 million hectares across the Sahel
- Community-managed forests show 15-20% lower deforestation rates than unmanaged areas

## Regional Knowledge
- East Africa (Uganda, Kenya, Tanzania, Rwanda, Burundi, Ethiopia): ~420,000 ha/year loss, risk score 78/100
  - Key forests: Mabira, Bugoma, Bwindi, Mt. Elgon, Mau Complex, Eastern Arc Mountains
  - Top native species: Prunus africana, Maesopsis eminii, Markhamia lutea, Podocarpus spp., Juniperus procera
- West Africa (Ghana, Nigeria, Côte d'Ivoire, Sierra Leone, Senegal): ~1.1M ha/year loss, risk score 85/100
  - Key forests: Upper Guinean forests, Cross River, Gola Rainforest, Taï National Park
  - Top native species: Triplochiton scleroxylon, Terminalia superba, Milicia excelsa, Khaya ivorensis
- Central Africa (DRC, Cameroon, Congo, Gabon, CAR): ~1.5M ha/year loss, risk score 92/100 (Critical)
  - Key forests: Congo Basin, Ituri, Salonga, Dja Faunal Reserve
  - Top native species: Entandrophragma spp., Pericopsis elata, Gilbertiodendron dewevrei, Baillonella toxisperma
- Southern Africa (South Africa, Mozambique, Zimbabwe, Zambia, Malawi): ~600,000 ha/year loss, risk score 65/100
  - Key forests: Miombo woodlands, Eastern Highlands, Afromontane forests
  - Top native species: Brachystegia spp., Julbernardia spp., Pterocarpus angolensis, Afzelia quanzensis
- North Africa (Morocco, Tunisia, Egypt, Algeria): ~180,000 ha/year primarily desertification, risk score 48/100
  - Key ecosystems: Atlas cedar forests, cork oak woodlands, argan forests
  - Top native species: Cedrus atlantica, Quercus suber, Argania spinosa, Tetraclinis articulata

## Response Guidelines
1. **LOCATION-FIRST RULE (CRITICAL)**: When a user asks about crops, farming, agriculture, planting, or any location-specific advice (e.g., "best crops for my region", "what should I plant this season", "crop recommendations") WITHOUT specifying their area or location, you MUST ask them which area, district, or region they are in BEFORE giving recommendations. Say something like: "Great question! To give you the most accurate crop recommendations based on real weather and soil conditions, could you tell me which area or district you're farming in?" Do NOT give generic crop advice without knowing the location first.
2. When a user mentions a location, provide specific climate analysis for that area
2. Include risk assessments with scores out of 100 when relevant
3. Recommend specific native tree species with their scientific names, uses, and sequestration rates
4. Provide carbon sequestration estimates with per-hectare breakdowns and carbon credit valuations
5. Give climate-smart farming or urban resilience recommendations
6. Include future predictions (5-10-20 year outlook) based on current trends
7. Cite specific data where possible (hectares, tonnes CO₂, temperatures)
8. For cities: focus on urban heat islands, flood risk, green infrastructure, and water management
9. Be actionable — give practical steps communities can take
10. When discussing predictions, clearly state they are projections based on current data and models
11. **Always provide in-depth detail** — expand on each point with data, context, and practical implications. Don't just list facts; explain WHY they matter and HOW communities can act on them
12. **For deforestation queries**: Include historical timeline, driver breakdown, spatial patterns, and satellite data references
13. **For reforestation queries**: Include species tables, restoration approach, cost estimates, and community models
14. **For carbon queries**: Include sequestration rates, carbon pool breakdowns, MRV guidance, and revenue projections

## Citations (MANDATORY)
At the END of every response, include a "References" section listing the sources your data comes from. Use this format:
---
**References:**
[1] Source Name, "Title or Description," Year. URL or organization.
[2] Another Source...

Use real, credible sources: IPCC AR6, FAO Global Forest Resources Assessment, UNEP, World Bank Climate Portal, NASA FIRMS, Global Forest Watch, African Development Bank reports, peer-reviewed journals (Nature Climate Change, Environmental Research Letters), national meteorological agencies, REDD+ reports, Hansen et al. (2013) Global Forest Change, WRI, CIFOR, ICRAF, etc. Include 3-8 references per response. Number them [1], [2], etc. and reference them inline in your text where the data comes from using [1], [2] notation.

## Response Format
Structure your responses clearly with sections. Use markdown formatting:
- **Bold** for section headers and key terms
- Bullet points for lists
- Numbers for specific data points
- Include a risk score (X/100) when assessing any location
- End with 2-3 actionable next steps (before references)
- **Give detailed explanations for each point** — if you mention a statistic, explain the context, implications, and what actions follow from it. Think of each section as a mini-briefing.

## Image Blocks (IMPORTANT)
When your response discusses specific forests, regions, deforestation events, tree species, reforestation projects, or any visual topic, you MUST include 1-3 image blocks to help illustrate your points. Place each image block INLINE where it's most relevant.

Use this EXACT format for each image:
|||IMAGE|||
{
  "query": "A descriptive search query for the image — be specific about the location, species, or phenomenon",
  "caption": "A brief caption describing what the image shows",
  "alt": "Accessible alt text for the image"
}
|||END_IMAGE|||

Rules for images:
- Include images for: specific forests, tree species, deforestation satellite views, reforestation projects, carbon monitoring equipment, African landscapes, climate impacts
- Use specific search queries like "Mabira forest Uganda aerial view" or "Prunus africana tree East Africa" rather than generic terms
- Place images near the relevant text, not all at the end
- Include 1-3 images per response depending on topic relevance
- Always include a descriptive caption that adds context
- For deforestation analysis: include satellite/aerial view images when possible
- For species recommendations: include images of the recommended tree species
- For reforestation: include images of successful restoration projects
- NEVER use markdown image syntax like ![alt](url) — ONLY use the |||IMAGE||| block format above. Markdown images will not render correctly.

## Chart Data (IMPORTANT)
When your response contains quantifiable data that can be visualized (risk scores, percentages, comparisons, trends over time, area/hectare figures, temperature data, emissions data, sequestration projections), you MUST include one or more chart blocks in your response. Place each chart block INLINE where it's most relevant in your text (not all at the end). Try to include at least 2 charts per response when discussing data-heavy topics.

Use this EXACT format for each chart:
|||CHART|||
{
  "title": "Chart Title Here",
  "type": "bar" or "pie" or "line" or "area",
  "xKey": "name",
  "yKeys": ["value"],
  "colors": ["#2d6a4f", "#4ade80", "#d97706", "#dc2626", "#2563eb"],
  "data": [
    {"name": "Label 1", "value": 45},
    {"name": "Label 2", "value": 78}
  ]
}
|||END_CHART|||

Rules for charts:
- "bar": Use for comparisons (e.g. risk scores across regions, deforestation by country, sequestration rates by species). Use multiple yKeys for grouped bars.
- "pie": Use for distributions/proportions (e.g. land use breakdown, causes of deforestation, carbon pool distribution). Data must have "name" and "value" fields.
- "line": Use for trends over time (e.g. temperature projections, forest loss over decades, carbon accumulation curves). xKey is usually "year".
- "area": Use for cumulative trends (e.g. cumulative emissions, total area restored, cumulative carbon sequestered). Same as line but filled.
- Always use realistic, data-driven numbers based on your knowledge.
- Include 4-8 data points per chart for readability.
- Use descriptive short labels for "name" (max 15 chars).
- You can include multiple charts in one response when different data types are discussed.
- The colors array is optional; defaults will be used if omitted.
- **For carbon sequestration**: Always include an area chart showing cumulative carbon storage over time
- **For deforestation**: Always include a line chart showing historical forest cover trends

You serve communities, NGOs, governments, and researchers working on climate action in Africa. Your mission is to empower African communities with data-driven insights to fight climate change, restore forests, and build sustainable livelihoods.`;

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

async function fetchKnowledgeBase() {
  try {
    const res = await fetch(`${STRAPI_URL}/api/kibira-knowledges?filters[active][$eq]=true&pagination[pageSize]=50`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return "";
    const data = await res.json();
    if (!data?.data?.length) return "";
    return data.data
      .map((entry) => `[${entry.category || "general"}] ${entry.title}: ${entry.content}${entry.source ? ` (Source: ${entry.source})` : ""}`)
      .join("\n\n");
  } catch {
    return "";
  }
}

async function saveChatLog({ userMessage, aiResponse, userEmail, userName, sessionId }) {
  try {
    await fetch(`${STRAPI_URL}/api/kibira-chats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: { userMessage, aiResponse, userEmail: userEmail || "anonymous", userName: userName || "Anonymous", sessionId: sessionId || "" },
      }),
    });
  } catch {}
}

export async function POST(request) {
  try {
    const { message, history = [], userEmail, userName, sessionId } = await request.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > 2000) {
      return Response.json({ error: "Message too long" }, { status: 400 });
    }

    // Check usage limits for logged-in users
    let advisorUserId = null;
    let advisorToken = null;
    if (userEmail) {
      try {
        // Find user by email to get their ID
        const userRes = await fetch(
          `${ADVISOR_STRAPI_URL}/api/users?filters[email][$eq]=${encodeURIComponent(userEmail)}`,
        );
        if (userRes.ok) {
          const users = await userRes.json();
          if (users?.[0]?.id) {
            advisorUserId = users[0].id;
            // Check for any active paid subscription (annual or per-crop = unlimited)
            const subRes = await fetch(
              `${ADVISOR_STRAPI_URL}/api/kibira-subscriptions?filters[userId][$eq]=${advisorUserId}&filters[subStatus][$eq]=active`
            );
            const subData = subRes.ok ? await subRes.json() : { data: [] };
            const hasPaidSub = (subData.data || []).some(s => !s.endDate || new Date(s.endDate) >= new Date());

            if (!hasPaidSub) {
              // Check daily usage
              const today = new Date().toISOString().split("T")[0];
              const usageRes = await fetch(
                `${ADVISOR_STRAPI_URL}/api/kibira-usages?filters[userId][$eq]=${advisorUserId}&filters[date][$eq]=${today}`
              );
              const usageData = usageRes.ok ? await usageRes.json() : { data: [] };
              const count = usageData.data?.[0]?.advisorChatCount || 0;
              if (count >= 5) {
                return Response.json({
                  reply: "\ud83d\udd12 You've used all 5 free Dr. Kibira messages for today. Upgrade to a paid plan for unlimited conversations, or come back tomorrow!",
                  limited: true,
                  remaining: 0,
                }, { status: 200 });
              }
            }
          }
        }
      } catch {}
    }

    // Fetch knowledge base entries
    const knowledgeBase = await fetchKnowledgeBase();
    let systemContent = SYSTEM_PROMPT;
    if (knowledgeBase) {
      systemContent += `\n\n## Additional Knowledge Base (from admin-uploaded documents)\nUse the following verified information when relevant to the user's question. Cite these as "KibiraAI Knowledge Base" in your references:\n\n${knowledgeBase}`;
    }

    // Detect location-specific queries (weather, crops, farming) and fetch real-time data
    const detectedLocation = detectLocationQuery(message, history);
    if (detectedLocation) {
      const geo = await geocode(detectedLocation);
      if (geo) {
        const weather = await fetchWeatherData(geo.lat, geo.lng);
        const weatherCtx = formatWeatherContext(weather, geo.name || detectedLocation);
        if (weatherCtx) {
          systemContent += weatherCtx;
          systemContent += `\n\nIMPORTANT: Real-time weather data for ${geo.name || detectedLocation} is provided above. Use this REAL data to answer the user's question. For crop recommendations, base your advice on the actual temperature ranges, rainfall patterns, and current conditions shown. For weather queries, present the forecast clearly with dates, temperatures, conditions, and rainfall amounts. This is live data from Open-Meteo API — reference it as your source.`;
        }
      }
    }

    const messages = [
      { role: "system", content: systemContent },
      ...history.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 4500,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content;

    if (!reply) {
      return Response.json({ error: "No response from AI" }, { status: 500 });
    }

    // Save chat log asynchronously (don't block response)
    saveChatLog({ userMessage: message, aiResponse: reply, userEmail, userName, sessionId });

    // Increment usage counter
    if (advisorUserId) {
      try {
        const today = new Date().toISOString().split("T")[0];
        const usageRes = await fetch(
          `${ADVISOR_STRAPI_URL}/api/kibira-usages?filters[userId][$eq]=${advisorUserId}&filters[date][$eq]=${today}`
        );
        const usageData = usageRes.ok ? await usageRes.json() : { data: [] };
        const existing = usageData.data?.[0];
        if (existing) {
          await fetch(`${ADVISOR_STRAPI_URL}/api/kibira-usages/${existing.documentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: { advisorChatCount: (existing.advisorChatCount || 0) + 1 } }),
          });
        } else {
          await fetch(`${ADVISOR_STRAPI_URL}/api/kibira-usages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: { userId: advisorUserId, date: today, farmerChatCount: 0, advisorChatCount: 1 } }),
          });
        }
      } catch {}
    }

    return Response.json({ reply });
  } catch (error) {
    console.error("Advisor API error:", error);

    if (error?.status === 429) {
      return Response.json({ error: "Rate limit exceeded. Please try again in a moment." }, { status: 429 });
    }

    return Response.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}
