"use client";
import { useState, useRef, useEffect } from "react";

// Comprehensive knowledge base for AI-driven responses
const REGION_DATA = {
  "east africa": {
    countries: "Uganda, Kenya, Tanzania, Rwanda, Burundi, Ethiopia",
    riskLevel: "High",
    riskScore: 78,
    annualLoss: "~420,000 hectares/year",
    primaryDrivers: "Agricultural expansion, charcoal production, population growth",
    nativeTrees: [
      { name: "Prunus africana", use: "Medicinal, timber — endangered but highly valuable for agroforestry" },
      { name: "Maesopsis eminii (Musizi)", use: "Fast-growing shade tree, excellent for carbon sequestration" },
      { name: "Markhamia lutea", use: "Soil improvement, boundary planting, firewood alternative" },
      { name: "Ficus natalensis (Mutuba)", use: "Indigenous fig — supports biodiversity, stabilizes soil" },
      { name: "Cordia africana", use: "Timber, bee forage — high economic and ecological value" },
    ],
    carbonPotential: "8.2 - 14.5 tonnes CO₂/hectare/year",
    farmingTips: [
      "Integrate agroforestry with coffee and banana systems for shade and income diversification",
      "Use Gliricidia sepium as nitrogen-fixing hedge crop to replace synthetic fertilizers",
      "Implement contour farming on highland slopes to prevent soil erosion during intense rains",
      "Transition from charcoal to improved cookstoves to reduce deforestation pressure by up to 60%",
    ],
    carbonCredits: "$12-18 per tonne CO₂e under Verra VCS standard — potential $1,200-2,600/ha over 10 years",
  },
  "west africa": {
    countries: "Ghana, Nigeria, Côte d'Ivoire, Sierra Leone, Senegal, Guinea",
    riskLevel: "Very High",
    riskScore: 85,
    annualLoss: "~1.1 million hectares/year",
    primaryDrivers: "Cocoa farming, logging, mining, urban sprawl",
    nativeTrees: [
      { name: "Triplochiton scleroxylon (Obeche)", use: "Fast-growing timber, reforestation pioneer species" },
      { name: "Khaya senegalensis (Mahogany)", use: "High-value timber, excellent shade for cocoa agroforestry" },
      { name: "Vitellaria paradoxa (Shea)", use: "Nut oil production — economic empowerment for women" },
      { name: "Parkia biglobosa (Dawadawa)", use: "Food, medicine, nitrogen fixation" },
      { name: "Moringa oleifera", use: "Nutrition, water purification, fast-growing biomass" },
    ],
    carbonPotential: "10.5 - 18.3 tonnes CO₂/hectare/year",
    farmingTips: [
      "Adopt cocoa agroforestry systems — shade-grown cocoa yields premium prices and sequesters 3x more carbon",
      "Implement FMNR (Farmer-Managed Natural Regeneration) to restore degraded Sahel landscapes at low cost",
      "Replace slash-and-burn with composting and mulching to preserve soil organic matter",
      "Establish community woodlots for sustainable charcoal to relieve pressure on primary forests",
    ],
    carbonCredits: "$10-15 per tonne CO₂e — potential $800-2,200/ha over 10 years with Gold Standard certification",
  },
  "central africa": {
    countries: "DRC, Cameroon, Republic of Congo, Gabon, Central African Republic",
    riskLevel: "Critical",
    riskScore: 92,
    annualLoss: "~1.5 million hectares/year",
    primaryDrivers: "Shifting agriculture, industrial logging, artisanal mining, conflict displacement",
    nativeTrees: [
      { name: "Entandrophragma cylindricum (Sapele)", use: "High-value timber, CITES-listed — requires protected cultivation" },
      { name: "Musanga cecropioides (Umbrella Tree)", use: "Pioneer species for rapid forest restoration" },
      { name: "Gilbertiodendron dewevrei", use: "Dominant Congo Basin species — critical for ecosystem integrity" },
      { name: "Ricinodendron heudelotii (Njangsa)", use: "Food tree — seeds provide income and nutrition" },
      { name: "Dacryodes edulis (African Plum)", use: "Fruit tree — food security and agroforestry income" },
    ],
    carbonPotential: "15.2 - 24.8 tonnes CO₂/hectare/year",
    farmingTips: [
      "Support transition from shifting cultivation to permanent agroforestry with enriched fallows",
      "Promote non-timber forest products (NTFPs) as economic alternatives to logging",
      "Establish riparian buffer zones along waterways to protect critical forest corridors",
      "Use drone-based monitoring to detect illegal logging in real-time across vast forest areas",
    ],
    carbonCredits: "$15-25 per tonne CO₂e — highest potential in Africa, $2,800-6,200/ha over 10 years with REDD+ programs",
  },
  "southern africa": {
    countries: "South Africa, Mozambique, Zimbabwe, Zambia, Malawi, Madagascar",
    riskLevel: "Moderate-High",
    riskScore: 65,
    annualLoss: "~600,000 hectares/year",
    primaryDrivers: "Tobacco curing, charcoal, agricultural expansion, invasive species",
    nativeTrees: [
      { name: "Brachystegia spiciformis (Miombo)", use: "Dominant woodland species — keystone for ecosystem restoration" },
      { name: "Sclerocarya birrea (Marula)", use: "Fruit, oil, beverage production — high economic value" },
      { name: "Adansonia digitata (Baobab)", use: "Superfruit, carbon storage champion (stores up to 120,000L water)" },
      { name: "Uapaca kirkiana (Wild Loquat)", use: "Indigenous fruit tree — food security and woodland restoration" },
      { name: "Faidherbia albida", use: "Reverse-phenology tree — sheds leaves in wet season, perfect for crops" },
    ],
    carbonPotential: "5.8 - 11.2 tonnes CO₂/hectare/year",
    farmingTips: [
      "Integrate Faidherbia albida into maize fields — proven to double yields while sequestering carbon",
      "Replace tobacco curing with solar kilns to reduce wood consumption by 80%",
      "Restore Miombo woodlands through community-based natural resource management (CBNRM)",
      "Implement conservation agriculture (minimum tillage, cover crops, crop rotation) to build soil carbon",
    ],
    carbonCredits: "$8-14 per tonne CO₂e — potential $800-1,500/ha over 10 years through Plan Vivo certification",
  },
  "north africa": {
    countries: "Morocco, Tunisia, Egypt, Algeria, Libya",
    riskLevel: "Moderate",
    riskScore: 48,
    annualLoss: "~180,000 hectares/year (primarily desertification)",
    primaryDrivers: "Desertification, overgrazing, water scarcity, urbanization",
    nativeTrees: [
      { name: "Argania spinosa (Argan)", use: "UNESCO-protected — oil production, desert stabilization" },
      { name: "Olea europaea (Wild Olive)", use: "Drought-resistant, food production, erosion control" },
      { name: "Ceratonia siliqua (Carob)", use: "Drought-tolerant food and fodder tree" },
      { name: "Acacia raddiana", use: "Deep-rooted desert species — sand dune stabilization" },
      { name: "Phoenix dactylifera (Date Palm)", use: "Oasis ecosystem anchor — food, shade, microclimate creation" },
    ],
    carbonPotential: "2.5 - 6.8 tonnes CO₂/hectare/year",
    farmingTips: [
      "Implement the Great Green Wall initiative — plant drought-tolerant species along the Sahara boundary",
      "Use AI-optimized drip irrigation to expand tree cover in arid zones with minimal water waste",
      "Establish silvopastoral systems combining native trees with managed grazing to combat desertification",
      "Create green belts around expanding cities using native species like Argan and Olive",
    ],
    carbonCredits: "$6-12 per tonne CO₂e — lower density but long-duration credits, $400-800/ha over 10 years",
  },
  "urban resilience": {
    countries: "Lagos, Nairobi, Kinshasa, Addis Ababa, Johannesburg, Accra (Major Hubs)",
    riskLevel: "Urgent",
    riskScore: 88,
    annualLoss: "High service vulnerability to heat and floods",
    primaryDrivers: "Rapid urbanization, lack of green space, data gaps, informal settlement challenges",
    nativeTrees: [
      { name: "Grevillea robusta", use: "Urban shade, fast-growing, excellent for street lining and timber" },
      { name: "Spathodea campanulata (Nandi Flame)", use: "Ornamental, high biodiversity value for urban birds/insects" },
      { name: "Terminalia mantaly", use: "Layered shade — ideal for parking lots and heat-island mitigation" },
      { name: "Callistemon citrinus (Bottlebrush)", use: "Small footprint — suitable for narrow urban streets and vertical gardens" },
      { name: "Fruit Trees (Mango/Avocado)", use: "Urban food security — provides nutrition while reducing heat" },
    ],
    carbonPotential: "12.0 - 18.2 tonnes CO₂/hectare/year (Urban Forest equivalent)",
    farmingTips: [
      "Launch Community-led Vertical Farming & Urban Garden Advisory to tackle food insecurity",
      "Deploy AI-driven Flood Risk Analytics to provide early warning services for dense neighborhoods",
      "Develop Digital Green Corridors planning to reduce the Urban Heat Island effect by up to 5°C",
      "Integrate AI-driven Water Scarcity Monitoring services for smart distribution and leakage detection",
    ],
    carbonCredits: "$20-35 per tonne CO₂e — high value 'Social Impact' credits due to direct community benefits",
  },
};

