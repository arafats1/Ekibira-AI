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
    <div className="flex items-center gap-1.5 py-2">
      <div className="w-2 h-2 rounded-full bg-[#2d6a4f]/40 typing-dot" />
      <div className="w-2 h-2 rounded-full bg-[#2d6a4f]/40 typing-dot" />
      <div className="w-2 h-2 rounded-full bg-[#2d6a4f]/40 typing-dot" />
    </div>
  );
}

function AIResponse({ data }) {
  const colors = getRiskColor(data.riskScore);
  const isUrban = data.region === "urban resilience";

  return (
    <div className="space-y-4 animate-fade-in font-[family-name:var(--font-body)]">
      {/* Risk Assessment */}
      <div>
        <h4 className="font-bold text-[#1a2e1a] mb-3 flex items-center gap-2 text-base font-[family-name:var(--font-display)]">
          📊 {isUrban ? "Urban Climate Risk Assessment" : "Deforestation Risk Assessment"}
        </h4>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${colors.bg} ${colors.text}`}>
            {data.riskLevel} Risk
          </div>
          <span className="text-[#6b7c6b] text-sm">Score: {data.riskScore}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div className={`h-full rounded-full ${colors.bar} transition-all duration-1000`} style={{ width: `${data.riskScore}%` }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-[#5d6f5d]">
          <div><span className="font-semibold text-[#1a2e1a]">Location:</span> {data.countries}</div>
          <div><span className="font-semibold text-[#1a2e1a]">{isUrban ? "Vulnerability:" : "Annual Loss:"}</span> {data.annualLoss}</div>
          <div className="sm:col-span-2"><span className="font-semibold text-[#1a2e1a]">Primary Drivers:</span> {data.primaryDrivers}</div>
        </div>
      </div>

      <hr className="border-[#e5e7eb]" />

      {/* Native Trees */}
      <div>
        <h4 className="font-bold text-[#1a2e1a] mb-3 flex items-center gap-2 text-base font-[family-name:var(--font-display)]">
          🌳 {isUrban ? "Trees for Urban Cooling & Resilience" : "Recommended Native Trees"}
        </h4>
        <div className="space-y-1">
          {data.nativeTrees.map((tree, i) => (
            <div key={i} className="flex items-start gap-3 py-2">
              <span className="text-[#2d6a4f] font-bold text-sm mt-0.5 w-5 text-right flex-shrink-0">{i + 1}.</span>
              <div>
                <span className="font-semibold text-[#1a2e1a] text-sm">{tree.name}</span>
                <p className="text-[#6b7c6b] text-sm mt-0.5">{tree.use}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-[#e5e7eb]" />

      {/* Carbon Potential */}
      <div>
        <h4 className="font-bold text-[#1a2e1a] mb-3 flex items-center gap-2 text-base font-[family-name:var(--font-display)]">
          🌍 {isUrban ? "Urban Carbon Value" : "Carbon Sequestration Potential"}
        </h4>
        <div className="bg-[#f0fdf4] rounded-xl p-4 border border-[#dcfce7]">
          <div className="text-2xl font-bold text-[#2d6a4f] font-[family-name:var(--font-display)]">{data.carbonPotential}</div>
          <p className="text-sm text-[#6b7c6b] mt-1">Estimated annual sequestration with recommended species</p>
          <div className="mt-3 text-sm">
            <span className="font-semibold text-[#1a2e1a]">{isUrban ? "Social Impact Credit Value:" : "Carbon Credit Value:"}</span>{" "}
            <span className="text-[#2d6a4f] font-semibold">{data.carbonCredits}</span>
          </div>
        </div>
      </div>

      <hr className="border-[#e5e7eb]" />

      {/* Farming Tips */}
      <div>
        <h4 className="font-bold text-[#1a2e1a] mb-3 flex items-center gap-2 text-base font-[family-name:var(--font-display)]">
          🌾 {isUrban ? "Climate Resilience Services" : "Climate-Smart Recommendations"}
        </h4>
        <ul className="space-y-2">
          {data.farmingTips.map((tip, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="text-[#2d6a4f] mt-1 flex-shrink-0">•</span>
              <span className="text-[#374151] leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AdvisorPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setSidebarOpen(false);
  };

  const sidebarRegions = [
    { label: "Urban Centers", icon: "🏙️", query: "Urban Centers (Flood & Heat Risk)" },
    { label: "East Africa", icon: "🏔️", query: "Uganda" },
    { label: "West Africa", icon: "🌴", query: "Ghana - West Africa" },
    { label: "Central Africa", icon: "🌿", query: "Congo Basin" },
    { label: "Southern Africa", icon: "🦁", query: "South Africa" },
    { label: "North Africa", icon: "🏜️", query: "Morocco" },
  ];

  return (
    <div className="h-screen flex bg-[#f7faf6] overflow-hidden">

      {/* ── Sidebar ── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed md:relative z-50 md:z-auto flex flex-col w-[260px] h-full bg-[#0f2618] text-white transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Sidebar header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-lg">🌿</span>
            <span className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight group-hover:text-[#4ade80] transition-colors">
              KibiraAI
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 hover:bg-white/10 rounded-lg">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {/* New chat button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 hover:bg-white/10 transition-colors text-sm font-[family-name:var(--font-body)]"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Analysis
          </button>
        </div>

        {/* Quick regions */}
        <div className="px-3 mb-2">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold px-2 mb-2 font-[family-name:var(--font-body)]">
            Quick Analyze
          </p>
          <div className="space-y-0.5">
            {sidebarRegions.map((region, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(region.query);
                  setSidebarOpen(false);
                  setTimeout(() => {
                    const form = document.getElementById("advisor-form");
                    if (form) form.requestSubmit();
                  }, 100);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/8 transition-colors text-left group"
              >
                <span className="text-sm">{region.icon}</span>
                <span className="text-sm text-white/70 group-hover:text-white/90 font-[family-name:var(--font-body)] truncate">{region.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sidebar footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/8 transition-colors text-sm text-white/60 hover:text-white/90 font-[family-name:var(--font-body)]"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
            </svg>
            Back to Home
          </Link>
          <div className="flex items-center gap-2 px-3 py-2 text-[10px] text-white/30 font-[family-name:var(--font-body)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
            Powered by KibiraAI
          </div>
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[#e5e7eb] bg-white/80 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 -ml-1 hover:bg-[#f0fdf4] rounded-lg transition-colors"
          >
            <svg width="20" height="20" fill="none" stroke="#1a2e1a" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <h1 className="text-base font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">KibiraAI Advisor</h1>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
            <span className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Online</span>
          </div>
        </header>

        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center pt-8 sm:pt-16 pb-8 animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-[#2d6a4f] flex items-center justify-center text-2xl mb-6 shadow-lg shadow-[#2d6a4f]/20">
                  🌿
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">
                  How can I help you today?
                </h2>
                <p className="text-[#6b7c6b] text-sm sm:text-base text-center max-w-md mb-8 font-[family-name:var(--font-body)]">
                  Enter any location in Africa to receive AI-driven analysis for reforestation strategies or urban climate resilience services.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {[
                    { icon: "🏙️", title: "Urban Heat & Floods", desc: "Analyze climate risks in African cities", query: "Urban Centers (Flood & Heat Risk)" },
                    { icon: "🌳", title: "Forest Intelligence", desc: "Deforestation risk & reforestation plans", query: "Uganda" },
                    { icon: "🌍", title: "Carbon Potential", desc: "Sequestration estimates & credit value", query: "Congo Basin" },
                    { icon: "🌾", title: "Climate Services", desc: "Smart farming & resilience strategies", query: "Ghana - West Africa" },
                  ].map((card, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(card.query);
                        setTimeout(() => {
                          const form = document.getElementById("advisor-form");
                          if (form) form.requestSubmit();
                        }, 100);
                      }}
                      className="text-left p-4 rounded-xl border border-[#dce9dc] hover:border-[#4ade80]/50 bg-white hover:bg-[#f0fdf4] transition-all group"
                    >
                      <span className="text-lg">{card.icon}</span>
                      <p className="text-sm font-semibold text-[#1a2e1a] mt-2 font-[family-name:var(--font-display)]">{card.title}</p>
                      <p className="text-xs text-[#6b7c6b] mt-0.5 font-[family-name:var(--font-body)]">{card.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg, i) => (
              <div key={i}>
                {/* User message */}
                {msg.type === "user" && (
                  <div className="flex gap-4 justify-end">
                    <div className="bg-[#2d6a4f] text-white rounded-2xl rounded-br-sm px-5 py-3 max-w-[80%] shadow-sm">
                      <p className="text-sm leading-relaxed font-[family-name:var(--font-body)]">{msg.text}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#1a2e1a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 font-[family-name:var(--font-body)]">
                      You
                    </div>
                  </div>
                )}
                {/* AI data response */}
                {msg.type === "ai" && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#2d6a4f] flex items-center justify-center text-sm flex-shrink-0 shadow-sm">
                      🌿
                    </div>
                    <div className="flex-1 min-w-0">
                      <AIResponse data={msg.data} />
                    </div>
                  </div>
                )}
                {/* AI text response */}
                {msg.type === "ai-text" && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#2d6a4f] flex items-center justify-center text-sm flex-shrink-0 shadow-sm">
                      🌿
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#374151] leading-relaxed font-[family-name:var(--font-body)]">{msg.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#2d6a4f] flex items-center justify-center text-sm flex-shrink-0 shadow-sm">
                  🌿
                </div>
                <TypingIndicator />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area — pinned bottom */}
        <div className="flex-shrink-0 border-t border-[#e5e7eb] bg-white/80 backdrop-blur-sm px-4 py-3 sm:py-4">
          <form
            id="advisor-form"
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto flex items-center gap-3 bg-white border border-[#d1d5db] rounded-2xl px-4 py-2 focus-within:border-[#2d6a4f] focus-within:ring-2 focus-within:ring-[#2d6a4f]/15 transition-all shadow-sm"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter a location (e.g., Uganda, Kampala, Lagos)..."
              className="flex-1 min-w-0 py-2 text-sm text-[#1a2e1a] focus:outline-none bg-transparent font-[family-name:var(--font-body)] placeholder:text-[#9ca3af]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
          <p className="text-center text-[10px] text-[#9ca3af] mt-2 font-[family-name:var(--font-body)]">
            KibiraAI uses a curated knowledge base. The full platform integrates satellite imagery, real-time climate APIs, and advanced ML models.
          </p>
        </div>
      </div>
    </div>
  );
}
