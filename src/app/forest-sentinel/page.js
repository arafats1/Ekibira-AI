"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// ─── Uganda's at-risk forests with real data ───
const FORESTS = [
  {
    id: "mabira",
    name: "Mabira Central Forest Reserve",
    region: "Buikwe / Mukono",
    lat: 0.4050,
    lng: 33.0080,
    area: "29,964 ha",
    status: "Gazetted Reserve — under threat",
    biodiversityScore: 88,
    threatLevel: 82,
    carbonStock: "4.2M tonnes CO₂",
    annualLoss: "~312 ha/year",
    keyThreats: [
      "Sugar cane plantation encroachment (Mehta Group controversy)",
      "Illegal charcoal burning — primary livelihood for surrounding communities",
      "Timber poaching of Mvule (Milicia excelsa) and Mahogany",
      "Settlement expansion from Lugazi and Jinja corridor",
    ],
    keySpecies: ["Grey-cheeked mangabey", "Red-tailed monkey", "African grey parrot", "312 bird species"],
    sensorZones: [
      { name: "Najjembe Edge (South)", lat: 0.3950, lng: 33.0020, riskScore: 91, description: "Primary charcoal entry point, adjacent to settlements" },
      { name: "Nagojje Corridor (West)", lat: 0.4100, lng: 32.9900, riskScore: 78, description: "Timber extraction route near Lugazi" },
      { name: "Musamya Buffer (North)", lat: 0.4200, lng: 33.0150, riskScore: 85, description: "Agricultural encroachment zone" },
      { name: "Interior Core", lat: 0.4080, lng: 33.0100, riskScore: 45, description: "Deep forest — lower access but high-value timber" },
    ],
  },
  {
    id: "bugoma",
    name: "Bugoma Central Forest Reserve",
    region: "Hoima / Kikuube",
    lat: 1.2200,
    lng: 31.0500,
    area: "41,144 ha",
    status: "Critically threatened — sugar cane leasing controversy",
    biodiversityScore: 92,
    threatLevel: 95,
    carbonStock: "6.8M tonnes CO₂",
    annualLoss: "~890 ha/year (accelerating)",
    keyThreats: [
      "Hoima Sugar Ltd lease — 9,000+ ha allocated for sugar cane",
      "Illegal logging for timber and charcoal",
      "Oil exploration in Albertine Graben region",
      "Community encroachment due to population pressure",
    ],
    keySpecies: ["Eastern chimpanzee (~600 individuals)", "L'Hoest's monkey", "Uganda mangabey", "225 bird species"],
    sensorZones: [
      { name: "Sugar Lease Boundary (South)", lat: 1.2050, lng: 31.0400, riskScore: 97, description: "Active deforestation for sugar cane — highest priority" },
      { name: "Kabwoya Corridor (West)", lat: 1.2250, lng: 31.0300, riskScore: 88, description: "Logging route toward Lake Albert" },
      { name: "Kyangwali Border (North)", lat: 1.2400, lng: 31.0550, riskScore: 72, description: "Refugee settlement pressure zone" },
      { name: "Chimp Habitat Core", lat: 1.2200, lng: 31.0550, riskScore: 55, description: "Critical primate corridor — must protect" },
    ],
  },
  {
    id: "bwindi",
    name: "Bwindi Impenetrable Forest (Buffer Zone)",
    region: "Kanungu / Kisoro",
    lat: -0.9910,
    lng: 29.6160,
    area: "32,092 ha (park) + buffer zones",
    status: "UNESCO World Heritage — buffer under pressure",
    biodiversityScore: 97,
    threatLevel: 58,
    carbonStock: "5.5M tonnes CO₂",
    annualLoss: "~85 ha/year (buffer zone only)",
    keyThreats: [
      "Buffer zone encroachment by subsistence farmers",
      "Illegal pole cutting for construction",
      "Bamboo harvesting beyond sustainable limits",
      "Human-wildlife conflict driving retaliatory clearing",
    ],
    keySpecies: ["Mountain gorilla (~459 individuals — half of world population)", "African golden cat", "Grauer's broadbill", "350+ bird species"],
    sensorZones: [
      { name: "Nkuringo Buffer (South)", lat: -1.0050, lng: 29.6100, riskScore: 68, description: "High human-forest interaction zone" },
      { name: "Ruhija Edge (East)", lat: -0.9850, lng: 29.6300, riskScore: 62, description: "Bamboo harvesting and pole cutting area" },
      { name: "Buhoma Perimeter (North)", lat: -0.9780, lng: 29.6120, riskScore: 52, description: "Tourism buffer — moderate risk" },
      { name: "Gorilla Corridor Core", lat: -0.9900, lng: 29.6180, riskScore: 30, description: "Protected core — patrol-intensive" },
    ],
  },
  {
    id: "kibale",
    name: "Kibale National Park (Edges)",
    region: "Kabarole / Kamwenge",
    lat: 0.4930,
    lng: 30.3600,
    area: "79,500 ha",
    status: "National Park — edges under pressure",
    biodiversityScore: 94,
    threatLevel: 65,
    carbonStock: "8.1M tonnes CO₂",
    annualLoss: "~140 ha/year (edge zones)",
    keyThreats: [
      "Tea plantation expansion on forest edges",
      "Illegal pit-sawing of hardwoods",
      "Charcoal production in buffer communities",
      "Snare-setting affecting primates",
    ],
    keySpecies: ["Chimpanzee (~1,500 — largest population in Uganda)", "Red colobus monkey", "L'Hoest's monkey", "375 bird species"],
    sensorZones: [
      { name: "Bigodi Wetland Edge", lat: 0.4800, lng: 30.3500, riskScore: 72, description: "Community interface — charcoal and timber" },
      { name: "Sebitoli Corridor (North)", lat: 0.5100, lng: 30.3650, riskScore: 78, description: "Tea estate boundary — active encroachment" },
      { name: "Kanyanchu Core", lat: 0.4950, lng: 30.3620, riskScore: 35, description: "Research station area — well patrolled" },
      { name: "Kanyawara Buffer", lat: 0.5050, lng: 30.3580, riskScore: 58, description: "Research edge — moderate risk" },
    ],
  },
];