function getRegionData(input) {
  const lower = input.toLowerCase();
  
  // Specific check for urban/city keywords
  if (lower.includes("urban") || lower.includes("city") || lower.includes("services") || lower.includes("resilience")) {
    return { region: "urban resilience", ...REGION_DATA["urban resilience"] };
  }

  // Direct region match
  for (const [region, data] of Object.entries(REGION_DATA)) {
    if (lower.includes(region.replace(" africa", ""))) return { region, ...data };
  }

  // Country-level matching
  const countryMap = {
    uganda: "east africa", kenya: "east africa", tanzania: "east africa",
    rwanda: "east africa", burundi: "east africa", ethiopia: "east africa",
    ghana: "west africa", nigeria: "west africa", "côte d'ivoire": "west africa",
    "ivory coast": "west africa", sierra: "west africa", senegal: "west africa",
    guinea: "west africa", mali: "west africa", "burkina": "west africa",
    drc: "central africa", congo: "central africa", cameroon: "central africa",
    gabon: "central africa",
    "south africa": "southern africa", mozambique: "southern africa",
    zimbabwe: "southern africa", zambia: "southern africa", malawi: "southern africa",
    madagascar: "southern africa",
    morocco: "north africa", tunisia: "north africa", egypt: "north africa",
    algeria: "north africa", libya: "north africa",
    // Cities
    kampala: "east africa", nairobi: "east africa", "dar es salaam": "east africa",
    kigali: "east africa", "addis ababa": "east africa", entebbe: "east africa",
    mbarara: "east africa", gulu: "east africa", jinja: "east africa",
    accra: "west africa", lagos: "west africa", abuja: "west africa",
    dakar: "west africa", freetown: "west africa", abidjan: "west africa",
    kinshasa: "central africa", douala: "central africa", yaoundé: "central africa",
    johannesburg: "southern africa", cape: "southern africa", harare: "southern africa",
    lusaka: "southern africa", maputo: "southern africa", lilongwe: "southern africa",
    casablanca: "north africa", cairo: "north africa", tunis: "north africa",
    marrakech: "north africa",
  };

  for (const [place, region] of Object.entries(countryMap)) {
    if (lower.includes(place)) {
      return { region, ...REGION_DATA[region] };
    }
  }

  // Default to east africa if "africa" mentioned or generic
  if (lower.includes("africa")) {
    return { region: "east africa", ...REGION_DATA["east africa"] };
  }

  return null;
}

