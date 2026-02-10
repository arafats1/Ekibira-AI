"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

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
};

function getRegionData(input) {
  const lower = input.toLowerCase();
  for (const [region, data] of Object.entries(REGION_DATA)) {
    if (lower.includes(region.replace(" africa", ""))) return { region, ...data };
  }
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
    if (lower.includes(place)) return { region, ...REGION_DATA[region] };
  }
  if (lower.includes("africa")) return { region: "east africa", ...REGION_DATA["east africa"] };
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
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white/60 backdrop-blur rounded-2xl rounded-bl-sm w-fit">
      <div className="w-2 h-2 rounded-full bg-[#2d6a4f]/50 typing-dot" />
      <div className="w-2 h-2 rounded-full bg-[#2d6a4f]/50 typing-dot" />
      <div className="w-2 h-2 rounded-full bg-[#2d6a4f]/50 typing-dot" />
    </div>
  );
}

function AIResponse({ data }) {
  const colors = getRiskColor(data.riskScore);
  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      {/* Risk Assessment */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-5 border border-[#a7f3d0]/40 shadow-sm">
        <h4 className="font-bold text-[#1a2e1a] mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base font-[family-name:var(--font-display)]">
          <span className="text-lg">📊</span> Deforestation Risk Assessment
        </h4>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${colors.bg} ${colors.text}`}>
            {data.riskLevel} Risk
          </div>
          <span className="text-[#6b7c6b] text-sm">Score: {data.riskScore}/100</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
          <div className={`h-full rounded-full ${colors.bar} transition-all duration-1000`} style={{ width: `${data.riskScore}%` }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">
          <div><span className="font-semibold text-[#1a2e1a]">Region:</span> {data.countries}</div>
          <div><span className="font-semibold text-[#1a2e1a]">Annual Loss:</span> {data.annualLoss}</div>
          <div className="sm:col-span-2"><span className="font-semibold text-[#1a2e1a]">Primary Drivers:</span> {data.primaryDrivers}</div>
        </div>
      </div>

      {/* Native Trees */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-5 border border-[#a7f3d0]/40 shadow-sm">
        <h4 className="font-bold text-[#1a2e1a] mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base font-[family-name:var(--font-display)]">
          <span className="text-lg">🌳</span> Recommended Native Trees
        </h4>
        <div className="space-y-2.5">
          {data.nativeTrees.map((tree, i) => (
            <div key={i} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-[#f0fdf4]/80 rounded-lg">
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
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-5 border border-[#a7f3d0]/40 shadow-sm">
        <h4 className="font-bold text-[#1a2e1a] mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base font-[family-name:var(--font-display)]">
          <span className="text-lg">🌍</span> Carbon Sequestration Potential
        </h4>
        <div className="bg-gradient-to-r from-[#f0fdf4] to-[#fefce8] rounded-lg p-3 sm:p-4 font-[family-name:var(--font-body)]">
          <div className="text-xl sm:text-2xl font-bold text-[#2d6a4f] font-[family-name:var(--font-display)]">{data.carbonPotential}</div>
          <p className="text-sm text-[#6b7c6b] mt-1">Estimated annual sequestration with recommended species</p>
          <div className="mt-3 text-sm">
            <span className="font-semibold text-[#1a2e1a]">Carbon Credit Value:</span>{" "}
            <span className="text-[#2d6a4f] font-semibold">{data.carbonCredits}</span>
          </div>
        </div>
      </div>

      {/* Farming Tips */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-5 border border-[#a7f3d0]/40 shadow-sm">
        <h4 className="font-bold text-[#1a2e1a] mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base font-[family-name:var(--font-display)]">
          <span className="text-lg">🌾</span> Climate-Smart Recommendations
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

export default function AdvisorPage() {
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
    { label: "Uganda", icon: "🏔️" },
    { label: "Ghana - West Africa", icon: "🌴" },
    { label: "Congo Basin", icon: "🌿" },
    { label: "South Africa", icon: "🦁" },
    { label: "Morocco & North Africa", icon: "🏜️" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full-page forest background */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1511497584788-876760111969?w=1920&q=80"
          alt="Forest canopy"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f13]/60 via-[#0a1f13]/40 to-[#0a1f13]/70" />
      </div>

      {/* Floating tree particles / decorative elements */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-[#4ade80]/8 rounded-full blur-3xl animate-float" />
        <div className="absolute top-[30%] right-[8%] w-48 h-48 bg-[#d4a843]/10 rounded-full blur-3xl animate-float delay-300" />
        <div className="absolute bottom-[15%] left-[15%] w-56 h-56 bg-[#2d6a4f]/10 rounded-full blur-3xl animate-float delay-500" />
        {/* Falling leaf SVGs */}
        <svg className="absolute top-[5%] left-[20%] w-6 h-6 text-[#4ade80]/30 animate-float" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
        </svg>
        <svg className="absolute top-[15%] right-[25%] w-5 h-5 text-[#a7f3d0]/25 animate-float delay-200" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
        </svg>
        <svg className="absolute bottom-[30%] right-[12%] w-7 h-7 text-[#4ade80]/20 animate-float delay-700" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
        </svg>
      </div>

      {/* Top navigation bar */}
      <nav className="relative z-20 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl sm:text-2xl">🌿</span>
            <span className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold text-white tracking-tight group-hover:text-[#4ade80] transition-colors">
              EkibiraAI
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2 text-white/70 hover:text-white text-xs sm:text-sm font-medium transition-colors font-[family-name:var(--font-body)]"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 px-3 sm:px-6 pb-8 sm:pb-12 pt-1 sm:pt-2">
        <div className="max-w-5xl mx-auto">
          {/* Hero header */}
          <div className="text-center mb-6 sm:mb-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 sm:px-5 py-1.5 sm:py-2 mb-4 sm:mb-6">
              <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse-soft" />
              <span className="text-white/90 text-xs sm:text-sm font-medium tracking-wide font-[family-name:var(--font-body)]">
                AI-Powered Reforestation Intelligence
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-3 sm:mb-4 drop-shadow-lg font-[family-name:var(--font-display)]">
              EkibiraAI <span className="text-[#4ade80]">Advisor</span>
            </h1>
            <p className="text-white/75 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-body)]">
              Enter any location in Africa to receive an AI-driven deforestation risk analysis,
              native tree recommendations, carbon sequestration estimates, and climate-smart strategies.
            </p>
          </div>

          {/* Region quick-select cards */}
          {messages.length === 0 && (
            <div className="animate-fade-in-up delay-200 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {quickOptions.map((option, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(option.label);
                    setTimeout(() => {
                      const form = document.getElementById("advisor-form");
                      if (form) form.requestSubmit();
                    }, 100);
                  }}
                  className={`group bg-white/10 backdrop-blur-md border border-white/15 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center hover:bg-white/20 hover:border-[#4ade80]/40 transition-all hover:scale-[1.03] active:scale-[0.98] ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}`}
                >
                  <span className="text-xl sm:text-2xl block mb-1 sm:mb-2 group-hover:scale-110 transition-transform">{option.icon}</span>
                  <span className="text-white/90 text-[10px] sm:text-xs font-medium font-[family-name:var(--font-body)] leading-tight">{option.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Chat container */}
          <div className="animate-fade-in-up delay-300 bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/15 overflow-hidden shadow-2xl shadow-black/20">
            {/* Chat header */}
            <div className="bg-gradient-to-r from-[#14532d]/90 to-[#166534]/90 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 border-b border-white/10">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#4ade80]/20 flex items-center justify-center text-lg sm:text-xl border border-[#4ade80]/30">
                🌿
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold font-[family-name:var(--font-display)] text-base sm:text-lg">EkibiraAI Advisor</h3>
                <p className="text-[#a7f3d0]/80 text-[10px] sm:text-xs font-[family-name:var(--font-body)] truncate">Smart Reforestation Intelligence</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                <span className="text-white/80 text-xs font-[family-name:var(--font-body)]">Online</span>
              </div>
            </div>

            {/* Messages area */}
            <div className="h-[360px] sm:h-[420px] md:h-[520px] overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-gradient-to-b from-[#f0fdf4]/95 to-[#fafcf7]/95 backdrop-blur-sm">
              {/* Welcome message */}
              <div className="flex gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center text-xs sm:text-sm flex-shrink-0 border border-[#2d6a4f]/20">
                  🌿
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl rounded-bl-sm px-3 sm:px-5 py-3 sm:py-4 max-w-[88%] sm:max-w-[85%] border border-[#a7f3d0]/30 shadow-sm">
                  <p className="text-xs sm:text-sm text-[#1a2e1a] leading-relaxed font-[family-name:var(--font-body)]">
                    Welcome to <strong className="text-[#2d6a4f]">EkibiraAI</strong>! I&rsquo;m your AI-powered reforestation advisor.
                    Tell me a location in Africa and I&rsquo;ll provide a comprehensive analysis:
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { icon: "📊", label: "Risk Assessment" },
                      { icon: "🌳", label: "Native Trees" },
                      { icon: "🌍", label: "Carbon Estimates" },
                      { icon: "🌾", label: "Smart Strategies" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#f0fdf4] rounded-lg px-3 py-2">
                        <span>{item.icon}</span>
                        <span className="text-xs text-[#2d6a4f] font-medium font-[family-name:var(--font-body)]">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat messages */}
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.type === "user" && (
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] text-white rounded-2xl rounded-br-sm px-3 sm:px-5 py-2 sm:py-3 max-w-[88%] sm:max-w-[85%] shadow-md">
                        <p className="text-xs sm:text-sm font-[family-name:var(--font-body)]">{msg.text}</p>
                      </div>
                    </div>
                  )}
                  {msg.type === "ai" && (
                    <div className="flex gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center text-xs sm:text-sm flex-shrink-0 border border-[#2d6a4f]/20">
                        🌿
                      </div>
                      <div className="max-w-[92%] sm:max-w-[90%]">
                        <AIResponse data={msg.data} />
                      </div>
                    </div>
                  )}
                  {msg.type === "ai-text" && (
                    <div className="flex gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center text-xs sm:text-sm flex-shrink-0 border border-[#2d6a4f]/20">
                        🌿
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl rounded-bl-sm px-3 sm:px-5 py-2 sm:py-3 max-w-[88%] sm:max-w-[85%] border border-[#a7f3d0]/30 shadow-sm">
                        <p className="text-xs sm:text-sm text-[#1a2e1a] font-[family-name:var(--font-body)]">{msg.text}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center text-xs sm:text-sm flex-shrink-0 border border-[#2d6a4f]/20">
                    🌿
                  </div>
                  <TypingIndicator />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form
              id="advisor-form"
              onSubmit={handleSubmit}
              className="p-2.5 sm:p-4 bg-white/90 backdrop-blur-sm border-t border-[#a7f3d0]/30 flex gap-2 sm:gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter a location (e.g., Uganda, Lagos)..."
                className="flex-1 min-w-0 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl border border-[#a7f3d0]/40 bg-[#f0fdf4]/50 text-[#1a2e1a] text-xs sm:text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 transition-all font-[family-name:var(--font-body)] placeholder:text-[#6b7c6b]/60"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] text-white px-4 sm:px-7 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm hover:from-[#1b4332] hover:to-[#14532d] transition-all disabled:opacity-40 disabled:cursor-not-allowed font-[family-name:var(--font-body)] shadow-md hover:shadow-lg flex-shrink-0"
              >
                Analyze
              </button>
            </form>
          </div>

          {/* Bottom info bar */}
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-1 sm:px-2">
            <p className="text-white/50 text-[10px] sm:text-xs font-[family-name:var(--font-body)] text-center sm:text-left">
              This demo uses a curated knowledge base. The full platform integrates satellite imagery,
              real-time climate APIs, and advanced ML models.
            </p>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {["Satellite AI", "Carbon Tracking", "5 Regions"].map((tag, i) => (
                <span key={i} className="text-[#4ade80]/70 text-[10px] sm:text-xs font-medium border border-[#4ade80]/20 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 font-[family-name:var(--font-body)]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