// ─── Sound classification categories ───
const SOUND_CLASSES = [
  { id: "chainsaw", label: "Chainsaw", icon: "🪚", threat: true, color: "red", description: "Motorized chain saw — indicates active tree felling" },
  { id: "axe", label: "Axe / Panga", icon: "🪓", threat: true, color: "orange", description: "Rhythmic chopping — manual tree cutting or branch removal" },
  { id: "vehicle", label: "Vehicle / Truck", icon: "🚛", threat: true, color: "amber", description: "Engine noise near forest edge — possible timber transport" },
  { id: "gunshot", label: "Gunshot", icon: "💥", threat: true, color: "red", description: "Potential poaching activity" },
  { id: "birds", label: "Bird Song", icon: "🐦", threat: false, color: "green", description: "Normal forest bird activity — healthy ecosystem indicator" },
  { id: "rain", label: "Rain / Thunder", icon: "🌧️", threat: false, color: "blue", description: "Weather event — no threat detected" },
  { id: "insects", label: "Insects / Cicadas", icon: "🦗", threat: false, color: "green", description: "Normal ambient forest sound" },
  { id: "primates", label: "Primate Calls", icon: "🐒", threat: false, color: "green", description: "Monkey/ape vocalizations — biodiversity indicator" },
  { id: "wind", label: "Wind / Leaves", icon: "🍃", threat: false, color: "green", description: "Environmental background — no threat" },
];