function getRiskColor(score) {
  if (score >= 80) return { bg: "bg-red-100", text: "text-red-700", bar: "bg-red-500" };
  if (score >= 60) return { bg: "bg-orange-100", text: "text-orange-700", bar: "bg-orange-500" };
  if (score >= 40) return { bg: "bg-yellow-100", text: "text-yellow-700", bar: "bg-yellow-500" };
  return { bg: "bg-green-100", text: "text-green-700", bar: "bg-green-500" };
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-[#eef2e6] rounded-2xl rounded-bl-sm w-fit">
      <div className="w-2 h-2 rounded-full bg-[#2d6a4f]/50 typing-dot" />
      <div className="w-2 h-2 rounded-full bg-[#2d6a4f]/50 typing-dot" />
      <div className="w-2 h-2 rounded-full bg-[#2d6a4f]/50 typing-dot" />
    </div>
  );
}

function AIResponse({ data }) {
  const colors = getRiskColor(data.riskScore);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Risk Assessment */}
      <div className="bg-white rounded-xl p-5 border border-[#eef2e6]">
        <h4 className="font-bold text-[#1a2e1a] mb-3 flex items-center gap-2 font-[family-name:var(--font-display)]">
          <span className="text-lg">📊</span> Deforestation Risk Assessment
        </h4>
        <div className="flex items-center gap-3 mb-2">
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${colors.bg} ${colors.text}`}>
            {data.riskLevel} Risk
          </div>
          <span className="text-[#6b7c6b] text-sm">Score: {data.riskScore}/100</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
          <div
            className={`h-full rounded-full ${colors.bar} transition-all duration-1000`}
            style={{ width: `${data.riskScore}%` }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">
          <div><span className="font-semibold text-[#1a2e1a]">Region:</span> {data.countries}</div>
          <div><span className="font-semibold text-[#1a2e1a]">Annual Loss:</span> {data.annualLoss}</div>
          <div className="sm:col-span-2"><span className="font-semibold text-[#1a2e1a]">Primary Drivers:</span> {data.primaryDrivers}</div>
        </div>
      </div>

      {/* Native Trees */}
      <div className="bg-white rounded-xl p-5 border border-[#eef2e6]">
        <h4 className="font-bold text-[#1a2e1a] mb-3 flex items-center gap-2 font-[family-name:var(--font-display)]">
          <span className="text-lg">🌳</span> Recommended Native Trees for Reforestation
        </h4>
        <div className="space-y-2.5">
          {data.nativeTrees.map((tree, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-lg">
              <span className="text-[#2d6a4f] font-bold text-sm mt-0.5">{i + 1}.</span>
              <div className="font-[family-name:var(--font-body)]">
                <span className="font-semibold text-[#1a2e1a] text-sm">{tree.name}</span>
                <p className="text-[#6b7c6b] text-xs mt-0.5">{tree.use}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carbon Potential */}
      <div className="bg-white rounded-xl p-5 border border-[#eef2e6]">
        <h4 className="font-bold text-[#1a2e1a] mb-3 flex items-center gap-2 font-[family-name:var(--font-display)]">
          <span className="text-lg">🌍</span> Carbon Sequestration Potential
        </h4>
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 font-[family-name:var(--font-body)]">
          <div className="text-2xl font-bold text-[#2d6a4f] font-[family-name:var(--font-display)]">
            {data.carbonPotential}
          </div>
          <p className="text-sm text-[#6b7c6b] mt-1">Estimated annual sequestration with recommended species</p>
          <div className="mt-3 text-sm">
            <span className="font-semibold text-[#1a2e1a]">Carbon Credit Value:</span>{" "}
            <span className="text-[#2d6a4f] font-semibold">{data.carbonCredits}</span>
          </div>
        </div>
      </div>

      {/* Farming Tips */}
      <div className="bg-white rounded-xl p-5 border border-[#eef2e6]">
        <h4 className="font-bold text-[#1a2e1a] mb-3 flex items-center gap-2 font-[family-name:var(--font-display)]">
          <span className="text-lg">🌾</span> Climate-Smart Land Use Recommendations
        </h4>
        <div className="space-y-2 font-[family-name:var(--font-body)]">
          {data.farmingTips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="text-[#d4a843] font-bold flex-shrink-0">✦</span>
              <span className="text-[#6b7c6b] leading-relaxed">{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Demo() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { type: "user", text: userMessage }]);
    setLoading(true);

    // Simulate AI processing delay
    await new Promise((r) => setTimeout(r, 2000));

    const data = getRegionData(userMessage);
    if (data) {
      setMessages((prev) => [...prev, { type: "ai", data }]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          type: "ai-text",
          text: "I couldn't identify an African region from your input. Please try entering a specific country (e.g., \"Uganda\"), city (e.g., \"Nairobi\"), or region (e.g., \"West Africa\") for a detailed analysis.",
        },
      ]);
    }
    setLoading(false);
  };

  const quickOptions = [
    "Uganda",
    "Ghana - West Africa",
    "Congo Basin",
    "South Africa",
    "Morocco & North Africa",
  ];

  return (
    <section id="demo" className="relative py-24 md:py-32 px-6 bg-gradient-to-b from-white via-[#f0fdf4] to-white overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-10 right-0 w-80 h-80 bg-[#4ade80]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-0 w-80 h-80 bg-[#d4a843]/10 rounded-full blur-3xl" />
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block text-[#2d6a4f] font-semibold text-sm tracking-widest uppercase mb-4 font-[family-name:var(--font-body)]">
            Interactive Demo
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1a2e1a] leading-tight mb-6">
            Try the <span className="gradient-text">AI Advisor</span>
          </h2>
          <p className="text-[#6b7c6b] text-lg max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-body)]">
            Enter any African location to get an AI-powered deforestation risk assessment,
            native tree recommendations, and climate-smart land-use strategies.
          </p>
        </div>

        {/* Chat interface */}
        <div
          className="bg-white rounded-3xl border border-[#a7f3d0] overflow-hidden shadow-xl shadow-[#4ade80]/10 relative z-10"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#14532d] to-[#166534] px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
              🌿
            </div>
            <div>
              <h3 className="text-white font-bold font-[family-name:var(--font-display)]">KibiraAI Advisor</h3>
              <p className="text-white/70 text-xs font-[family-name:var(--font-body)]">AI-Powered Reforestation Intelligence</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/70 text-xs font-[family-name:var(--font-body)]">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-[#fafcf7]">
            {/* Welcome message */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center text-sm flex-shrink-0">
                🌿
              </div>
              <div className="bg-[#eef2e6] rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                <p className="text-sm text-[#1a2e1a] leading-relaxed font-[family-name:var(--font-body)]">
                  Welcome to <strong>KibiraAI</strong>! I&rsquo;m your AI-powered reforestation advisor.
                  Tell me a location in Africa and I&rsquo;ll provide:
                </p>
                <ul className="text-sm text-[#6b7c6b] mt-2 space-y-1 font-[family-name:var(--font-body)]">
                  <li>📊 Deforestation risk assessment</li>
                  <li>🌳 Native tree recommendations</li>
                  <li>🌍 Carbon sequestration estimates</li>
                  <li>🌾 Climate-smart farming strategies</li>
                </ul>
              </div>
            </div>

            {/* Quick options */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 ml-11">
                {quickOptions.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(option);
                      setTimeout(() => {
                        const form = document.getElementById("demo-form");
                        if (form) form.requestSubmit();
                      }, 100);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full border border-primary/20 text-[#2d6a4f] hover:bg-[#2d6a4f] hover:text-white transition-colors font-[family-name:var(--font-body)]"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.type === "user" && (
                  <div className="flex justify-end">
                    <div className="bg-[#2d6a4f] text-white rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%]">
                      <p className="text-sm font-[family-name:var(--font-body)]">{msg.text}</p>
                    </div>
                  </div>
                )}
                {msg.type === "ai" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center text-sm flex-shrink-0">
                      🌿
                    </div>
                    <div className="max-w-[90%]">
                      <AIResponse data={msg.data} />
                    </div>
                  </div>
                )}
                {msg.type === "ai-text" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center text-sm flex-shrink-0">
                      🌿
                    </div>
                    <div className="bg-[#eef2e6] rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                      <p className="text-sm text-[#1a2e1a] font-[family-name:var(--font-body)]">{msg.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center text-sm flex-shrink-0">
                  🌿
                </div>
                <TypingIndicator />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            id="demo-form"
            onSubmit={handleSubmit}
            className="p-4 border-t border-[#eef2e6] flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter a location in Africa (e.g., Uganda, Lagos, Congo Basin)..."
              className="flex-1 px-4 py-3 rounded-xl border border-[#eef2e6] bg-[#eef2e6]/50 text-[#1a2e1a] text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 transition-all font-[family-name:var(--font-body)]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#2d6a4f] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#1b4332] transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-[family-name:var(--font-body)]"
            >
              Analyze
            </button>
          </form>
        </div>

        <p className="text-center text-[#6b7c6b] text-xs mt-4 font-[family-name:var(--font-body)]">
          This demo uses a curated knowledge base. The full platform will integrate satellite imagery,
          real-time climate APIs, and advanced machine learning models.
        </p>
      </div>
    </section>
  );
}