// ─── Simulated detection event generator ───
function generateDetectionEvent(forest, zone) {
  const threatSounds = SOUND_CLASSES.filter((s) => s.threat);
  const safeSounds = SOUND_CLASSES.filter((s) => !s.threat);

  // Higher risk zones more likely to produce threats
  const isThreat = Math.random() * 100 < zone.riskScore;
  const sound = isThreat
    ? threatSounds[Math.floor(Math.random() * threatSounds.length)]
    : safeSounds[Math.floor(Math.random() * safeSounds.length)];

  const confidence = isThreat
    ? 78 + Math.floor(Math.random() * 20) // 78-97%
    : 85 + Math.floor(Math.random() * 14); // 85-99%

  const now = new Date();
  const minutesAgo = Math.floor(Math.random() * 120);
  const eventTime = new Date(now.getTime() - minutesAgo * 60000);

  return {
    id: `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    forestId: forest.id,
    forestName: forest.name,
    zoneName: zone.name,
    zoneDescription: zone.description,
    lat: zone.lat + (Math.random() - 0.5) * 0.005,
    lng: zone.lng + (Math.random() - 0.5) * 0.005,
    soundClass: sound,
    confidence,
    isThreat: sound.threat,
    timestamp: eventTime.toISOString(),
    timeAgo: minutesAgo < 1 ? "Just now" : minutesAgo < 60 ? `${minutesAgo}m ago` : `${Math.floor(minutesAgo / 60)}h ${minutesAgo % 60}m ago`,
    audioDbLevel: 55 + Math.floor(Math.random() * 35),
    sensorId: `SEN-${zone.name.split(" ")[0].toUpperCase().slice(0, 3)}-${Math.floor(Math.random() * 20) + 1}`,
    alertSent: sound.threat && confidence > 85,
  };
}

// ─── Risk Badge Component ───
function RiskBadge({ score }) {
  const config =
    score >= 80 ? { bg: "bg-red-100", text: "text-red-700", label: "Critical" }
    : score >= 60 ? { bg: "bg-orange-100", text: "text-orange-700", label: "High" }
    : score >= 40 ? { bg: "bg-yellow-100", text: "text-yellow-700", label: "Moderate" }
    : { bg: "bg-green-100", text: "text-green-700", label: "Low" };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
      {score >= 80 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
      {config.label} ({score})
    </span>
  );
}

// ─── Audio Waveform Visualizer ───
function AudioWaveform({ active, threat }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const barCount = 60;
      const barWidth = w / barCount - 1;
      const color = threat ? "#ef4444" : active ? "#f59e0b" : "#22c55e";

      for (let i = 0; i < barCount; i++) {
        const amplitude = active
          ? Math.sin((i + offset) * 0.3) * (h * 0.35) + Math.random() * (h * 0.15)
          : Math.sin(i * 0.2) * 4 + 5;
        const barHeight = Math.abs(amplitude);
        const y = (h - barHeight) / 2;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6 + Math.sin((i + offset) * 0.2) * 0.3;
        ctx.fillRect(i * (barWidth + 1), y, barWidth, barHeight);
      }
      ctx.globalAlpha = 1;
      offset += active ? 0.8 : 0.1;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active, threat]);

  return <canvas ref={canvasRef} width={360} height={60} className="w-full h-[60px] rounded-lg" />;
}

// ─── Main Page ───
export default function ForestSentinelPage() {
  const [selectedForest, setSelectedForest] = useState(FORESTS[0]);
  const [selectedZone, setSelectedZone] = useState(FORESTS[0].sensorZones[0]);
  const [events, setEvents] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [liveDetection, setLiveDetection] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [simRunning, setSimRunning] = useState(false);
  const intervalRef = useRef(null);

  // Reset on forest change
  useEffect(() => {
    setSelectedZone(selectedForest.sensorZones[0]);
    setEvents([]);
    setLiveDetection(null);
    setIsListening(false);
    setSimRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [selectedForest]);

  // Generate initial events for dashboard
  useEffect(() => {
    const initialEvents = [];
    selectedForest.sensorZones.forEach((zone) => {
      for (let i = 0; i < 3; i++) {
        initialEvents.push(generateDetectionEvent(selectedForest, zone));
      }
    });
    initialEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setEvents(initialEvents);
    setTotalAlerts(initialEvents.filter((e) => e.isThreat).length);
  }, [selectedForest]);

  // Simulate live listening
  const startListening = useCallback(() => {
    setIsListening(true);
    setSimRunning(true);
    setLiveDetection(null);

    // Simulate audio processing delay, then classification
    const classifyInterval = setInterval(() => {
      const newEvent = generateDetectionEvent(selectedForest, selectedZone);
      setLiveDetection(newEvent);
      setEvents((prev) => [newEvent, ...prev].slice(0, 50));
      if (newEvent.isThreat) {
        setTotalAlerts((prev) => prev + 1);
      }
    }, 4000);

    intervalRef.current = classifyInterval;
  }, [selectedForest, selectedZone]);

  const stopListening = () => {
    setIsListening(false);
    setSimRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const threatEvents = events.filter((e) => e.isThreat);
  const safeEvents = events.filter((e) => !e.isThreat);

  // ─── Download helpers ───
  const downloadCSV = (data, filename) => {
    const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadEventLog = () => {
    const headers = "Timestamp,Forest,Zone,Sound,Threat,Confidence,Sensor,dB Level,Alert Sent,Latitude,Longitude\n";
    const rows = events.map((e) =>
      `"${e.timestamp}","${e.forestName}","${e.zoneName}","${e.soundClass.label}",${e.isThreat},${e.confidence}%,"${e.sensorId}",${e.audioDbLevel},${e.alertSent},${e.lat.toFixed(6)},${e.lng.toFixed(6)}`
    ).join("\n");
    downloadCSV(headers + rows, `kibira-sentinel-events-${selectedForest.id}-${new Date().toISOString().slice(0,10)}.csv`);
  };

  const downloadForestReport = () => {
    const report = [
      "Forest,Region,Area,Threat Level,Carbon Stock,Annual Loss,Biodiversity Score",
      ...FORESTS.map((f) =>
        `"${f.name}","${f.region}","${f.area}",${f.threatLevel},"${f.carbonStock}","${f.annualLoss}",${f.biodiversityScore}`
      ),
      "",
      "Zone,Forest,Risk Score,Latitude,Longitude,Description",
      ...FORESTS.flatMap((f) =>
        f.sensorZones.map((z) =>
          `"${z.name}","${f.name}",${z.riskScore},${z.lat},${z.lng},"${z.description}"`
        )
      ),
    ].join("\n");
    downloadCSV(report, `kibira-sentinel-forest-report-${new Date().toISOString().slice(0,10)}.csv`);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f2]">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a2e1a]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🌿</span>
              <span className="font-[family-name:var(--font-display)] text-xl font-bold text-white tracking-tight">KibiraAI</span>
            </Link>
            <span className="text-white/30">|</span>
            <span className="text-[#4ade80] text-sm font-semibold font-[family-name:var(--font-body)]">Forest Sentinel</span>
            {simRunning && (
              <span className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
            <Link href="/solution" className="hover:text-white transition-colors">← Back to Solutions</Link>
            <Link href="/urban-warning" className="hover:text-white transition-colors">Urban Warning</Link>
            <Link href="/plant-a-tree" className="hover:text-white transition-colors">🌱 Plant a Tree</Link>
            <Link href="/advisor" className="hover:text-white transition-colors">AI Advisor</Link>
            <Link href="/" className="bg-[#4ade80] text-[#0a1f13] px-5 py-2 rounded-full hover:bg-[#22c55e] transition-colors font-semibold text-sm">
              Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20 sm:pt-24 pb-20">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#1a2e1a] to-[#0a1f13] py-12 sm:py-16 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-8 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse-soft" />
                  <span className="text-[#4ade80] text-xs font-semibold tracking-widest uppercase font-[family-name:var(--font-body)]">
                    Real-Time Forest Protection
                  </span>
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 font-[family-name:var(--font-display)]">
                  AI Forest Acoustic
                  <br />
                  <span className="text-[#4ade80]">Sentinel</span>
                </h1>
                <p className="text-white/70 text-lg max-w-xl font-[family-name:var(--font-body)]">
                  IoT sound sensors powered by neural networks detect illegal logging across Uganda&apos;s critical forests in real-time. Select a forest below to monitor sensor zones, view detection events, and simulate live listening.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-[#4ade80] font-[family-name:var(--font-display)]">4</p>
                  <p className="text-white/50 text-[10px] sm:text-xs mt-1 font-[family-name:var(--font-body)]">Forests Monitored</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-amber-400 font-[family-name:var(--font-display)]">16</p>
                  <p className="text-white/50 text-[10px] sm:text-xs mt-1 font-[family-name:var(--font-body)]">Sensor Zones</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-red-400 font-[family-name:var(--font-display)]">{totalAlerts}</p>
                  <p className="text-white/50 text-[10px] sm:text-xs mt-1 font-[family-name:var(--font-body)]">Threats Detected</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Forest Selector */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-500 mb-3 font-[family-name:var(--font-body)]">SELECT FOREST</p>
            <div className="flex flex-wrap gap-2">
              {FORESTS.map((forest) => {
                const isActive = selectedForest.id === forest.id;
                const dotColor = forest.threatLevel >= 80 ? "bg-red-500" : forest.threatLevel >= 60 ? "bg-orange-500" : "bg-yellow-500";
                return (
                  <button
                    key={forest.id}
                    onClick={() => setSelectedForest(forest)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all font-[family-name:var(--font-body)]
                      ${isActive
                        ? "bg-[#1a2e1a] text-white shadow-lg shadow-[#1a2e1a]/30"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-[#2d6a4f]/30 hover:shadow-sm"
                      }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-[#4ade80]" : dotColor} ${forest.threatLevel >= 80 ? "animate-pulse" : ""}`} />
                    {forest.name.split("(")[0].replace("Central Forest Reserve", "").replace("National Park", "").trim()}
                    <span className={`text-xs ${isActive ? "text-white/60" : "text-gray-400"}`}>{forest.region.split("/")[0].trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
            {[
              { key: "dashboard", label: "Dashboard", icon: "📊" },
              { key: "listen", label: "Live Detection", icon: "🎙️" },
              { key: "events", label: "Event Log", icon: "📋" },
              { key: "sensors", label: "Sensor Map", icon: "📍" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all font-[family-name:var(--font-body)] whitespace-nowrap flex-shrink-0
                  ${activeTab === tab.key ? "bg-white text-[#1a2e1a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ═══ TAB: DASHBOARD ═══ */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fade-in">
              {/* Download bar */}
              <div className="flex justify-end">
                <button
                  onClick={downloadForestReport}
                  className="text-xs bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full font-semibold hover:bg-gray-50 transition-colors font-[family-name:var(--font-body)] flex items-center gap-1.5 shadow-sm"
                >
                  📥 Download Forest Report (CSV)
                </button>
              </div>
              {/* Forest overview cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2 font-[family-name:var(--font-body)]">Forest Area</p>
                  <p className="text-2xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{selectedForest.area}</p>
                  <p className="text-xs text-gray-500 mt-1 font-[family-name:var(--font-body)]">{selectedForest.region}</p>
                </div>
                <div className={`rounded-2xl p-5 border shadow-sm ${selectedForest.threatLevel >= 80 ? "bg-red-50 border-red-100" : "bg-orange-50 border-orange-100"}`}>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2 font-[family-name:var(--font-body)]">Threat Level</p>
                  <div className="flex items-center gap-3">
                    <p className={`text-2xl font-bold font-[family-name:var(--font-display)] ${selectedForest.threatLevel >= 80 ? "text-red-600" : "text-orange-600"}`}>
                      {selectedForest.threatLevel}/100
                    </p>
                    <RiskBadge score={selectedForest.threatLevel} />
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2 font-[family-name:var(--font-body)]">Carbon Stock</p>
                  <p className="text-2xl font-bold text-emerald-700 font-[family-name:var(--font-display)]">{selectedForest.carbonStock}</p>
                  <p className="text-xs text-emerald-600 mt-1 font-[family-name:var(--font-body)]">At risk of release</p>
                </div>
                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2 font-[family-name:var(--font-body)]">Annual Loss</p>
                  <p className="text-2xl font-bold text-amber-700 font-[family-name:var(--font-display)]">{selectedForest.annualLoss}</p>
                  <p className="text-xs text-amber-600 mt-1 font-[family-name:var(--font-body)]">Without sentinel intervention</p>
                </div>
              </div>

              {/* Threats + Sensor zones */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Key threats */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <p className="text-sm font-bold text-gray-800 mb-4 font-[family-name:var(--font-display)]">⚠️ Key Threats — {selectedForest.name.split("(")[0].trim()}</p>
                  <div className="space-y-3">
                    {selectedForest.keyThreats.map((threat, i) => (
                      <div key={i} className="flex items-start gap-3 bg-red-50/50 rounded-xl p-3 border border-red-100/50">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                        <p className="text-sm text-gray-700 font-[family-name:var(--font-body)]">{threat}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2 font-[family-name:var(--font-body)]">🐾 Key Species Protected</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedForest.keySpecies.map((sp, i) => (
                        <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-semibold border border-emerald-100 font-[family-name:var(--font-body)]">{sp}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sensor zones */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <p className="text-sm font-bold text-gray-800 mb-4 font-[family-name:var(--font-display)]">📍 Sensor Zones</p>
                  <div className="space-y-3">
                    {selectedForest.sensorZones.map((zone, i) => {
                      const isSelected = selectedZone.name === zone.name;
                      return (
                        <button
                          key={i}
                          onClick={() => { setSelectedZone(zone); setActiveTab("listen"); }}
                          className={`w-full text-left rounded-xl p-4 border transition-all
                            ${isSelected ? "bg-[#1a2e1a] text-white border-[#1a2e1a]" : "bg-gray-50 border-gray-100 hover:border-[#2d6a4f]/30 hover:shadow-sm"}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-bold font-[family-name:var(--font-display)] ${isSelected ? "text-white" : "text-gray-800"}`}>{zone.name}</p>
                            <RiskBadge score={zone.riskScore} />
                          </div>
                          <p className={`text-xs font-[family-name:var(--font-body)] ${isSelected ? "text-white/60" : "text-gray-500"}`}>{zone.description}</p>
                          <p className={`text-[10px] mt-1 font-[family-name:var(--font-body)] ${isSelected ? "text-white/40" : "text-gray-400"}`}>
                            {zone.lat.toFixed(4)}°{zone.lat >= 0 ? "N" : "S"}, {zone.lng.toFixed(4)}°E · Click to listen
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent threat events quick view */}
              {threatEvents.length > 0 && (
                <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
                  <p className="text-sm font-bold text-red-800 mb-4 font-[family-name:var(--font-display)]">🚨 Recent Threat Detections</p>
                  <div className="space-y-2">
                    {threatEvents.slice(0, 4).map((evt) => (
                      <div key={evt.id} className="bg-white rounded-xl p-3 border border-red-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{evt.soundClass.icon}</span>
                          <div>
                            <p className="text-sm font-bold text-gray-800 font-[family-name:var(--font-body)]">{evt.soundClass.label} — {evt.zoneName}</p>
                            <p className="text-xs text-gray-500 font-[family-name:var(--font-body)]">{evt.timeAgo} · {evt.confidence}% confidence · {evt.sensorId}</p>
                          </div>
                        </div>
                        {evt.alertSent && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold font-[family-name:var(--font-body)]">✓ Alert Sent</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: LIVE DETECTION ═══ */}
          {activeTab === "listen" && (
            <div className="space-y-6 animate-fade-in">
              {/* Zone selector inline */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3 font-[family-name:var(--font-body)]">Active Sensor Zone</p>
                <div className="flex flex-wrap gap-2">
                  {selectedForest.sensorZones.map((zone) => (
                    <button
                      key={zone.name}
                      onClick={() => { setSelectedZone(zone); stopListening(); setLiveDetection(null); }}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all font-[family-name:var(--font-body)]
                        ${selectedZone.name === zone.name
                          ? "bg-[#1a2e1a] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      {zone.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio waveform + Controls */}
              <div className={`rounded-2xl border p-6 sm:p-8 transition-all ${
                isListening
                  ? liveDetection?.isThreat
                    ? "bg-red-50 border-red-200 shadow-lg shadow-red-100"
                    : "bg-amber-50 border-amber-200 shadow-md"
                  : "bg-white border-gray-100 shadow-sm"
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-gray-800 font-[family-name:var(--font-display)]">
                      🎙️ {selectedZone.name}
                    </p>
                    <p className="text-xs text-gray-500 font-[family-name:var(--font-body)]">
                      {selectedZone.lat.toFixed(4)}°{selectedZone.lat >= 0 ? "N" : "S"}, {selectedZone.lng.toFixed(4)}°E · Risk: {selectedZone.riskScore}/100
                    </p>
                  </div>
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all font-[family-name:var(--font-body)]
                      ${isListening
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-[#2d6a4f] hover:bg-[#1b4332] text-white shadow-lg shadow-[#2d6a4f]/25 hover:scale-105"
                      }`}
                  >
                    {isListening ? (
                      <><span className="w-3 h-3 bg-white rounded-sm" /> Stop Listening</>
                    ) : (
                      <><span className="w-3 h-3 bg-white rounded-full" /> Start Live Detection</>
                    )}
                  </button>
                </div>

                {/* Waveform */}
                <div className={`rounded-xl p-4 mb-4 ${isListening ? "bg-black/5" : "bg-gray-50"}`}>
                  <AudioWaveform active={isListening} threat={liveDetection?.isThreat} />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400 font-[family-name:var(--font-body)]">
                      {isListening ? "Processing audio stream..." : "Sensor idle — press Start to begin"}
                    </span>
                    {isListening && liveDetection && (
                      <span className="text-[10px] text-gray-400 font-[family-name:var(--font-body)]">
                        {liveDetection.audioDbLevel} dB
                      </span>
                    )}
                  </div>
                </div>

                {/* Classification result */}
                {isListening && liveDetection && (
                  <div className={`rounded-xl p-5 border animate-fade-in ${
                    liveDetection.isThreat
                      ? "bg-red-100 border-red-200"
                      : "bg-green-50 border-green-200"
                  }`}>
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">{liveDetection.soundClass.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className={`text-lg font-bold font-[family-name:var(--font-display)] ${liveDetection.isThreat ? "text-red-800" : "text-green-800"}`}>
                            {liveDetection.soundClass.label}
                          </p>
                          {liveDetection.isThreat && (
                            <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-bold animate-pulse">⚠️ THREAT</span>
                          )}
                        </div>
                        <p className={`text-sm font-[family-name:var(--font-body)] ${liveDetection.isThreat ? "text-red-600" : "text-green-600"}`}>
                          {liveDetection.soundClass.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <div>
                            <p className="text-[10px] uppercase text-gray-500 font-semibold font-[family-name:var(--font-body)]">Confidence</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${liveDetection.isThreat ? "bg-red-500" : "bg-green-500"}`}
                                  style={{ width: `${liveDetection.confidence}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-gray-700 font-[family-name:var(--font-body)]">{liveDetection.confidence}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-gray-500 font-semibold font-[family-name:var(--font-body)]">Sensor</p>
                            <p className="text-xs font-bold text-gray-700 mt-1 font-[family-name:var(--font-body)]">{liveDetection.sensorId}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-gray-500 font-semibold font-[family-name:var(--font-body)]">Level</p>
                            <p className="text-xs font-bold text-gray-700 mt-1 font-[family-name:var(--font-body)]">{liveDetection.audioDbLevel} dB</p>
                          </div>
                        </div>
                        {liveDetection.alertSent && (
                          <div className="mt-3 bg-white/80 rounded-lg p-3 border border-green-200">
                            <p className="text-xs text-green-700 font-bold font-[family-name:var(--font-body)]">
                              ✅ Alert dispatched to NFA rangers and community forest association via SMS &amp; WhatsApp
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isListening && !liveDetection && (
                  <div className="text-center py-6">
                    <div className="flex items-center justify-center gap-1.5 mb-3">
                      <div className="w-2 h-2 rounded-full bg-[#2d6a4f]/40 typing-dot" />
                      <div className="w-2 h-2 rounded-full bg-[#2d6a4f]/40 typing-dot" />
                      <div className="w-2 h-2 rounded-full bg-[#2d6a4f]/40 typing-dot" />
                    </div>
                    <p className="text-sm text-gray-500 font-[family-name:var(--font-body)]">
                      Initializing neural network classifier... Listening for audio patterns
                    </p>
                  </div>
                )}
              </div>

              {/* Sound classification reference */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <p className="text-sm font-bold text-gray-800 mb-4 font-[family-name:var(--font-display)]">🔊 Sound Classification Model — 9 Categories</p>
                <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                  {SOUND_CLASSES.map((sc) => (
                    <div key={sc.id} className={`rounded-xl p-3 border text-center transition-all hover:shadow-sm
                      ${sc.threat ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}
                    >
                      <span className="text-2xl block mb-1">{sc.icon}</span>
                      <p className={`text-xs font-bold font-[family-name:var(--font-body)] ${sc.threat ? "text-red-700" : "text-green-700"}`}>{sc.label}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.threat ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                        {sc.threat ? "Threat" : "Safe"}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4 font-[family-name:var(--font-body)]">
                  Model: TensorFlow Lite CNN trained on 12,000+ labeled environmental audio samples. Runs on-device (Raspberry Pi Zero) for &lt;30s classification latency.
                </p>
              </div>
            </div>
          )}

          {/* ═══ TAB: EVENT LOG ═══ */}
          {activeTab === "events" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm font-bold text-gray-800 font-[family-name:var(--font-display)]">
                  Detection Event Log — {selectedForest.name.split("(")[0].trim()}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={downloadEventLog}
                    className="text-xs bg-[#2d6a4f] text-white px-3 py-1.5 rounded-full font-semibold hover:bg-[#1b4332] transition-colors font-[family-name:var(--font-body)] flex items-center gap-1"
                  >
                    📥 Download CSV
                  </button>
                  <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold font-[family-name:var(--font-body)]">
                    {threatEvents.length} threats
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold font-[family-name:var(--font-body)]">
                    {safeEvents.length} safe
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {events.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-sm font-[family-name:var(--font-body)]">No events yet. Start live detection to generate events.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {events.map((evt) => (
                      <div key={evt.id} className={`flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-3.5 transition-all hover:bg-gray-50/50
                        ${evt.isThreat ? "border-l-4 border-l-red-400" : "border-l-4 border-l-green-300"}`}
                      >
                        <span className="text-xl flex-shrink-0">{evt.soundClass.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-800 font-[family-name:var(--font-body)] truncate">{evt.soundClass.label}</p>
                            {evt.isThreat && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold flex-shrink-0">THREAT</span>}
                          </div>
                          <p className="text-xs text-gray-500 font-[family-name:var(--font-body)] truncate">{evt.zoneName} · {evt.sensorId}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-semibold text-gray-600 font-[family-name:var(--font-body)]">{evt.confidence}%</p>
                          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-body)]">{evt.timeAgo}</p>
                        </div>
                        {evt.alertSent && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0 font-[family-name:var(--font-body)]">✓ Alerted</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ TAB: SENSOR MAP ═══ */}
          {activeTab === "sensors" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-800 font-[family-name:var(--font-display)]">
                    📍 Sensor Network — {selectedForest.name.split("(")[0].trim()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-[family-name:var(--font-body)]">{selectedForest.status}</p>
                </div>

                {/* Map visualization */}
                <div className="relative h-80 sm:h-96 bg-gradient-to-br from-[#1b4332] to-[#14532d]">
                  {/* Grid overlay for forest feeling */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%2322c55e'/%3E%3C/svg%3E")`,
                    backgroundSize: "20px 20px"
                  }} />

                  {/* Forest boundary (stylized) */}
                  <div className="absolute inset-8 sm:inset-12 rounded-[3rem] border-2 border-dashed border-white/15" />
                  <div className="absolute inset-12 sm:inset-20 rounded-[2rem] bg-[#22c55e]/8" />

                  {/* Sensor nodes */}
                  {selectedForest.sensorZones.map((zone, i) => {
                    const positions = [
                      { x: 20, y: 25 },
                      { x: 75, y: 20 },
                      { x: 25, y: 70 },
                      { x: 65, y: 65 },
                    ];
                    const pos = positions[i] || { x: 50, y: 50 };
                    const isActive = selectedZone.name === zone.name;
                    const color = zone.riskScore >= 80 ? "#ef4444" : zone.riskScore >= 60 ? "#f97316" : zone.riskScore >= 40 ? "#eab308" : "#22c55e";

                    return (
                      <div
                        key={zone.name}
                        className="absolute transition-all duration-500 cursor-pointer group"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        onClick={() => { setSelectedZone(zone); setActiveTab("listen"); }}
                      >
                        {/* Pulse ring */}
                        {zone.riskScore >= 70 && (
                          <div className="absolute -inset-5 rounded-full animate-ping opacity-20" style={{ backgroundColor: color }} />
                        )}
                        {isActive && (
                          <div className="absolute -inset-4 rounded-full animate-pulse" style={{ backgroundColor: `${color}30`, border: `2px solid ${color}` }} />
                        )}

                        {/* Node */}
                        <div
                          className={`relative w-4 h-4 rounded-full border-2 border-white shadow-lg ${isActive ? "scale-150" : "hover:scale-125"} transition-transform`}
                          style={{ backgroundColor: color }}
                        />

                        {/* Label */}
                        <div className={`absolute ${i % 2 === 0 ? "left-6" : "right-6 text-right"} top-1/2 -translate-y-1/2 bg-white/95 rounded-lg px-3 py-2 shadow-lg whitespace-nowrap transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                             style={{ minWidth: "140px" }}>
                          <p className="text-xs font-bold text-gray-800">{zone.name}</p>
                          <p className="text-[10px] text-gray-500">Risk: {zone.riskScore}/100</p>
                          <p className="text-[10px] text-blue-500">Click to listen →</p>
                        </div>

                        {/* Sensor icon */}
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-sm">🎙️</div>
                      </div>
                    );
                  })}

                  {/* Forest label */}
                  <div className="absolute top-3 left-4 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                    <p className="text-[10px] text-white/80 font-semibold font-[family-name:var(--font-body)]">
                      🌳 {selectedForest.name.split("(")[0].trim()} · {selectedForest.area}
                    </p>
                  </div>

                  {/* Legend */}
                  <div className="absolute bottom-3 left-4 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                    <div className="flex items-center gap-3 text-[10px] text-white/70">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> High</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Moderate</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Low</span>
                    </div>
                  </div>

                  <div className="absolute top-3 right-4 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                    <p className="text-[10px] text-white/60 font-[family-name:var(--font-body)]">{selectedForest.region}, Uganda</p>
                  </div>
                </div>
              </div>

              {/* Sensor zone details table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-800 font-[family-name:var(--font-display)]">Sensor Zone Details</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-5 py-3 text-xs uppercase tracking-widest text-gray-400 font-semibold font-[family-name:var(--font-body)]">Zone</th>
                        <th className="px-5 py-3 text-xs uppercase tracking-widest text-gray-400 font-semibold font-[family-name:var(--font-body)]">Coordinates</th>
                        <th className="px-5 py-3 text-xs uppercase tracking-widest text-gray-400 font-semibold font-[family-name:var(--font-body)]">Risk</th>
                        <th className="px-5 py-3 text-xs uppercase tracking-widest text-gray-400 font-semibold font-[family-name:var(--font-body)]">Status</th>
                        <th className="px-5 py-3 text-xs uppercase tracking-widest text-gray-400 font-semibold font-[family-name:var(--font-body)]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedForest.sensorZones.map((zone) => (
                        <tr key={zone.name} className="hover:bg-gray-50/50">
                          <td className="px-5 py-3">
                            <p className="font-bold text-gray-800 font-[family-name:var(--font-body)]">{zone.name}</p>
                            <p className="text-xs text-gray-500 font-[family-name:var(--font-body)]">{zone.description}</p>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-500 font-[family-name:var(--font-body)]">
                            {zone.lat.toFixed(4)}°, {zone.lng.toFixed(4)}°
                          </td>
                          <td className="px-5 py-3"><RiskBadge score={zone.riskScore} /></td>
                          <td className="px-5 py-3">
                            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 font-[family-name:var(--font-body)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => { setSelectedZone(zone); setActiveTab("listen"); }}
                              className="text-xs bg-[#2d6a4f] text-white px-3 py-1.5 rounded-full font-semibold hover:bg-[#1b4332] transition-colors font-[family-name:var(--font-body)]"
                            >
                              Listen →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tech stack */}
              <div className="bg-[#1a2e1a] rounded-2xl p-6 sm:p-8">
                <p className="text-xs uppercase tracking-[0.3em] text-[#a7f3d0] font-semibold mb-4 font-[family-name:var(--font-body)]">Hardware Stack Per Sensor Node</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { component: "Raspberry Pi Zero 2W", purpose: "On-device AI inference", cost: "$15" },
                    { component: "MEMS Microphone (I2S)", purpose: "Audio capture, 16kHz sample rate", cost: "$3" },
                    { component: "6W Solar Panel + Battery", purpose: "Off-grid power, 72h autonomy", cost: "$25" },
                    { component: "LoRaWAN Transceiver", purpose: "Long-range data (10km+)", cost: "$8" },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-white text-sm font-bold font-[family-name:var(--font-display)]">{item.component}</p>
                      <p className="text-white/50 text-xs mt-1 font-[family-name:var(--font-body)]">{item.purpose}</p>
                      <p className="text-[#4ade80] text-lg font-bold mt-2 font-[family-name:var(--font-display)]">{item.cost}</p>
                    </div>
                  ))}
                </div>
                <p className="text-white/40 text-xs mt-4 font-[family-name:var(--font-body)]">
                  Total cost per sensor node: ~$51 · Model: TensorFlow Lite CNN (quantized, 2MB) · Connectivity: LoRaWAN mesh to central gateway with 3G/4G uplink
                </p>
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-16 bg-gradient-to-br from-[#1a2e1a] to-[#0a1f13] rounded-[2.5rem] p-8 sm:p-14 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#4ade80]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4 font-[family-name:var(--font-display)]">
                Protecting Uganda&apos;s Last Forests
              </h2>
              <p className="text-white/60 text-lg max-w-xl mx-auto mb-8 font-[family-name:var(--font-body)]">
                The Acoustic Sentinel scales across the Congo Basin, Kenya&apos;s community forests, and Ghana&apos;s cocoa belt. Every forest deserves a guardian.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/urban-warning"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-full text-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/25 w-full sm:w-auto"
                >
                  Urban Warning System →
                </Link>
                <Link
                  href="/advisor"
                  className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0a1f13] font-bold px-8 py-4 rounded-full text-lg transition-all hover:scale-105 shadow-lg shadow-[#4ade80]/25 w-full sm:w-auto"
                >
                  Try AI Advisor →
                </Link>
                <Link
                  href="/solution"
                  className="border-2 border-white/20 text-white hover:bg-white/10 font-bold px-8 py-4 rounded-full text-lg transition-all w-full sm:w-auto"
                >
                  View All Solutions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
